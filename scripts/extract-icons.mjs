/**
 * Splits the multi-icon source sheets in `scripts/icon-source/` into individual,
 * transparent PNG icons in `public/icons/`.
 *
 * Algorithm:
 *   1. Seed the magenta background color from the four corner pixels.
 *   2. Build a binary mask (1 = "ink" pixel, i.e. far from background).
 *   3. Dilate the mask so close-but-disjoint parts of the same icon (e.g. the
 *      bun + meat + cheese of a burger) end up in the same connected component.
 *   4. Run BFS to find connected components in the dilated mask, recording
 *      each component's tight bounding box in the *undilated* image.
 *   5. Sort components top-to-bottom, then left-to-right (within a row tolerance).
 *   6. Match each detected icon to a pre-declared name from the sheet manifest.
 *      Bail loudly if counts disagree — we'd rather fail than mis-label icons.
 *   7. For each icon: crop with padding, flood-fill background removal from the
 *      crop's border, feather edges, palette-quantize, and write to `public/icons/`.
 *
 * Run with: `node scripts/extract-icons.mjs`
 * Add `--dry` to preview detected counts without writing files.
 */

import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "scripts", "icon-source");
const OUT_DIR = path.join(ROOT, "public", "icons");

// Pre-declared manifest. Names MUST match the visual order
// (top→bottom, then left→right within a row). If detection finds a different
// number of icons the script will abort instead of silently mis-labelling.
const SHEETS = [
  {
    file: "sheet-mega.png",
    // 28 icons: rows 1-3 each have 7, row 4 has 9 (5 utility + 4 social).
    icons: [
      // Row 1
      "food-cloche", "food-salad-bowl", "food-pizza", "food-burger",
      "food-takeout-bag", "food-grocery-bag", "food-rice-bowl",
      // Row 2
      "food-taco", "food-soup-bowl", "food-egg", "food-fish",
      "food-cheese", "food-bread", "food-drink-cup",
      // Row 3
      "food-chili", "food-cupcake", "food-steak", "food-drumstick",
      "ui-calendar-check", "ui-scale", "ui-heart-solid",
      // Row 4
      "ui-leaf", "ui-gauge", "ui-search", "ui-funnel", "ui-sliders",
      "social-facebook", "social-instagram", "social-tiktok", "social-youtube",
    ],
  },
  {
    file: "sheet-status.png",
    // 10 icons in 2 rows of 5.
    icons: [
      // Row 1
      "status-fire", "status-star", "status-badge-check",
      "status-percent", "status-clock",
      // Row 2
      "status-info", "status-warning", "status-check-circle",
      "status-x-circle", "status-tag",
    ],
  },
  {
    file: "sheet-actions.png",
    // 10 icons in 2 rows of 5.
    icons: [
      // Row 1
      "action-plus-filled", "action-minus", "action-check-filled",
      "action-x-circle", "action-trash",
      // Row 2
      "action-pencil", "action-share", "action-heart-outline",
      "action-download", "action-external-link",
    ],
  },
  {
    file: "sheet-nav.png",
    // 10 icons in 2 rows of 5. Generic UI/navigation set.
    icons: [
      // Row 1
      "nav-home", "nav-search", "nav-heart", "nav-bag", "nav-person",
      // Row 2
      "nav-grid", "nav-clock", "nav-pin", "nav-chat", "nav-settings",
    ],
  },
  {
    file: "sheet-filter.png",
    // 4 icons in 2 rows of 2.
    // The "arrows-up-down" icon is two visually disjoint arrows; bump the
    // merge-gap so they collapse into a single icon. Safe to do because the
    // 2×2 grid has huge inter-cell gaps (~170 px).
    mergeGapPx: 50,
    icons: [
      "ui-sliders-large", "ui-arrows-up-down",
      "ui-funnel-dollar", "ui-location-pin",
    ],
  },
];

// Tunables. Tightened empirically against the 1024×1024 source sheets.
const BG_TOLERANCE = 40;         // squared distance below = "is background"
const BG_FEATHER_TOLERANCE = 70; // soft alpha ramp for anti-aliased edges
const DILATE_RADIUS = 6;         // px — merge disjoint pieces of same icon
// After CC detection we run an extra merge pass: components whose bounding
// boxes overlap heavily on one axis with only a small gap on the other are
// almost certainly the same icon broken up by a thin transparent region
// (e.g. the gap between the download arrow and its tray). Numbers chosen
// to be aggressive enough for stacked parts within one icon, conservative
// enough to never bridge neighbouring icons that sit on the same row.
const MERGE_AXIS_OVERLAP_PCT = 0.6;
const MERGE_GAP_PX = 20;
const MIN_COMPONENT_AREA = 250;  // ignore stray speckles
const ROW_TOLERANCE = 60;        // px — icons within ±N of each other = same row
const CROP_PADDING = 10;         // px — breathing room around tight bbox

