/**
 * Tiny classnames helper. Mirrors `src/components/ui/FocusRing.tsx`'s `cn`,
 * but lives under `@/lib/utils` for components that follow the more common
 * import convention (e.g. ones lifted from third-party snippets).
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
