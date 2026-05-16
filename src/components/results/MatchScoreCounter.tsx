"use client";

import { useEffect, useState } from "react";
import { animate, useMotionValue, useTransform } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { DURATION, EASING } from "@/lib/motion/tokens";

interface MatchScoreCounterProps {
  target: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

/**
 * Counts a percentage up from 0 to `target` over `duration` seconds with
 * an easeOut curve. Honours reduced-motion: shows the final value
 * instantly when the user has the OS preference set.
 *
 * The final value is announced via `aria-live="polite"` on the wrapping
 * element so screen-reader users hear the result without the noise of
 * every intermediate frame.
 */
export function MatchScoreCounter({
  target,
  duration = DURATION.count,
  suffix = "%",
  className,
}: MatchScoreCounterProps) {
  const reduced = useReducedMotion();
  const value = useMotionValue(reduced ? target : 0);
  const rounded = useTransform(value, (v) => Math.round(v));
  const [display, setDisplay] = useState(reduced ? target : 0);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    return unsubscribe;
  }, [rounded]);

  useEffect(() => {
    if (reduced) {
      value.set(target);
      setDisplay(target);
      return;
    }
    const controls = animate(value, target, {
      duration,
      ease: EASING.out,
    });
    return () => controls.stop();
  }, [target, duration, reduced, value]);

  return (
    <span
      className={className}
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Match: ${target}${suffix}`}
    >
      {display}
      {suffix}
    </span>
  );
}
