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

    const engine = mountFollowerEngine(svgRef.current, {
      colors,
      removeDelay,
      maxShapes,
    });
    engineRef.current = engine;

    let rafId = 0;
    const loop = () => {
      engine.tick();
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
