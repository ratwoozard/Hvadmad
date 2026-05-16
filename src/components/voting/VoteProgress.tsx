"use client";

import { motion } from "framer-motion";
import { EASING } from "@/lib/motion/tokens";

interface VoteProgressProps {
  current: number;
  total: number;
}

export function VoteProgress({ current, total }: VoteProgressProps) {
  const percent = total > 0 ? Math.min(100, (current / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3 px-2" aria-label={`Fremgang: ${current} af ${total}`}>
      <span className="text-sm tabular-nums text-gray-500">
        {current} / {total}
      </span>
      <div
        className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <motion.div
          className="h-full rounded-full bg-brand-500"
          initial={false}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.35, ease: EASING.out }}
        />
      </div>
    </div>
  );
}
