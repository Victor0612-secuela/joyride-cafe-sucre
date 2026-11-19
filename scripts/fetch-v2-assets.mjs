import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const IMAGES_DIR = path.join(ROOT, 'client', 'public', 'images');
await fs.mkdir(IMAGES_DIR, { recursive: true });

async function saveBufferAsWebp(buf, outName, maxWidth = 800) {
  let q = 82;
  let outBuf = await sharp(buf)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality: q })
    .toBuffer();

  while (outBuf.length > 120 * 1024 && q > 52) {
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

async function existsOut(outName) {
  return fs.access(path.join(IMAGES_DIR, outName)).then(() => true).catch(() => false);
}

async function searchWikimediaFile(queries) {
  for (const q of queries) {
    const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srnamespace=6&srlimit=6&format=json`;
    const res = await fetch(apiUrl, {
      headers: { 'User-Agent': 'JoyRideCafeSucreBot/1.0 (https://joyridebol.com)' },
      signal: AbortSignal.timeout(15000),
    });
    const data = await res.json();
    const hits = data?.query?.search || [];
    for (const h of hits) {
      const title = h.title.replace(/^File:/, '');
      if (/\.(jpg|jpeg|png|webp)$/i.test(title) && !/logo|icon|map|flag/i.test(title)) {
        return title;
      }
    }
  }
  throw new Error(`No Wikimedia image found for ${queries.join(' / ')}`);
}

async function fetchWikimedia(fileTitle, outName, maxWidth = 800) {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileTitle)}?width=${maxWidth + 100}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'JoyRideCafeSucreBot/1.0 (https://joyridebol.com)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    throw new Error(`Wikimedia fetch failed for ${fileTitle}: ${res.status}`);
  }
  const ab = await res.arrayBuffer();
  await saveBufferAsWebp(Buffer.from(ab), outName, maxWidth);
}

async function main() {
  const items = [
    { out: 'dish-the-hulk.webp', w: 800, queries: ['Green cocktail glass lime', 'Midori sour cocktail'] },
    { out: 'dish-cucaracha.webp', w: 800, queries: ['Flaming cocktail shot glass', 'B52 shot cocktail'] },
    { out: 'dish-daiquiri.webp', w: 800, queries: ['Strawberry daiquiri frozen cocktail', 'Strawberry cocktail'] },
    { out: 'dish-pina-colada.webp', w: 800, queries: ['Pina colada cocktail pineapple', 'Piña Colada'] },
    { out: 'dish-chorro.webp', w: 800, queries: ['White Russian cocktail glass', 'Black Russian cocktail'] },
    { out: 'dish-poncho.webp', w: 800, queries: ['Warm spiced cocktail cinnamon', 'Hot cocktail glass'] },
    { out: 'dish-pizza.webp', w: 800, queries: ['Pizza quattro formaggi', 'Wood fired pizza margherita'] },
    { out: 'venue-bar-cocktails.webp', w: 960, queries: ['Nightclub bar bartender cocktails', 'Cocktail bar bottles lights'] },
    { out: 'venue-patio-night.webp', w: 960, queries: ['Courtyard restaurant night lanterns', 'Colonial patio cafe night'] },
    { out: 'venue-lounge-lights.webp', w: 960, queries: ['Disco ball', 'Nightclub lights'] },
  ];

  for (const item of items) {
    if (await existsOut(item.out)) {
      console.log(`Skipped existing ${item.out}`);
      continue;
    }
    try {
      const title = await searchWikimediaFile(item.queries);
      console.log(`Found [${item.out}]: ${title}`);
      await fetchWikimedia(title, item.out, item.w);
    } catch (err) {
      console.warn(`Fallback needed for ${item.out}: ${err.message}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
