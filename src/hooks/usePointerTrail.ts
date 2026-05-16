"use client";

import { useEffect, useRef, type RefObject } from "react";

export interface PointerPosition {
  x: number;
  y: number;
}

export interface UsePointerTrailOptions {
  /**
   * Element to read coordinates relative to. Defaults to the window
   * (viewport coordinates).
   */
  targetRef?: RefObject<HTMLElement | null>;
  /**
   * When false, no listeners are bound. Useful for opting out at runtime
   * (e.g., when reduced-motion is active).
   */
  enabled?: boolean;
}

/**
 * Binds a single `pointermove` listener (unified mouse + touch + pen) and
 * forwards positions to `onMove` as coordinates relative to `targetRef`
 * (or the window when no ref is provided).
 *
 * Uses a ref for the callback so consumers can pass an inline function
 * without forcing listener re-binding on every render.
 */
export function usePointerTrail(
  onMove: (pos: PointerPosition) => void,
  options: UsePointerTrailOptions = {},
): void {
  const { targetRef, enabled = true } = options;
  const cbRef = useRef(onMove);

  useEffect(() => {
    cbRef.current = onMove;
  }, [onMove]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const handler = (event: PointerEvent) => {
      const el = targetRef?.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        cbRef.current({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      } else {
        cbRef.current({ x: event.clientX, y: event.clientY });
      }
    };

    window.addEventListener("pointermove", handler, { passive: true });
    return () => window.removeEventListener("pointermove", handler);
  }, [enabled, targetRef]);
}
