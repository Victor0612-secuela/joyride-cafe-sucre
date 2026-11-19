import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const IMAGES_DIR = path.join(ROOT, 'client', 'public', 'images');
await fs.mkdir(IMAGES_DIR, { recursive: true });

async function saveBufferAsWebp(buf, outName, maxWidth = 1100) {
  let q = 84;
  let outBuf = await sharp(buf)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: q })
    .toBuffer();

  while (outBuf.length > 120 * 1024 && q > 50) {
    q -= 8;
    outBuf = await sharp(buf)
      .resize({ width: maxWidth, withoutEnlargement: true })
      .webp({ quality: q })
      .toBuffer();
  }

  const outPath = path.join(IMAGES_DIR, outName);
  await fs.writeFile(outPath, outBuf);
  console.log(`Saved ${outName} (${(outBuf.length / 1024).toFixed(1)} KB, q=${q})`);
}

async function existsLargeEnough(outName) {
  try {
    const stat = await fs.stat(path.join(IMAGES_DIR, outName));
    return stat.size > 10 * 1024;
  } catch {
    return false;
  }
}

async function searchWikimediaTitles(queries) {
  const candidates = [];
  for (const q of queries) {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
      q
    )}&srnamespace=6&srlimit=8&format=json`;
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'JoyRideCafeSucreBot/1.0 (https://joyridebol.com)' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) continue;
    const data = await res.json();
    const hits = data?.query?.search || [];
    for (const h of hits) {
      const title = h.title.replace(/^File:/, '');
      if (/\.(jpg|jpeg|png|webp)$/i.test(title) && !/logo|icon|map|flag|coat|svg|diagram/i.test(title)) {
        candidates.push(title);
      }
    }
  }
  return candidates;
}

async function fetchWikimediaCandidate(fileTitle, outName, maxWidth = 1100) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileTitle)}?width=${maxWidth}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'JoyRideCafeSucreBot/1.0 (https://joyridebol.com)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(22000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ab = await res.arrayBuffer();
  const buf = Buffer.from(ab);
  if (buf.length < 8 * 1024) throw new Error('Image too small');
  await saveBufferAsWebp(buf, outName, maxWidth);
}

async function main() {
  const items = [
    {
      out: 'sucre-chocolates.webp',
      w: 1100,
      queries: ['Artisan chocolate truffles praline', 'Handmade chocolates bonbons'],
      fallbackExisting: 'dish-brownie-2x1.webp',
    },
    {
      out: 'sucre-rooftop-terraza.webp',
      w: 1100,
      queries: ['Rooftop bar terrace night city view', 'Rooftop cocktail bar sunset'],
      fallbackExisting: 'venue-patio-night.webp',
    },
    {
      out: 'sucre-purgatorium.webp',
      w: 1100,
      queries: ['Cocktail bar lounge dark moody', 'Craft cocktail bar stone wall'],
      fallbackExisting: 'venue-bar-cocktails.webp',
    },
    {
      out: 'sucre-colonial-museum.webp',
      w: 1100,
      queries: ['Casa de la Libertad Sucre Bolivia', 'San Felipe Neri Sucre roof'],
      fallbackExisting: 'sucre-catedral.webp',
    },
    {
      out: 'sucre-mirador-sunset.webp',
      w: 1100,
      queries: ['Recoleta Sucre Bolivia view', 'Sucre Bolivia panoramic view'],
      fallbackExisting: 'evento-tours.webp',
    },
    {
      out: 'sucre-maragua-bike.webp',
      w: 1100,
      queries: ['Maragua crater Bolivia', 'Cal Orcko Sucre Bolivia'],
      fallbackExisting: 'hero-joyride.webp',
    },
  ];

  for (const item of items) {
    if (await existsLargeEnough(item.out)) {
      console.log(`Skipped existing ${item.out}`);
      continue;
    }

    let saved = false;
    try {
      const titles = await searchWikimediaTitles(item.queries);
      for (const title of titles) {
        try {
          console.log(`Trying [${item.out}]: ${title}`);
          await fetchWikimediaCandidate(title, item.out, item.w);
          saved = true;
          break;
        } catch (err) {
          console.warn(`Candidate failed (${title}): ${err.message}`);
        }
      }
    } catch (err) {
      console.warn(`Search error for ${item.out}: ${err.message}`);
    }

    if (!saved) {
      const fbBuf = await fs.readFile(path.join(IMAGES_DIR, item.fallbackExisting));
      await saveBufferAsWebp(fbBuf, item.out, item.w);
      console.log(`Used fallback ${item.fallbackExisting} -> ${item.out}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
