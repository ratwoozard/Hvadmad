"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { pageTransition } from "@/lib/motion/variants";

interface PageTransitionProps {
  children: ReactNode;
}

/**
 * Wraps page content in a consistent fade+slide enter/exit animation.
 * Designed to live inside Next.js App Router's `app/template.tsx` so it
 * re-mounts on every navigation.
 *
 * Reduced motion is handled automatically by the surrounding MotionProvider
 * (which sets `reducedMotion="user"` on the Framer Motion config).
 */
export function PageTransition({ children }: PageTransitionProps) {
  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
