"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { EASING } from "@/lib/motion/tokens";
import { MatchScoreCounter } from "./MatchScoreCounter";
import { getMatchColor, getMatchLevel } from "@/lib/match/scoring";

interface ResultRowProps {
  rank: number;
  name: string;
  emoji: string | null;
  matchPercent: number;
  explanation: string;
  /** When true, applies a thicker border and shadow for the top result. */
  isTop?: boolean;
}

const rowVariants: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: EASING.out },
  },
};

export function ResultRow({
  rank,
  name,
  emoji,
  matchPercent,
  explanation,
  isTop = false,
}: ResultRowProps) {
  const colorClass = getMatchColor(getMatchLevel(matchPercent));

  return (
    <motion.div
      variants={rowVariants}
      className={
        isTop
          ? "rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-md"
          : "rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
      }
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700"
          aria-hidden="true"
        >
          {rank}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              {emoji || "🍽️"}
            </span>
            <h3 className="font-bold text-gray-900">{name}</h3>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <motion.div
                className="h-full rounded-full bg-brand-500"
                initial={{ width: 0 }}
                animate={{ width: `${matchPercent}%` }}
                transition={{ duration: 0.8, ease: EASING.out, delay: 0.1 }}
              />
            </div>
            <span className={`text-sm font-bold tabular-nums ${colorClass}`}>
              <MatchScoreCounter target={matchPercent} />
            </span>
          </div>
          <p className="mt-2 text-sm text-gray-500">{explanation}</p>
        </div>
      </div>
    </motion.div>
  );
}
