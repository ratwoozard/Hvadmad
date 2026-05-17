"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

interface MotionProviderProps {
  children: ReactNode;
}

/**
 * Wraps the app tree in Framer Motion's MotionConfig with `reducedMotion="user"`
 * so every motion component below it automatically degrades animations when the
 * user has the OS-level reduced-motion preference enabled.
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
