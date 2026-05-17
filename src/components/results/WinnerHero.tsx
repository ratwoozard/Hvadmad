"use client";

import { motion } from "framer-motion";
import type { MatchResult } from "@/types/voting";
import { ConfettiDecoration } from "./ConfettiDecoration";
import { EASING } from "@/lib/motion/tokens";
import { positiveVoteCount } from "@/lib/match/insights";

interface WinnerHeroProps {
  winner: MatchResult | null;
}

/**
 * Top "Vinderen er" celebration card. Shows the highest-ranked dish in a
 * brand-tinted panel with a circular emoji medallion and a confetti backdrop.
 *
 * Renders an empty-state placeholder when no winner is available (e.g. all
 * options were eliminated). The wrapping page handles the "ingen matches"
 * case before this component is mounted, so the placeholder is just a
 * defensive fallback.
 */
export function WinnerHero({ winner }: WinnerHeroProps) {
  const voteCount = winner ? positiveVoteCount(winner) : 0;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASING.out }}
      className="relative overflow-hidden rounded-2xl border border-brand-200 bg-brand-50 p-6"
      aria-labelledby="winner-heading"
    >
      <ConfettiDecoration />

      <div className="relative flex flex-col items-center gap-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4, ease: EASING.out }}
          className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-md ring-4 ring-brand-200"
        >
          <span className="text-6xl leading-none" aria-hidden="true">
            {winner?.emoji ?? "🍽️"}
          </span>
          <span
            className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-2xl shadow-md"
            aria-hidden="true"
          >
            🏆
          </span>
        </motion.div>

        <div className="flex flex-col items-center gap-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700">
            <span aria-hidden="true">🏆</span> Vinderen er
          </span>
          <h2
            id="winner-heading"
            className="mt-1 text-2xl font-bold text-gray-900"
          >
            {winner?.name ?? "Ingen vinder endnu"}
          </h2>
          {winner ? (
            <p className="text-sm text-gray-600">
              {winner.match_percentage}% match · {voteCount}{" "}
              {voteCount === 1 ? "stemme" : "stemmer"}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Den vindende ret vises her, når afstemningen er afsluttet.
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