/**
 * @param {string} sheetPath
 * @param {readonly string[]} expectedIcons
 * @param {{ dryRun: boolean; mergeGapPx: number }} opts
 */
async function processSheet(sheetPath, expectedIcons, { dryRun, mergeGapPx }) {
  const sheetName = path.basename(sheetPath, ".png");
  const image = sharp(sheetPath).ensureAlpha();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const channels = 4;

  // 1. Seed magenta from corners.
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  let sr = 0, sg = 0, sb = 0;
  for (const [x, y] of corners) {
    const i = (y * width + x) * channels;
    sr += data[i]; sg += data[i + 1]; sb += data[i + 2];
  }
  const seedR = Math.round(sr / 4);
  const seedG = Math.round(sg / 4);
  const seedB = Math.round(sb / 4);

  const isBg = (idx) => {
    const i = idx * channels;
    const dr = data[i] - seedR;
    const dg = data[i + 1] - seedG;
    const db = data[i + 2] - seedB;
    return dr * dr + dg * dg + db * db <= BG_TOLERANCE * BG_TOLERANCE;
  };

  // 2. Binary "ink" mask.
  const total = width * height;
  const ink = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    ink[i] = isBg(i) ? 0 : 1;
  }

  // 3. Dilate. Use horizontal then vertical pass (separable) for O(width*height*r)
  //    instead of O(width*height*r²) of the naive box dilate.
  const dilated = dilate(ink, width, height, DILATE_RADIUS);

  // 4. BFS to find connected components in dilated mask.
  const visited = new Uint8Array(total);
  const components = [];
  const queue = new Int32Array(total);

  for (let start = 0; start < total; start++) {
    if (visited[start] || !dilated[start]) continue;
    let head = 0, tail = 0;
    queue[tail++] = start;
    visited[start] = 1;

    let inkMinX = width, inkMinY = height, inkMaxX = -1, inkMaxY = -1;
    let area = 0;

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % width;
      const y = (idx - x) / width;
      area++;

      // Track tight bbox using the UNDILATED ink mask so the crop is snug
      // around real pixels, not the inflated halo.
      if (ink[idx]) {
        if (x < inkMinX) inkMinX = x;
        if (y < inkMinY) inkMinY = y;
        if (x > inkMaxX) inkMaxX = x;
        if (y > inkMaxY) inkMaxY = y;
      }

      const neighbours = [
        x > 0 ? idx - 1 : -1,
        x < width - 1 ? idx + 1 : -1,
        y > 0 ? idx - width : -1,
        y < height - 1 ? idx + width : -1,
      ];
      for (const n of neighbours) {
        if (n < 0 || visited[n] || !dilated[n]) continue;
        visited[n] = 1;
        queue[tail++] = n;
      }
    }

    if (area < MIN_COMPONENT_AREA || inkMaxX < 0) continue;
    components.push({
      minX: inkMinX, minY: inkMinY, maxX: inkMaxX, maxY: inkMaxY,
      area,
    });
  }

  // 5a. Merge near-overlapping components (e.g. download arrow + tray).
  //     We iterate to a fixed point so chains of three+ parts also collapse.
  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        if (shouldMerge(components[i], components[j], mergeGapPx)) {
          components[i] = mergeBoxes(components[i], components[j]);
          components.splice(j, 1);
          merged = true;
          break outer;
        }
      }
    }
  }

  // 5b. Sort top-to-bottom, then left-to-right within a row tolerance.
  components.sort((a, b) => a.minY - b.minY);
  const rows = [];
  for (const c of components) {
    const cy = (c.minY + c.maxY) / 2;
    let row = rows.find((r) => Math.abs(r.centerY - cy) < ROW_TOLERANCE);
    if (!row) {
      row = { centerY: cy, items: [] };
      rows.push(row);
    }
    row.items.push(c);
    // Recompute row center as running average so an outlier doesn't drag it.
    row.centerY = row.items.reduce((s, it) => s + (it.minY + it.maxY) / 2, 0)
      / row.items.length;
  }
  for (const row of rows) {
    row.items.sort((a, b) => a.minX - b.minX);
  }
  const sortedComponents = rows.flatMap((r) => r.items);

  console.log(
    `${sheetName}: detected ${sortedComponents.length} icons ` +
      `(expected ${expectedIcons.length})`,
  );

  if (sortedComponents.length !== expectedIcons.length) {
    console.error(
      `  ✗ count mismatch in ${sheetName}. Detected boxes (top→bottom, left→right):`,
    );
    sortedComponents.forEach((c, i) => {
      console.error(
        `    [${i}] x=${c.minX}-${c.maxX} y=${c.minY}-${c.maxY} area=${c.area}`,
      );
    });
    throw new Error(
      `Refusing to write — would mis-label icons from ${sheetName}.`,
    );
  }

  if (dryRun) return;

  // 6 + 7. Crop, bg-remove, write each icon.
  for (let i = 0; i < sortedComponents.length; i++) {
    const bbox = sortedComponents[i];
    const name = expectedIcons[i];
    const left = Math.max(0, bbox.minX - CROP_PADDING);
    const top = Math.max(0, bbox.minY - CROP_PADDING);
    const right = Math.min(width - 1, bbox.maxX + CROP_PADDING);
    const bottom = Math.min(height - 1, bbox.maxY + CROP_PADDING);
    const cropW = right - left + 1;
    const cropH = bottom - top + 1;

    const cropBuf = await sharp(sheetPath)
      .ensureAlpha()
      .extract({ left, top, width: cropW, height: cropH })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const cleaned = removeBackgroundFromBuffer(
      cropBuf.data,
      cropBuf.info.width,
      cropBuf.info.height,
      { seedR, seedG, seedB },
    );

    const outPath = path.join(OUT_DIR, `${name}.png`);
    await sharp(cleaned, {
      raw: { width: cropBuf.info.width, height: cropBuf.info.height, channels: 4 },
    })
      .png({ compressionLevel: 9, palette: true, quality: 90, effort: 10 })
      .toFile(outPath);
  }

  console.log(`  ✓ wrote ${expectedIcons.length} icons from ${sheetName}`);
}

