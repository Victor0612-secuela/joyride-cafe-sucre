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

async function fetchWikimedia(fileTitle, outName) {
  if (await existsOut(outName)) {
    console.log(`Skipped existing ${outName}`);
    return;
  }
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileTitle)}?width=900`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'JoyRideCafeSucreBot/1.0 (https://joyridebol.com)' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) {
    throw new Error(`Wikimedia fetch failed for ${fileTitle}: ${res.status}`);
  }
  const ab = await res.arrayBuffer();
  await saveBufferAsWebp(Buffer.from(ab), outName, 800);
}

async function searchWikimediaFile(query) {
  const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=5&format=json`;
  const res = await fetch(apiUrl, {
    headers: { 'User-Agent': 'JoyRideCafeSucreBot/1.0 (https://joyridebol.com)' },
  });
  const data = await res.json();
  const hits = data?.query?.search || [];
  for (const h of hits) {
    const title = h.title.replace(/^File:/, '');
    if (/\.(jpg|jpeg|png|webp)$/i.test(title)) {
      return title;
    }
  }
  throw new Error(`No Wikimedia image found for ${query}`);
}

async function main() {
  // 1. Convert generated images from brain folder
  const genPairs = [
    ['C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\f414be69-7427-4629-b46b-7fba665dc63f\\joyride_burger_1795067032649.jpg', 'dish-burger.webp'],
    ['C:\\Users\\VICTUS\\.gemini\\antigravity\\brain\\f414be69-7427-4629-b46b-7fba665dc63f\\joyride_mojito_1795067035406.jpg', 'dish-mojito.webp'],
  ];
  for (const [src, out] of genPairs) {
    const buf = await fs.readFile(src);
    await saveBufferAsWebp(buf, out, 800);
  }

  // 2. Fetch curated Wikimedia Commons culinary photographs
  const exactFiles = [
    ['Negroni (cocktail).jpg', 'dish-negroni.webp'],
    ['Chocolatebrownie.JPG', 'dish-brownie-2x1.webp'],
    ['Successful baked cheesecake.jpg', 'dish-cheesecake.webp'],
    ['My favourite cappuccino.jpg', 'dish-cafe-altura.webp'],
    ['Craft beer and non-alcoholic cocktail at restaurant Plaza.jpg', 'dish-cerveza-2x1.webp'],
  ];

  for (const [fileTitle, out] of exactFiles) {
    await fetchWikimedia(fileTitle, out);
  }

  // 3. Search & fetch nachos, chuflay-style lime highball, sangria
  const dynamicQueries = [
    ['Nachos cheese jalapenos guacamole', 'dish-nachos.webp'],
    ['Gin and tonic lime ice cocktail glass', 'dish-chuflay.webp'],
    ['Sangria wine fruit', 'dish-sangria.webp'],
  ];

  for (const [q, out] of dynamicQueries) {
    if (await existsOut(out)) {
      console.log(`Skipped existing ${out}`);
      continue;
    }
    const title = await searchWikimediaFile(q);
    console.log(`Found Wikimedia file for "${q}": ${title}`);
    await fetchWikimedia(title, out);
  }

  console.log('All extra culinary assets ready!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
