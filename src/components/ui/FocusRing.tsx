/**
 * Shared focus-ring utility classes. Apply via `cn(FOCUS_RING, ...)` so every
 * interactive element gets the same visible keyboard focus treatment (WCAG-
 * compliant contrast, 2px offset, 2px ring).
 */
export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white";

/**
 * Tiny classnames helper. Avoids adding `clsx` as a dependency for what is
 * essentially `[a, b, c].filter(Boolean).join(' ')`.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
