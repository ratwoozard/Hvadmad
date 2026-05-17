"use client";

import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Decorative confetti sprinkled around a container. Renders pure SVG dots
 * with the brand palette so it stays cheap and scales crisply on retina.
 *
 * The component is `aria-hidden` because it carries no semantic meaning —
 * it's just visual flavour around the winner card / page header. When the
 * user prefers reduced motion we render the dots statically (no float).
 */
interface ConfettiPiece {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotate: number;
  color: string;
}

const PALETTE = [
  "#f9a825", // brand-500
  "#fbc35f", // brand-300
  "#22c55e", // vote-yes
  "#a78bfa", // soft purple
  "#60a5fa", // soft blue
  "#fb923c", // soft orange
];

const PIECES: ConfettiPiece[] = [
  { cx: 8, cy: 12, rx: 4, ry: 2, rotate: -20, color: PALETTE[0] },
  { cx: 22, cy: 6, rx: 3, ry: 3, rotate: 0, color: PALETTE[3] },
  { cx: 35, cy: 18, rx: 5, ry: 2, rotate: 30, color: PALETTE[5] },
  { cx: 52, cy: 10, rx: 3, ry: 3, rotate: 0, color: PALETTE[2] },
  { cx: 68, cy: 22, rx: 4, ry: 2, rotate: -15, color: PALETTE[0] },
  { cx: 82, cy: 8, rx: 3, ry: 3, rotate: 0, color: PALETTE[4] },
  { cx: 92, cy: 16, rx: 5, ry: 2, rotate: 45, color: PALETTE[5] },
  { cx: 14, cy: 78, rx: 5, ry: 2, rotate: 15, color: PALETTE[5] },
  { cx: 28, cy: 88, rx: 3, ry: 3, rotate: 0, color: PALETTE[3] },
  { cx: 44, cy: 82, rx: 4, ry: 2, rotate: -25, color: PALETTE[0] },
  { cx: 58, cy: 92, rx: 3, ry: 3, rotate: 0, color: PALETTE[2] },
  { cx: 74, cy: 84, rx: 5, ry: 2, rotate: 35, color: PALETTE[4] },
  { cx: 88, cy: 90, rx: 3, ry: 3, rotate: 0, color: PALETTE[0] },
];

interface ConfettiDecorationProps {
  className?: string;
}

export function ConfettiDecoration({ className }: ConfettiDecorationProps) {
  const reduced = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className ?? ""}`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {PIECES.map((p, i) => {
          const piece = (
            <ellipse
              cx={p.cx}
              cy={p.cy}
              rx={p.rx}
              ry={p.ry}
              fill={p.color}
              transform={`rotate(${p.rotate} ${p.cx} ${p.cy})`}
            />
          );
          if (reduced) return <g key={i}>{piece}</g>;
          return (
            <motion.g
              key={i}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.05 * i,
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {piece}
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
}
