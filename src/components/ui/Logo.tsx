"use client";

import Image from "next/image";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

import { DURATION, EASING } from "@/lib/motion/tokens";

/**
 * Logo variants:
 *   - "primary": full logotype (pot + crown + "HVAD MAD.DK") on light backgrounds.
 *   - "dark":    same composition tuned for dark backgrounds (cream "MAD.DK").
 *   - "mark":    pot-only mark for tight spaces (header avatar slot, small tiles).
 *   - "icon":    rounded-square app-icon treatment with subtle shadow.
 *
 * Sizes are intrinsic to each PNG. We always render through `next/image` so
 * Next.js can serve modern formats and resize automatically.
 *
 * Set `animated` to give the hero a gentle pop-in (used on the landing page).
 * Honors `prefers-reduced-motion` via the parent `MotionConfig` provider in
 * `src/app/layout.tsx`.
 */

type LogoVariant = "primary" | "dark" | "mark" | "icon";

type LogoProps = Omit<HTMLMotionProps<"div">, "ref"> & {
  variant?: LogoVariant;
  width?: number;
  height?: number;
  priority?: boolean;
  alt?: string;
  animated?: boolean;
  className?: string;
};

const SOURCES: Record<LogoVariant, string> = {
  primary: "/branding/logo-primary.png",
  dark: "/branding/logo-dark.png",
  mark: "/branding/logo-mark.png",
  icon: "/branding/app-icon.png",
};

const DEFAULT_DIMENSIONS: Record<LogoVariant, { width: number; height: number }> = {
  primary: { width: 320, height: 320 },
  dark: { width: 320, height: 320 },
  mark: { width: 96, height: 96 },
  icon: { width: 128, height: 128 },
};

export const Logo = forwardRef<HTMLDivElement, LogoProps>(function Logo(
  {
    variant = "primary",
    width,
    height,
    priority = false,
    alt = "HvadMad",
    animated = false,
    className = "",
    ...rest
  },
  ref,
) {
  const src = SOURCES[variant];
  const dims = DEFAULT_DIMENSIONS[variant];
  const w = width ?? dims.width;
  const h = height ?? dims.height;

  const motionProps = animated
    ? {
        initial: { opacity: 0, y: 12, scale: 0.96 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: DURATION.base, ease: EASING.out },
      }
    : {};

  return (
    <motion.div
      ref={ref}
      className={`relative inline-block ${className}`}
      style={{ width: w, height: h }}
      {...motionProps}
      {...rest}
    >
      <Image
        src={src}
        alt={alt}
        width={w}
        height={h}
        priority={priority}
        className="h-full w-full select-none object-contain"
        draggable={false}
      />
    </motion.div>
  );
});
