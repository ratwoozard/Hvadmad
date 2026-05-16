/**
 * Shared motion tokens for the HvadMad UI polish layer.
 *
 * All new animations MUST import durations/easings from this module rather
 * than inline magic numbers, so we have a single source of truth for the
 * app's "feel". See specs/002-ui-polish-animations/contracts/components.md §13.
 */

export const DURATION = {
  fast: 0.15,
  base: 0.22,
  exit: 0.16,
  card: 0.3,
  reveal: 0.3,
  count: 0.8,
  spin: 3.0,
} as const;

export const EASING = {
  out: [0.16, 1, 0.3, 1] as const,
  in: [0.7, 0, 0.84, 0] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
} as const;

export const SPRING = {
  default: { type: "spring", stiffness: 300, damping: 30 } as const,
  soft: { type: "spring", stiffness: 180, damping: 22 } as const,
};

export const STAGGER = {
  row: 0.15,
  list: 0.05,
} as const;

export const CURSOR_COLORS = [
  "#f9a825",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#fab63d",
] as const;
