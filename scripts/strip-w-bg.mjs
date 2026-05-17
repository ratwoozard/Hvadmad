/**
 * One-shot helper: strip the bright cyan background from the WeGoDigital W
 * mascot PNG so it can hang from the rope on a dark backdrop without showing
 * a cyan square behind it.
 *
 * Reads:  public/branding/wegodigital-w.png
 * Writes: public/branding/wegodigital-w.png (in place, replaces original)
 *
 * Run:    node scripts/strip-w-bg.mjs
 *
 * NOTE: `sharp` is intentionally NOT a project dependency. Install it with
 *       `npm install --no-save sharp` before running this script.
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const input = resolve(__dirname, "..", "public", "branding", "wegodigital-w.png");
const output = resolve(__dirname, "..", "public", "branding", "wegodigital-w.tmp.png");

// Tunables. Cyan target = sampled around (40, 200, 240). Tolerance is fairly
// generous to also catch the slightly-darker anti-aliased edges, but small
// enough that the white sticker outline and the W's facial highlights stay
// fully opaque.
const TARGET = { r: 40, g: 200, b: 240 };
const TOLERANCE = 70;

const image = sharp(input).ensureAlpha();
const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
if (channels !== 4) {
  throw new Error(`expected 4 channels (RGBA) after ensureAlpha, got ${channels}`);
}

let cleared = 0;
for (let i = 0; i < data.length; i += 4) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const dr = r - TARGET.r;
  const dg = g - TARGET.g;
  const db = b - TARGET.b;
  const dist = Math.sqrt(dr * dr + dg * dg + db * db);
  if (dist < TOLERANCE) {
    data[i + 3] = 0;
    cleared += 1;
  }
}

await sharp(data, { raw: { width, height, channels: 4 } })
  .png()
  .toFile(output);

const total = width * height;
const pct = ((cleared / total) * 100).toFixed(1);
console.log(`Cleared ${cleared}/${total} (${pct}%) pixels -> ${output}`);
