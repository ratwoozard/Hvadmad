"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { usePointerTrail } from "@/hooks/usePointerTrail";
import { CURSOR_COLORS } from "@/lib/motion/tokens";
import { mountFollowerEngine, type FollowerEngine } from "./follower-engine";

export interface CursorFollowerProps {
  colors?: readonly string[];
  removeDelay?: number;
  maxShapes?: number;
  className?: string;
  children?: ReactNode;
}

/**
 * Renders a playful, colourful SVG cursor trail behind its children.
 * The SVG layer has `pointer-events: none` so all clicks and touches pass
 * straight through to the underlying content.
 *
 * Returns just `<div>{children}</div>` when the user has reduced-motion
 * enabled, so there is zero runtime overhead in that mode.
 */
export function CursorFollower({
  colors = CURSOR_COLORS,
  removeDelay = 400,
  maxShapes = 20,
  className,
  children,
}: CursorFollowerProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const engineRef = useRef<FollowerEngine | null>(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion || !svgRef.current) return;

    let currentDelay = removeDelay;
    let engine = mountFollowerEngine(svgRef.current, {
      colors,
      removeDelay: currentDelay,
      maxShapes,
    });
    engineRef.current = engine;

    // Adaptive degradation: sample frame timing over a rolling 2s window
    // and halve `removeDelay` if average FPS drops below 30 — re-mount the
    // engine so existing trails are not stranded with old timings.
    let rafId = 0;
    let lastFrame = performance.now();
    let frames = 0;
    let elapsed = 0;
    const DEGRADE_AFTER_MS = 2000;
    const MIN_DELAY = 80;
    let hasDegraded = false;

    const loop = (now: number) => {
      engine.tick();

      const delta = now - lastFrame;
      lastFrame = now;
      frames += 1;
      elapsed += delta;

      if (!hasDegraded && elapsed >= DEGRADE_AFTER_MS) {
        const avgFps = (frames / elapsed) * 1000;
        if (avgFps < 30 && currentDelay > MIN_DELAY && svgRef.current) {
          hasDegraded = true;
          currentDelay = Math.max(MIN_DELAY, Math.floor(currentDelay / 2));
          engine.destroy();
          engine = mountFollowerEngine(svgRef.current, {
            colors,
            removeDelay: currentDelay,
            maxShapes: Math.max(4, Math.floor(maxShapes / 2)),
          });
          engineRef.current = engine;
        }
        frames = 0;
        elapsed = 0;
      }

      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      engine.destroy();
      engineRef.current = null;
    };
  }, [reducedMotion, colors, removeDelay, maxShapes]);

  usePointerTrail(
    (pos) => {
      engineRef.current?.addPoint(pos);
    },
    { targetRef: wrapperRef, enabled: !reducedMotion },
  );

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={wrapperRef} className={className} style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        aria-hidden="true"
        role="presentation"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          overflow: "visible",
        }}
      />
      {children}
    </div>
  );
}

export default CursorFollower;
