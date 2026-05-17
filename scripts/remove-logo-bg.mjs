/**
 * Removes the flat background of the HvadMad logo PNGs using a corner-seeded
 * flood-fill. This preserves interior pixels that happen to share the
 * background color (e.g. the cream-coloured pot lid on `logo-primary.png`).
 *
 * Run with: node scripts/remove-logo-bg.mjs
 */

import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BRANDING_DIR = path.join(ROOT, "public", "branding");

/**
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {{ tolerance?: number; featherTolerance?: number }} [opts]
 */
async function removeBackground(inputPath, outputPath, opts = {}) {
  const tolerance = opts.tolerance ?? 35;
  const featherTolerance = opts.featherTolerance ?? 65;

  const image = sharp(inputPath).ensureAlpha();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height } = info;
  const channels = 4;
  const out = Buffer.from(data);

  // Sample seed color from the four corners and average them. This is more
  // robust than a single corner if there is any noise.
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  let sr = 0,
    sg = 0,
    sb = 0;
  for (const [x, y] of corners) {
    const i = (y * width + x) * channels;
    sr += data[i];
    sg += data[i + 1];
    sb += data[i + 2];
  }
  const seedR = Math.round(sr / 4);
  const seedG = Math.round(sg / 4);
  const seedB = Math.round(sb / 4);

  /**
   * @param {number} idx pixel index (0..width*height)
   * @returns {number} squared color distance from seed
   */
  const dist2 = (idx) => {
    const i = idx * channels;
    const dr = data[i] - seedR;
    const dg = data[i + 1] - seedG;
    const db = data[i + 2] - seedB;
    return dr * dr + dg * dg + db * db;
  };

  const tol2 = tolerance * tolerance;
  const featherTol2 = featherTolerance * featherTolerance;

  // Flood-fill from every border pixel (so we are guaranteed to reach the
  // outermost background no matter where the seed corners landed).
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let qHead = 0;
  let qTail = 0;

  const push = (idx) => {
    if (visited[idx]) return;
    if (dist2(idx) > tol2) return;
    visited[idx] = 1;
    queue[qTail++] = idx;
  };

  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }

  while (qHead < qTail) {
    const idx = queue[qHead++];
    const x = idx % width;
    const y = (idx - x) / width;

    // Hard-zero alpha for confirmed background pixels.
    out[idx * channels + 3] = 0;

    if (x > 0) push(idx - 1);
    if (x < width - 1) push(idx + 1);
    if (y > 0) push(idx - width);
    if (y < height - 1) push(idx + width);
  }

  // Feather pass: any non-visited pixel that touches a visited one and is
  // still "kinda background" gets soft alpha based on color distance.
  // This removes the chroma-key fringe around anti-aliased edges.
  for (let idx = 0; idx < total; idx++) {
    if (visited[idx]) continue;
    const x = idx % width;
    const y = (idx - x) / width;

    let touchesBg = false;
    if (x > 0 && visited[idx - 1]) touchesBg = true;
    else if (x < width - 1 && visited[idx + 1]) touchesBg = true;
    else if (y > 0 && visited[idx - width]) touchesBg = true;
    else if (y < height - 1 && visited[idx + width]) touchesBg = true;
    if (!touchesBg) continue;

    const d2 = dist2(idx);
    if (d2 >= featherTol2) continue;
    // Linear ramp: at tol2 → alpha ~0, at featherTol2 → alpha 255.
    const t = (d2 - tol2) / (featherTol2 - tol2);
    const alpha = Math.max(0, Math.min(255, Math.round(t * 255)));
    if (alpha < out[idx * channels + 3]) {
      out[idx * channels + 3] = alpha;
    }
  }

  // Sharp cannot read and write the same path in one pass, so always go via
  // a sibling tmp file and atomically swap it into place at the end.
  //
  // We re-encode as an 8-bit indexed PNG via libimagequant (`palette: true`)
  // because the source artwork is flat illustration with a small color set —
  // this drops the file ~5-10× compared to a naive 32-bit RGBA PNG without
  // any visible quality loss at display sizes. The alpha channel survives
  // palette quantization because libimagequant supports RGBA palettes.
  const tmpPath = `${outputPath}.tmp-${process.pid}.png`;
  await sharp(out, { raw: { width, height, channels } })
    .png({
      compressionLevel: 9,
      palette: true,
      quality: 90,
      effort: 10,
    })
    .toFile(tmpPath);
  await fs.rename(tmpPath, outputPath);

  let removed = 0;
  for (let i = 0; i < total; i++) if (visited[i]) removed++;
  const pct = ((removed / total) * 100).toFixed(1);
  console.log(
    `${path.basename(inputPath)} → ${path.basename(outputPath)}  ` +
      `seed rgb(${seedR},${seedG},${seedB})  removed ${pct}%`,
  );
}

/**
 * Recompress an already-transparent PNG into an 8-bit indexed PNG with
 * preserved alpha. Pure re-encode — no pixel data is altered.
 *
 * @param {string} filePath
 */
async function optimizeOnly(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const tmpPath = `${filePath}.tmp-${process.pid}.png`;
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
    .toFile(tmpPath);

  const sizeBefore = (await fs.stat(filePath)).size;
  await fs.rename(tmpPath, filePath);
  const sizeAfter = (await fs.stat(filePath)).size;
  const ratio = ((1 - sizeAfter / sizeBefore) * 100).toFixed(1);
  console.log(
    `optimize ${path.basename(filePath)}: ` +
      `${(sizeBefore / 1024).toFixed(0)} KB → ${(sizeAfter / 1024).toFixed(0)} KB (${ratio}% smaller)`,
  );
}

const jobs = [
  { in: "logo-primary.png", out: "logo-primary.png", tolerance: 35, feather: 70 },
  { in: "logo-dark.png", out: "logo-dark.png", tolerance: 28, feather: 55 },
  { in: "logo-mark.png", out: "logo-mark.png", tolerance: 35, feather: 70 },
  // app-icon kept as-is: the white squircle is part of the design.
];

const writeTmp = process.argv.includes("--dry");
const optimizeMode = process.argv.includes("--optimize");

if (optimizeMode) {
  for (const job of jobs) {
    await optimizeOnly(path.join(BRANDING_DIR, job.in));
  }
  await optimizeOnly(path.join(BRANDING_DIR, "favicon-512.png"));
  // NOTE: skip app-icon.png on purpose — it has soft shadow gradients that
  // palette quantization handles badly (file size grew 2× in testing).
} else {
  for (const job of jobs) {
    const inPath = path.join(BRANDING_DIR, job.in);
    const outPath = writeTmp
      ? path.join(BRANDING_DIR, job.out.replace(".png", ".transparent.png"))
      : path.join(BRANDING_DIR, job.out);
    await removeBackground(inPath, outPath, {
      tolerance: job.tolerance,
      featherTolerance: job.feather,
    });
  }
}
