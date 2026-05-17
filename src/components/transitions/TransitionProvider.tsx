"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { PixelateWipe, type WipePattern } from "./PixelateWipe";

interface PixelateOptions {
  pattern?: WipePattern;
  cols?: number;
  rows?: number;
  cellFadeMs?: number;
  staggerMs?: number;
  color?: string;
}

interface TransitionContextValue {
  pixelateTo: (href: string, options?: PixelateOptions) => void;
  isTransitioning: boolean;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function useSceneTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) {
    throw new Error(
      "useSceneTransition must be used within <TransitionProvider />",
    );
  }
  return ctx;
}

const DEFAULT_OPTIONS: Required<PixelateOptions> = {
  pattern: "wave",
  cols: 14,
  rows: 8,
  cellFadeMs: 140,
  staggerMs: 360,
  // brand-50 — soft cream that matches the frontpage background so the
  // wipe blends with the existing palette instead of cutting to black.
  color: "#fef3e2",
};

/**
 * Reveal-only pixelate transition.
 *
 *   1. `pixelateTo(href)` is called from a click handler.
 *   2. We immediately `router.push(href)` so the destination page begins
 *      mounting underneath the overlay on the very next render.
 *   3. A `<PixelateWipe phase="revealing">` mounts fully opaque, then each
 *      cell fades out on its staggered wave/diagonal/spiral schedule —
 *      revealing the new page through the gaps instead of leaving the user
 *      staring at a flat color.
 *
 * Compared to the older cover→navigate→reveal model, the user spends the
 * whole transition watching the next page emerge instead of seeing a solid
 * block of color between the two pages.
 */
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();

  const [active, setActive] = useState(false);
  const [options, setOptions] = useState<Required<PixelateOptions>>(
    DEFAULT_OPTIONS,
  );

  const pixelateTo = useCallback(
    (href: string, opts?: PixelateOptions) => {
      if (active) return;
      setOptions({ ...DEFAULT_OPTIONS, ...opts });
      setActive(true);
      router.push(href);
    },
    [active, router],
  );

  const handleRevealed = useCallback(() => {
    setActive(false);
  }, []);

  return (
    <TransitionContext.Provider
      value={{ pixelateTo, isTransitioning: active }}
    >
      {children}
      {active && (
        <PixelateWipe
          phase="revealing"
          pattern={options.pattern}
          cols={options.cols}
          rows={options.rows}
          cellFadeMs={options.cellFadeMs}
          staggerMs={options.staggerMs}
          color={options.color}
          onComplete={handleRevealed}
        />
      )}
    </TransitionContext.Provider>
  );
}
