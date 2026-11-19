import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const BRAND_DIR = path.join(ROOT, 'client', 'public', 'assets', 'brand');
const PUBLIC_DIR = path.join(ROOT, 'client', 'public');
const IMAGES_DIR = path.join(ROOT, 'client', 'public', 'images');

await fs.mkdir(BRAND_DIR, { recursive: true });
await fs.mkdir(IMAGES_DIR, { recursive: true });

const BASE = 'https://joyridebol.com/img/';

async function downloadBuffer(fileName) {
  const url = `${BASE}${fileName}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  }
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function optimizeLogo(srcName, outPaths, maxWidth = 512) {
  const buf = await downloadBuffer(srcName);
  const outBuf = await sharp(buf)
    .resize({ width: maxWidth, withoutEnlargement: true })
    .png({ compressionLevel: 9, palette: true, quality: 85 })
    .toBuffer();

  for (const outPath of outPaths) {
    await fs.writeFile(outPath, outBuf);
    console.log(`Saved logo ${path.relative(ROOT, outPath)} (${(outBuf.length / 1024).toFixed(1)} KB)`);
  }
}

async function optimizeWebp(srcName, outName, maxWidth = 800, quality = 80) {
  const outPath = path.join(IMAGES_DIR, outName);
  const exists = await fs.access(outPath).then(() => true).catch(() => false);
  if (exists) {
    console.log(`Skipped existing ${outName}`);
    return;
  }
  const buf = await downloadBuffer(srcName);
  let q = quality;
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

  await fs.writeFile(outPath, outBuf);
  console.log(`Saved ${path.relative(ROOT, outPath)} (${(outBuf.length / 1024).toFixed(1)} KB, q=${q})`);
}

async function main() {
  console.log('=== Downloading & Optimizing Joy Ride Cafe Official Assets ===');
  await optimizeLogo('logo1.png', [
    path.join(PUBLIC_DIR, 'logo-joyride.png'),
    path.join(BRAND_DIR, 'logo-joyride.png'),
  ], 512);

  await optimizeLogo('logo2.png', [
    path.join(BRAND_DIR, 'logo-alt.png'),
  ], 512);

  const scenes = [
    ['portada.png', 'hero-joyride.webp', 1440, 82],
    ['catedral.jpg', 'sucre-catedral.webp', 960, 82],
    ['salsa.png', 'salsa-bachata.webp', 900, 80],
    ['bateria.jpg', 'musica-vivo.webp', 900, 80],
    ['chicas.jpg', 'fiesta-amigos.webp', 900, 80],
    ['romance.png', 'experiencia-bar.webp', 900, 80],
    ['tacos.png', 'picada-tacos.webp', 900, 80],
    ['evento1.jpg', 'evento-grupos.webp', 900, 80],
    ['evento2.jpg', 'evento-especial.webp', 900, 80],
    ['evento3.jpg', 'evento-tours.webp', 900, 80],
    ['c1.png', 'carousel-1.webp', 900, 80],
    ['c2.png', 'carousel-2.webp', 900, 80],
    ['c3.png', 'carousel-3.webp', 900, 80],
    ['c4.png', 'carousel-4.webp', 900, 80],
    ['c5.png', 'carousel-5.webp', 900, 80],
  ];

  const dishes = [
    ['m1.png', 'dish-pique-macho.webp', 800, 82],
    ['m2.png', 'dish-alitas-bbq.webp', 800, 82],
    ['m3.png', 'dish-trucha-quinua.webp', 800, 82],
    ['m4.png', 'dish-plato-paceno.webp', 800, 82],
    ['m5.png', 'dish-bife-crema.webp', 800, 82],
    ['m6.png', 'dish-charque.webp', 800, 82],
    ['m7.png', 'dish-ensalada-joy.webp', 800, 82],
    ['m8.png', 'dish-pasta-bolognesa.webp', 800, 82],
    ['m9.png', 'dish-pasta-hongos.webp', 800, 82],
    ['m10.png', 'dish-desayuno-chaki.webp', 800, 82],
    ['m11.png', 'dish-desayuno-saludable.webp', 800, 82],
    ['m12.png', 'dish-desayuno-frances.webp', 800, 82],
  ];

  for (const [src, out, w, q] of [...scenes, ...dishes]) {
    await optimizeWebp(src, out, w, q);
  }

  console.log('All Joy Ride Cafe official assets fetched and optimized!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
