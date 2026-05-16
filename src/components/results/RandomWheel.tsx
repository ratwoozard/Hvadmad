"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CURSOR_COLORS, DURATION } from "@/lib/motion/tokens";

export interface WheelOption {
  id: string;
  name: string;
  emoji?: string | null;
}

interface RandomWheelProps {
  options: WheelOption[];
  onResult: (option: WheelOption) => void;
  duration?: number;
  /** Inject a deterministic RNG for tests. Defaults to Math.random. */
  random?: () => number;
}

const VIEWBOX = 200;
const CENTER = VIEWBOX / 2;
const RADIUS = 90;

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeSlice(start: number, end: number) {
  const startPt = polarToCartesian(CENTER, CENTER, RADIUS, end);
  const endPt = polarToCartesian(CENTER, CENTER, RADIUS, start);
  const largeArc = end - start <= 180 ? 0 : 1;
  return `M ${CENTER} ${CENTER} L ${startPt.x} ${startPt.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 0 ${endPt.x} ${endPt.y} Z`;
}

/**
 * Decorative spin-the-wheel picker.
 *
 * Spins for ~3 seconds with a friction-like cubic-bezier, then lands
 * deterministically on a randomly-chosen option. Honours reduced-motion
 * by skipping the spin and firing `onResult` after a short delay.
 */
export function RandomWheel({
  options,
  onResult,
  duration = DURATION.spin,
  random = Math.random,
}: RandomWheelProps) {
  const reduced = useReducedMotion();
  const rotation = useMotionValue(0);
  const titleId = useId();
  const [spinning, setSpinning] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const startedRef = useRef(false);

  const slices = useMemo(() => {
    if (options.length === 0) return [];
    const sliceAngle = 360 / options.length;
    return options.map((opt, i) => {
      const start = i * sliceAngle;
      const end = start + sliceAngle;
      const mid = start + sliceAngle / 2;
      const color = CURSOR_COLORS[i % CURSOR_COLORS.length];
      const labelPos = polarToCartesian(CENTER, CENTER, RADIUS * 0.65, mid);
      return {
        d: describeSlice(start, end),
        color,
        labelX: labelPos.x,
        labelY: labelPos.y,
        emoji: opt.emoji ?? "",
      };
    });
  }, [options]);

  useEffect(() => {
    if (startedRef.current || options.length === 0) return;
    startedRef.current = true;
    setSpinning(true);

    const winningIndex = Math.floor(random() * options.length);
    const winner = options[winningIndex];
    const sliceAngle = 360 / options.length;
    const targetMid = winningIndex * sliceAngle + sliceAngle / 2;
    const targetAngle = -targetMid;

    if (reduced) {
      rotation.set(targetAngle);
      window.setTimeout(() => {
        setSpinning(false);
        setWinnerId(winner.id);
        onResult(winner);
      }, 200);
      return;
    }

    const fullSpins = 5;
    const finalRotation = 360 * fullSpins + targetAngle;
    const controls = animate(rotation, finalRotation, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });

    controls.then(() => {
      setSpinning(false);
      setWinnerId(winner.id);
      onResult(winner);
    });

    return () => controls.stop();
  }, [duration, onResult, options, random, reduced, rotation]);

  if (options.length === 0) return null;

  const winner = options.find((o) => o.id === winnerId);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={VIEWBOX}
        height={VIEWBOX}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        role="img"
        aria-labelledby={titleId}
        className="drop-shadow-md"
      >
        <title id={titleId}>Tilfældig vælger blandt topmatches</title>
        <motion.g
          style={{
            rotate: rotation,
            transformOrigin: `${CENTER}px ${CENTER}px`,
          }}
        >
          {slices.map((s, i) => (
            <g key={i}>
              <path d={s.d} fill={s.color} stroke="white" strokeWidth="2" />
              {s.emoji && (
                <text
                  x={s.labelX}
                  y={s.labelY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="18"
                  aria-hidden="true"
                >
                  {s.emoji}
                </text>
              )}
            </g>
          ))}
        </motion.g>
        <circle cx={CENTER} cy={CENTER} r={10} fill="#fff" stroke="#111" strokeWidth="2" />
        <polygon
          points={`${CENTER - 8},5 ${CENTER + 8},5 ${CENTER},22`}
          fill="#111"
        />
      </svg>

      {winner && !spinning && (
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-center" aria-live="polite">
          <p className="text-sm text-gray-500">Vinderen er:</p>
          <p className="text-xl font-bold text-brand-700">
            {winner.emoji} {winner.name}
          </p>
        </div>
      )}
    </div>
  );
}
