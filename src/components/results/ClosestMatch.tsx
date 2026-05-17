"use client";

import { motion } from "framer-motion";
import { EASING } from "@/lib/motion/tokens";
import type { ClosestMatchPair } from "@/lib/match/insights";

interface ClosestMatchProps {
  pair: ClosestMatchPair;
}

/**
 * "Tætteste kamp" — head-to-head card showing the spread between the #1
 * and #2 ranked dishes. Renders two competing horizontal bars with names
 * and a colour-coded gap pill (small gap = warning green, large = neutral).
 *
 * Hidden by the parent when fewer than two non-eliminated results exist,
 * so we don't need an empty state here.
 */
export function ClosestMatch({ pair }: ClosestMatchProps) {
  const { first, second, voteGap, percentGap } = pair;

  const totalPct = first.match_percentage + second.match_percentage || 1;
  const firstFraction = first.match_percentage / totalPct;
  const secondFraction = second.match_percentage / totalPct;

  const gapLabel =
    voteGap === 0
      ? "Uafgjort!"
      : voteGap === 1
        ? "Kun 1 stemme"
        : `${voteGap} stemmer`;
  const isTight = voteGap <= 1;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: EASING.out }}
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
      aria-labelledby="closest-match-heading"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-xl"
            aria-hidden="true"
          >
            🎯
          </span>
          <div>
            <h2
              id="closest-match-heading"
              className="font-bold text-gray-900"
            >
              Tætteste kamp
            </h2>
            <p className="text-xs text-emerald-800/80">
              {percentGap === 0
                ? "Helt lige løb mellem nr. 1 og nr. 2"
                : `${percentGap}% spredning mellem nr. 1 og nr. 2`}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
            isTight
              ? "bg-emerald-600 text-white"
              : "bg-white text-emerald-800 ring-1 ring-emerald-200"
          }`}
        >
          {gapLabel}
        </span>
      </header>

      <div className="mt-3 flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate text-right text-xs font-semibold text-emerald-900">
          {first.emoji ? (
            <span className="mr-1" aria-hidden="true">
              {first.emoji}
            </span>
          ) : null}
          {first.name}
        </span>

        <div
          className="relative flex h-2.5 w-1/2 overflow-hidden rounded-full bg-white/60 ring-1 ring-emerald-100"
          aria-hidden="true"
        >
          <motion.span
            className="block h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${firstFraction * 100}%` }}
            transition={{ duration: 0.6, ease: EASING.out, delay: 0.1 }}
          />
          <motion.span
            className="block h-full bg-emerald-300"
            initial={{ width: 0 }}
            animate={{ width: `${secondFraction * 100}%` }}
            transition={{ duration: 0.6, ease: EASING.out, delay: 0.18 }}
          />
        </div>

        <span className="min-w-0 flex-1 truncate text-left text-xs font-semibold text-emerald-900">
          {second.emoji ? (
            <span className="mr-1" aria-hidden="true">
              {second.emoji}
            </span>
          ) : null}
          {second.name}
        </span>
      </div>
    </motion.section>
  );
}
