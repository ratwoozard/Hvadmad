"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";

export type WipePattern = "wave" | "diagonal" | "spiral";

export interface PixelateWipeProps {
  /**
   * `"covering"` animates cells from transparent → black (staggered).
   * `"revealing"` animates cells from black → transparent (staggered).
   * Switching the prop while mounted lets the same component play both halves
   * of a transition in sequence without flashing.
   */
  phase: "covering" | "revealing";
  cols?: number;
  rows?: number;
  pattern?: WipePattern;
  /** Per-cell fade duration in milliseconds. */
  cellFadeMs?: number;
  /** Max stagger window across the grid in milliseconds. */
  staggerMs?: number;
  /**
   * Color of the wipe panels. Defaults to `brand-50` (#fef3e2 — soft cream
   * that matches the frontpage background), so the screen "warms up" through
   * the transition instead of cutting to black.
   */
  color?: string;
  onComplete?: () => void;
}

function spiralIndices(cols: number, rows: number): number[][] {
  const grid: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0),
  );
  let top = 0;
  let bottom = rows - 1;
  let left = 0;
  let right = cols - 1;
  let i = 0;
  while (top <= bottom && left <= right) {
    for (let x = left; x <= right; x++) grid[top][x] = i++;
    top++;
    for (let y = top; y <= bottom; y++) grid[y][right] = i++;
    right--;
    if (top <= bottom) {
      for (let x = right; x >= left; x--) grid[bottom][x] = i++;
      bottom--;
    }
    if (left <= right) {
      for (let y = bottom; y >= top; y--) grid[y][left] = i++;
      left--;
    }
  }
  return grid;
}

function computeDelays(
  cols: number,
  rows: number,
  pattern: WipePattern,
  staggerMs: number,
): number[] {
  const raw: number[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(0),
  );
  const spiral = pattern === "spiral" ? spiralIndices(cols, rows) : null;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (pattern === "wave") {
        raw[y][x] = Math.hypot(x - (cols - 1) / 2, y - (rows - 1) / 2);
      } else if (pattern === "diagonal") {
        raw[y][x] = x + y;
      } else if (spiral) {
        raw[y][x] = spiral[y][x];
      }
    }
  }

  let min = Infinity;
  let max = -Infinity;
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (raw[y][x] < min) min = raw[y][x];
      if (raw[y][x] > max) max = raw[y][x];
    }
  }
  const range = max - min || 1;

  const out: number[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      out.push(((raw[y][x] - min) / range) * staggerMs);
    }
  }
  return out;
}

/**
 * Full-viewport pixel-grid wipe overlay (web port of the Remotion
 * `GridPixelateWipe` snippet). Cells share a single color and stagger their
 * opacity animation across a wave/diagonal/spiral pattern so the screen reads
 * as a grid of fading squares.
 *
 * Keep the component mounted across `covering` → `revealing` to avoid a flash
 * between the two halves; the cells start fully covered when `phase` becomes
 * `"revealing"` because we don't reset `initial` between transitions.
 */
export function PixelateWipe({
  phase,
  cols = 14,
  rows = 8,
  pattern = "wave",
  cellFadeMs = 140,
  staggerMs = 360,
  color = "#fef3e2",
  onComplete,
}: PixelateWipeProps) {
  const delays = useMemo(
    () => computeDelays(cols, rows, pattern, staggerMs),
    [cols, rows, pattern, staggerMs],
  );

  const totalMs = staggerMs + cellFadeMs;
  const completeRef = useRef(onComplete);
  completeRef.current = onComplete;

  useEffect(() => {
    const t = window.setTimeout(() => completeRef.current?.(), totalMs);
    return () => window.clearTimeout(t);
  }, [phase, totalMs]);

  // `initial` is what each cell paints on the very first frame it mounts.
  // For "revealing" we want the screen to start fully covered (opacity 1) so
  // the destination page is hidden until each cell's stagger delay elapses.
  const initial = phase === "covering" ? 0 : 1;
  const target = phase === "covering" ? 1 : 0;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[100] grid"
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
    >
      {delays.map((delay, i) => (
        <motion.div
          key={i}
          initial={{ opacity: initial }}
          animate={{ opacity: target }}
          transition={{
            delay: delay / 1000,
            duration: cellFadeMs / 1000,
            ease: [0.65, 0, 0.35, 1],
          }}
          style={{ background: color }}
        />
      ))}
    </div>
  );
}