/**
 * @typedef {{ minX: number; minY: number; maxX: number; maxY: number; area: number }} Component
 */

/**
 * @param {Component} a
 * @param {Component} b
 * @param {number} mergeGapPx
 * @returns {boolean}
 */
function shouldMerge(a, b, mergeGapPx) {
  // Horizontal & vertical extents.
  const ax = a.maxX - a.minX + 1;
  const ay = a.maxY - a.minY + 1;
  const bx = b.maxX - b.minX + 1;
  const by = b.maxY - b.minY + 1;

  // Overlap lengths (can be negative if there's a gap).
  const xOverlap = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX) + 1;
  const yOverlap = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY) + 1;
  const xGap = -xOverlap;
  const yGap = -yOverlap;

  // Two parts stacked vertically (e.g. download arrow above tray):
  // wide horizontal overlap AND small vertical gap.
  const xOverlapPct = Math.max(0, xOverlap) / Math.min(ax, bx);
  if (xOverlapPct >= MERGE_AXIS_OVERLAP_PCT && yGap <= mergeGapPx) {
    return true;
  }
  // Two parts side-by-side (e.g. ↓ ↑ arrows): wide vertical overlap + small x gap.
  const yOverlapPct = Math.max(0, yOverlap) / Math.min(ay, by);
  if (yOverlapPct >= MERGE_AXIS_OVERLAP_PCT && xGap <= mergeGapPx) {
    return true;
  }
  return false;
}

/**
 * @param {Component} a
 * @param {Component} b
 * @returns {Component}
 */
function mergeBoxes(a, b) {
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
    area: a.area + b.area,
  };
}

/**
 * Separable box dilation: marks every pixel within `r` of an ink pixel as 1.
 * Two-pass (horizontal then vertical) — O(width*height*r) total work.
 *
 * @param {Uint8Array} src
 * @param {number} w
 * @param {number} h
 * @param {number} r
 * @returns {Uint8Array}
 */
function dilate(src, w, h, r) {
  const horiz = new Uint8Array(src.length);
  for (let y = 0; y < h; y++) {
    const rowOff = y * w;
    for (let x = 0; x < w; x++) {
      let hit = 0;
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(w - 1, x + r);
      for (let xi = x0; xi <= x1; xi++) {
        if (src[rowOff + xi]) { hit = 1; break; }
      }
      horiz[rowOff + x] = hit;
    }
  }
  const out = new Uint8Array(src.length);
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let hit = 0;
      const y0 = Math.max(0, y - r);
      const y1 = Math.min(h - 1, y + r);
      for (let yi = y0; yi <= y1; yi++) {
        if (horiz[yi * w + x]) { hit = 1; break; }
      }
      out[y * w + x] = hit;
    }
  }
  return out;
}

