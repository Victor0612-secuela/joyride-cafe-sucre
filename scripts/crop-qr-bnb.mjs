import sharp from 'sharp';
import path from 'node:path';

const ROOT = process.cwd();
const srcPath = path.join(ROOT, 'client', 'public', 'assets', 'brand', 'qr-bnb-real.jpg');
const outPath = path.join(ROOT, 'client', 'public', 'assets', 'brand', 'qr-bnb-cropped.png');

async function main() {
  const img = sharp(srcPath);
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  console.log(`Source dimensions: ${width}x${height}, channels=${channels}`);

  // Scan region between 12% and 78% of height to find strict dark QR matrix bounds (excludes green BNB banner and bottom text)
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  const yStart = Math.floor(height * 0.12);
  const yEnd = Math.floor(height * 0.76);

  for (let y = yStart; y < yEnd; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      // Strictly dark neutral QR module (avoid green BNB text or faint anti-aliased noise)
      if (r < 75 && g < 75 && b < 75) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const side = Math.max(cropW, cropH);
  console.log(`Detected QR matrix box: x=${minX}..${maxX} (${cropW}), y=${minY}..${maxY} (${cropH})`);

  await sharp(srcPath)
    .extract({
      left: Math.max(0, minX - 6),
      top: Math.max(0, minY - 6),
      width: Math.min(width - Math.max(0, minX - 6), side + 12),
      height: Math.min(height - Math.max(0, minY - 6), side + 12),
    })
    .extend({
      top: 24,
      bottom: 24,
      left: 24,
      right: 24,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .resize(520, 520, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .png()
    .toFile(outPath);

  console.log(`Cropped clean square QR saved to ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
