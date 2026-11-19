import fs from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = process.cwd();
const BRAND_DIR = path.join(ROOT, 'client', 'public', 'assets', 'brand');
const IMAGES_DIR = path.join(ROOT, 'client', 'public', 'images');

const UPLOADED_EMBLEM_SRC =
  'C:/Users/VICTUS/.gemini/antigravity/brain/f414be69-7427-4629-b46b-7fba665dc63f/.user_uploaded/media_1795107487775_32de897e.png';

const OFFICIAL_IMAGE_SOURCES = [
  { remote: 'img/bateria.jpg', dest: 'joyride-live-band.webp' },
  { remote: 'img/chicas.jpg', dest: 'joyride-friends-night.webp' },
  { remote: 'img/romance.png', dest: 'joyride-dinner-experience.webp' },
  { remote: 'img/portadae.png', dest: 'joyride-events-stage.webp' },
  { remote: 'img/evento1.jpg', dest: 'joyride-evento-1.webp' },
  { remote: 'img/evento2.jpg', dest: 'joyride-evento-2.webp' },
  { remote: 'img/evento3.jpg', dest: 'joyride-evento-3.webp' },
  { remote: 'img/portada.png', dest: 'joyride-official-portada.webp' },
  { remote: 'img/logo2.png', dest: 'joyride-logo2.webp' },
];

async function generateTransparentCutouts() {
  await fs.mkdir(BRAND_DIR, { recursive: true });
  const originalDest = path.join(BRAND_DIR, 'joyride-emblem-probably.png');
  await fs.copyFile(UPLOADED_EMBLEM_SRC, originalDest);
  console.log(`[BRAND] Copied original emblem -> ${originalDest}`);

  const { data, info } = await sharp(UPLOADED_EMBLEM_SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const whiteBuf = Buffer.alloc(width * height * 4);
  const darkBuf = Buffer.alloc(width * height * 4);

  for (let i = 0; i < width * height; i++) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;
    const r = data[srcIdx];
    const g = data[srcIdx + 1];
    const b = data[srcIdx + 2];
    const lum = (r + g + b) / 3;
    const alpha = lum < 28 ? 0 : Math.min(255, Math.round((lum - 28) * 1.15));

    // White transparent cutout (Dark mode & dark overlays)
    whiteBuf[dstIdx] = 255;
    whiteBuf[dstIdx + 1] = 255;
    whiteBuf[dstIdx + 2] = 255;
    whiteBuf[dstIdx + 3] = alpha;

    // Deep obsidian ink cutout (Light mode & white print receipts)
    darkBuf[dstIdx] = 15;
    darkBuf[dstIdx + 1] = 23;
    darkBuf[dstIdx + 2] = 42;
    darkBuf[dstIdx + 3] = alpha;
  }

  const paddingOpt = {
    top: 16,
    bottom: 16,
    left: 16,
    right: 16,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  };

  const whiteTrimmed = await sharp(whiteBuf, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 5 })
    .extend(paddingOpt)
    .png()
    .toBuffer();

  const darkTrimmed = await sharp(darkBuf, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 5 })
    .extend(paddingOpt)
    .png()
    .toBuffer();

  const whitePath = path.join(BRAND_DIR, 'joyride-emblem-probably-white.png');
  const darkPath = path.join(BRAND_DIR, 'joyride-emblem-probably-dark.png');
  await fs.writeFile(whitePath, whiteTrimmed);
  await fs.writeFile(darkPath, darkTrimmed);

  const metaW = await sharp(whitePath).metadata();
  const metaD = await sharp(darkPath).metadata();
  console.log(`[BRAND] White cutout: ${metaW.width}x${metaW.height} -> ${whitePath}`);
  console.log(`[BRAND] Dark cutout: ${metaD.width}x${metaD.height} -> ${darkPath}`);
}

function downloadIpv4Buffer(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { family: 4 }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadIpv4Buffer(res.headers.location, timeoutMs).then(resolve, reject);
        return;
      }
      if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error(`Timeout after ${timeoutMs}ms`));
    });
    req.on('error', reject);
  });
}

async function downloadOfficialPhotos() {
  await fs.mkdir(IMAGES_DIR, { recursive: true });

  await Promise.all(
    OFFICIAL_IMAGE_SOURCES.map(async (item) => {
      const url = `https://www.joyridebol.com/${item.remote}`;
      const destPath = path.join(IMAGES_DIR, item.dest);
      try {
        const inputBuf = await downloadIpv4Buffer(url, 20000);
        const meta = await sharp(inputBuf).metadata();

        if (!meta.width || meta.width < 500) {
          console.warn(`[SKIP] ${url} -> dimensions too small (${meta.width}x${meta.height})`);
          return;
        }

        const pipeline = sharp(inputBuf).rotate();
        if (meta.width > 1400) {
          pipeline.resize({ width: 1400, withoutEnlargement: true });
        }
        const outBuf = await pipeline.webp({ quality: 84 }).toBuffer();
        await fs.writeFile(destPath, outBuf);

        const finalMeta = await sharp(outBuf).metadata();
        console.log(
          `[PHOTO] ${item.remote} (${meta.width}x${meta.height}) -> ${item.dest} (${finalMeta.width}x${finalMeta.height}, ${outBuf.length} bytes)`
        );
      } catch (err) {
        console.warn(`[WARN] Failed ${url}: ${err instanceof Error ? err.message : String(err)}`);
      }
    })
  );
}

async function main() {
  await generateTransparentCutouts();
  await downloadOfficialPhotos();
  console.log('[DONE] Official Joy Ride assets processed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