/**
 * Flood-fill background removal scoped to a single cropped icon buffer.
 * Pulled out so we can reuse the same seed-color for every crop on a sheet
 * (more consistent than re-sampling from each crop's corners, which sometimes
 * land on icon pixels in tight crops).
 *
 * @param {Buffer} rawRgba
 * @param {number} width
 * @param {number} height
 * @param {{ seedR: number; seedG: number; seedB: number }} seed
 * @returns {Buffer}
 */
function removeBackgroundFromBuffer(rawRgba, width, height, seed) {
  const channels = 4;
  const out = Buffer.from(rawRgba);
  const total = width * height;
  const visited = new Uint8Array(total);
  const queue = new Int32Array(total);
  let qHead = 0, qTail = 0;

  const tol2 = BG_TOLERANCE * BG_TOLERANCE;
  const featherTol2 = BG_FEATHER_TOLERANCE * BG_FEATHER_TOLERANCE;

  const dist2 = (idx) => {
    const i = idx * channels;
    const dr = rawRgba[i] - seed.seedR;
    const dg = rawRgba[i + 1] - seed.seedG;
    const db = rawRgba[i + 2] - seed.seedB;
    return dr * dr + dg * dg + db * db;
  };

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
    out[idx * channels + 3] = 0;
    if (x > 0) push(idx - 1);
    if (x < width - 1) push(idx + 1);
    if (y > 0) push(idx - width);
    if (y < height - 1) push(idx + width);
  }

  // Feather pass.
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
    const t = (d2 - tol2) / (featherTol2 - tol2);
    const alpha = Math.max(0, Math.min(255, Math.round(t * 255)));
    if (alpha < out[idx * channels + 3]) {
      out[idx * channels + 3] = alpha;
    }
  }

  // Despill pass: anti-aliased pixels at icon boundaries (especially cream/
  // white edges against the magenta background) can keep a pink halo because
  // their colour is "icon-like enough" to survive the flood-fill but still
  // carries chroma from the background. Detect pixels where R and B are
  // strongly elevated relative to G (the magenta signature) AND where there
  // is at least one fully-transparent neighbour within a small radius, then
  // pull R and B down to the level of G. Keeps the colour but removes the spill.
  const SPILL_RADIUS = 3;
  const SPILL_MIN_CHROMA = 30; // (R + B) / 2 - G must exceed this to count as spill
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) continue;
      if (out[idx * channels + 3] === 0) continue;

      const r = out[idx * channels];
      const g = out[idx * channels + 1];
      const b = out[idx * channels + 2];
      const chroma = (r + b) / 2 - g;
      if (chroma < SPILL_MIN_CHROMA) continue;

      // Only despill if we're close to the transparent boundary — otherwise
      // we risk discolouring legitimate magenta icon parts (we don't have any
      // in this art style but defensive is cheap).
      let nearTransparent = false;
      const yMin = Math.max(0, y - SPILL_RADIUS);
      const yMax = Math.min(height - 1, y + SPILL_RADIUS);
      const xMin = Math.max(0, x - SPILL_RADIUS);
      const xMax = Math.min(width - 1, x + SPILL_RADIUS);
      neighbourScan: for (let ny = yMin; ny <= yMax; ny++) {
        for (let nx = xMin; nx <= xMax; nx++) {
          if (visited[ny * width + nx]) {
            nearTransparent = true;
            break neighbourScan;
          }
        }
      }
      if (!nearTransparent) continue;

      // Pull R and B down to G. Clamp slightly above G so dark outlines that
      // are legitimately slightly warm don't go grey.
      const target = Math.min(g + 4, 255);
      if (r > target) out[idx * channels] = target;
      if (b > target) out[idx * channels + 2] = target;
    }
  }

  return out;
}

const dryRun = process.argv.includes("--dry");

await fs.mkdir(OUT_DIR, { recursive: true });

for (const sheet of SHEETS) {
  const sheetPath = path.join(SRC_DIR, sheet.file);
  try {
    await fs.access(sheetPath);
  } catch {
    console.error(`✗ missing source: ${sheetPath}`);
    process.exitCode = 1;
    continue;
  }
  await processSheet(sheetPath, sheet.icons, {
    dryRun,
    mergeGapPx: sheet.mergeGapPx ?? MERGE_GAP_PX,
  });
}

if (dryRun) {
  console.log("\n(dry run — no files written)");
}
