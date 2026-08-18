// Generates the PWA icons (PNG) with zero dependencies.
// Pure Node: manual PNG chunk encoding (IHDR/IDAT/IEND) + zlib from the stdlib.
// Run: node scripts/generate-icons.mjs
// Output: public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png

import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = join(ROOT, "public");

const GREEN = [0x1e, 0x5e, 0x3f, 255]; // brand primary
const GOLD = [0xd4, 0xa7, 0x2c, 255]; // brand accent

// ---- PNG encoding helpers ------------------------------------------------

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Icon design ----------------------------------------------------------

function makeIcon(size, { safeArea = 1 } = {}) {
  const px = Buffer.alloc(size * size * 4);
  const c = size / 2;
  // Diamond (rotated square) inscribed in a circle with center 'c'.
  const half = (size * 0.42) * safeArea;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - c;
      const dy = y - c;
      // Inside rotated square: |dx| + |dy| <= half
      const inDiamond = Math.abs(dx) + Math.abs(dy) <= half;
      // Inner cut-out: smaller diamond (creates the "M" ring feel)
      const inHole = Math.abs(dx) + Math.abs(dy) <= half * 0.42;
      // Rounded corners for the outer green square — simple circle mask
      const inCircle = dx * dx + dy * dy <= (size * 0.62) ** 2;
      const color = inDiamond && !inHole ? GOLD : inCircle ? GREEN : [0, 0, 0, 0];
      const i = (y * size + x) * 4;
      px[i] = color[0];
      px[i + 1] = color[1];
      px[i + 2] = color[2];
      px[i + 3] = color[3];
    }
  }
  return encodePng(size, size, px);
}

mkdirSync(OUT_DIR, { recursive: true });

writeFileSync(join(OUT_DIR, "icon-192.png"), makeIcon(192));
writeFileSync(join(OUT_DIR, "icon-512.png"), makeIcon(512));
// Maskable: keep the diamond inside the 80% safe zone.
writeFileSync(join(OUT_DIR, "icon-maskable-512.png"), makeIcon(512, { safeArea: 0.62 }));

console.log("Icons written to", OUT_DIR);