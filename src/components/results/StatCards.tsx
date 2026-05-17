"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { EASING } from "@/lib/motion/tokens";

interface StatCardData {
  icon: ReactNode;
  iconBg: string;
  label: string;
  /** Primary value (dish name, count, etc). Falls back to em-dash when null. */
  value: string | null;
  /** Optional secondary line (e.g. vote count). */
  detail?: string | null;
}

interface StatCardsProps {
  mostVoted: StatCardData;
  leastVoted: StatCardData;
  totalVotes: StatCardData;
}

function StatCard({ data, index }: { data: StatCardData; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: 0.05 * index,
        duration: 0.25,
        ease: EASING.out,
      }}
      className="flex flex-1 flex-col gap-1 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${data.iconBg}`}
          aria-hidden="true"
        >
          {data.icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          {data.label}
        </span>
      </div>
      <div className="mt-0.5 truncate text-sm font-bold text-gray-900">
        {data.value ?? "—"}
      </div>
      {data.detail ? (
        <div className="truncate text-xs text-gray-500">{data.detail}</div>
      ) : null}
    </motion.div>
  );
}

/**
 * Three compact stat cards summarising the round: most-voted dish,
 * least-voted dish, and total vote count. Each card uses a different
 * accent colour so users can scan them quickly without reading labels.
 */
export function StatCards({
  mostVoted,
  leastVoted,
  totalVotes,
}: StatCardsProps) {
  return (
    <section
      aria-label="Statistik"
      className="grid grid-cols-3 gap-2"
    >
      <StatCard data={mostVoted} index={0} />
      <StatCard data={leastVoted} index={1} />
      <StatCard data={totalVotes} index={2} />
    </section>
  );
}
