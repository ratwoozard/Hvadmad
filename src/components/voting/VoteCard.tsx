"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import type { FoodOption } from "@/types/food";
import { DURATION, EASING } from "@/lib/motion/tokens";

export type VoteDirection = "ja" | "maaske" | "nej";

interface VoteCardProps {
  option: FoodOption;
  exitDirection?: VoteDirection | null;
}

const cardVariants: Variants = {
  initial: { opacity: 0, scale: 0.96, y: 16 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.25, ease: EASING.out },
  },
  ja: {
    y: "-120%",
    rotate: -8,
    opacity: 0,
    transition: { duration: DURATION.card, ease: EASING.out },
  },
  nej: {
    y: "120%",
    rotate: 8,
    opacity: 0,
    transition: { duration: DURATION.card, ease: EASING.out },
  },
  maaske: {
    x: "110%",
    rotate: 12,
    opacity: 0,
    transition: { duration: DURATION.card, ease: EASING.out },
  },
};

/**
 * Single food-option card with semantic exit directions:
 *   ja     → flies up + slight left rotation
 *   nej    → falls down + slight right rotation
 *   maaske → swipes right + larger rotation
 *
 * When inside `<AnimatePresence mode="popLayout">`, set `exitDirection`
 * before unmounting (e.g., via a state variable) so the correct variant
 * runs on exit.
 */
export function VoteCard({ option, exitDirection }: VoteCardProps) {
  return (
    <motion.div
      key={option.id}
      variants={cardVariants}
      initial="initial"
      animate="animate"
      exit={exitDirection ?? "initial"}
      className="rounded-2xl border border-gray-100 bg-white py-12 text-center shadow-sm"
    >
      <div className="mb-4 text-6xl">{option.emoji || "🍽️"}</div>
      <h2 className="text-2xl font-bold text-gray-900">{option.name}</h2>
      {option.description && (
        <p className="mt-2 px-4 text-gray-500">{option.description}</p>
      )}
    </motion.div>
  );
}
