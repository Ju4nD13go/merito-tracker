// Generates the favicon and PWA icons from a source image using sharp.
// Run: node scripts/generate-icons.mjs
// Source:    scripts/assets/icono_merito.png
// Outputs:   src/app/favicon.ico, src/app/icon.png,
//            public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "scripts/assets/icono_merito.png");
const APP_DIR = join(ROOT, "src/app");
const OUT_DIR = join(ROOT, "public");

// Content rendered inside the maskable safe zone (80% of the canvas).
const SAFE = 0.64;

// Average RGB of the outer border of the source image. Used as the maskable
// background so the padded icon blends with its own design.
async function edgeColor() {
  const img = sharp(SRC);
  const { width, height } = await img.metadata();
  const band = Math.round(Math.max(width, height) * 0.06);
  const stats = await img
    .extract({
      left: 0,
      top: 0,
      width: band,
      height,
    })
    .stats();
  return [
    Math.round(stats.channels[0].mean),
    Math.round(stats.channels[1].mean),
    Math.round(stats.channels[2].mean),
  ];
}

async function resizeInto(size, outPath) {
  await sharp(SRC)
    .resize(size, size, { fit: "cover" })
    .png()
    .toFile(outPath);
}

const bg = await edgeColor();
console.log("Maskable background:", bg);

// Modern PNG icon — Next.js serves it automatically via app/icon.png
// (App Router turns it into <link rel="icon"> without extra config).
await resizeInto(512, join(APP_DIR, "icon.png"));
console.log("✔ src/app/icon.png");

// PWA icons.
await resizeInto(192, join(OUT_DIR, "icon-192.png"));
console.log("✔ public/icon-192.png");
await resizeInto(512, join(OUT_DIR, "icon-512.png"));
console.log("✔ public/icon-512.png");

// Maskable: source centered at SAFE scale on the edge-color background.
const inner = Math.round(512 * SAFE);
const pad = Math.round((512 - inner) / 2);
await sharp({
  create: {
    width: 512,
    height: 512,
    channels: 3,
    background: { r: bg[0], g: bg[1], b: bg[2] },
  },
})
  .composite([
    {
      input: await sharp(SRC)
        .resize(inner, inner, { fit: "cover" })
        .png()
        .toBuffer(),
      left: pad,
      top: pad,
    },
  ])
  .png()
  .toFile(join(OUT_DIR, "icon-maskable-512.png"));
console.log("✔ public/icon-maskable-512.png");

console.log("Icons written.");