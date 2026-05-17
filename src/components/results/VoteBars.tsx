"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { MatchResult } from "@/types/voting";
import { Card } from "@/components/ui/Card";
import { EASING, STAGGER } from "@/lib/motion/tokens";
import { positiveVoteCount } from "@/lib/match/insights";

interface VoteBarsProps {
  results: MatchResult[];
  /** Maximum number of rows to display. Defaults to 6 to mirror the mockup. */
  limit?: number;
}

const containerVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: STAGGER.list } },
};

const rowVariants: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: EASING.out },
  },
};

/**
 * "Stemmer pr. ret" — a compact, ranked vote-tally for every food option.
 * Each row shows: numbered medallion → dish name → progress bar (filled
 * relative to the max positive-vote-count in the set) → count pill.
 *
 * Vote count is `yes_count + maybe_count`, i.e. how many people gave the
 * dish *any* form of approval. We display "stemmer" not match-% because
 * raw counts are easier to interpret than weighted scores at a glance.
 */
export function VoteBars({ results, limit = 6 }: VoteBarsProps) {
  if (results.length === 0) return null;

  const display = results.slice(0, limit);
  const maxCount = Math.max(1, ...display.map(positiveVoteCount));

  return (
    <Card aria-labelledby="vote-bars-heading">
      <header className="mb-4 flex items-start gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-xl"
          aria-hidden="true"
        >
          📊
        </span>
        <div>
          <h2 id="vote-bars-heading" className="font-bold text-gray-900">
            Stemmer pr. ret
          </h2>
          <p className="text-xs text-gray-500">
            Se hvordan stemmerne fordelte sig mellem retterne.
          </p>
        </div>
      </header>

      <motion.ol
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-3"
      >
        {display.map((result, index) => {
          const count = positiveVoteCount(result);
          const widthPct = (count / maxCount) * 100;
          const rank = index + 1;

          return (
            <motion.li
              key={result.food_option_id}
              variants={rowVariants}
              className="flex items-center gap-3"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600"
                aria-hidden="true"
              >
                {rank}
              </span>

              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="w-20 shrink-0 truncate text-sm font-medium text-gray-900 sm:w-28">
                  {result.emoji ? (
                    <span className="mr-1" aria-hidden="true">
                      {result.emoji}
                    </span>
                  ) : null}
                  {result.name}
                </span>

                <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <motion.div
                    className="h-full rounded-full bg-brand-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${widthPct}%` }}
                    transition={{
                      duration: 0.7,
                      ease: EASING.out,
                      delay: 0.15 + index * STAGGER.list,
                    }}
                  />
                </div>
              </div>

              <span
                className="flex h-7 min-w-[2.25rem] shrink-0 items-center justify-center rounded-full bg-gray-50 px-2 text-xs font-semibold tabular-nums text-gray-700"
                aria-label={`${count} ${count === 1 ? "stemme" : "stemmer"}`}
              >
                {count}
              </span>
            </motion.li>
          );
        })}
      </motion.ol>
    </Card>
  );
}
