"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { cn, FOCUS_RING } from "@/components/ui/FocusRing";
import { EASING, DURATION } from "@/lib/motion/tokens";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable, InertiaPlugin);
}

interface WRopeRevealProps {
  open: boolean;
  onClose: () => void;
}

const ROPE_WIDTH = 3;
/** CSS length for the rope. Tuned so the bottom of the rope (= top of the W)
 *  sits BELOW the landing page's CTA stack on a typical phone-sized viewport
 *  (~700–820px tall). That way the interactive W never visually or
 *  physically overlaps with "Opret madrum / Spil solo / Join et rum". */
const ROPE_HEIGHT_CSS = "min(62vh, 500px)";
const W_SIZE = 140;
const W_HREF = "https://www.WeGoDigital.dk";

/**
 * Easter-egg shown after the user "catches" a falling food on the landing
 * page. A rope drops in from above with the WeGoDigital "W" mascot hanging
 * from it (swings + draggable, GSAP-style), and a WeGoDigital site link plus
 * a LinkedIn icon appear at the bottom as the creator credit.
 *
 * IMPORTANT: this is intentionally NON-MODAL. The landing page's CTAs ("Opret
 * madrum", "Spil solo", "Join et rum") must stay visually clear and
 * clickable while the easter-egg is open, so:
 *   - The wrapper is `pointer-events-none` — empty space lets clicks fall
 *     through to the page underneath.
 *   - The rope is long enough that the W mascot hangs BELOW the CTA stack,
 *     so the W can be `pointer-events-auto` (click + drag) without blocking
 *     any CTA clicks.
 *   - Only the rope line, the W (link), the credit links, and the X close
 *     button opt back into pointer events.
 *   - There is no dimming/blurring backdrop — the page stays at full
 *     brightness.
 *
 * The W is BOTH:
 *   - A link to WeGoDigital.dk (opens in new tab) — a plain click activates
 *     the anchor and opens the site. GSAP Draggable's default `clickableTest`
 *     leaves anchor/button clicks alone when there's no drag movement.
 *   - Draggable — grab and swing it around. Drag is detected by GSAP on the
 *     parent rope element once the pointer moves past `minimumMovement`
 *     (default 2px), at which point the anchor click is suppressed.
 *
 * Dismiss: press Esc, or click the explicit close (X) button.
 */
export function WRopeReveal({ open, onClose }: WRopeRevealProps) {
  const ropeRef = useRef<HTMLDivElement>(null);
  const swingRef = useRef<gsap.core.Tween | null>(null);
  const entranceRef = useRef<gsap.core.Tween | null>(null);
  const draggableRef = useRef<Draggable | null>(null);

  // Esc to dismiss. We deliberately do NOT auto-focus anything when the
  // easter-egg opens — focus shifting would interrupt a user who's mid-tab
  // through the page's CTAs.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Rope swing + draggability — runs only while open.
  useEffect(() => {
    if (!open || !ropeRef.current) return;
    const rope = ropeRef.current;

    const MIN_ANGLE = 6;
    let angle = 14;
    let direction = -1;
    const GRAVITY = 2.2;

    const startSwing = () => {
      swingRef.current = gsap.to(rope, {
        rotation: direction * angle,
        duration: 1.6 + angle / 40,
        ease: "sine.inOut",
        onComplete: () => {
          angle = Math.max(angle - GRAVITY, MIN_ANGLE);
          direction *= -1;
          startSwing();
        },
      });
    };

    // Entrance: drop the rope in from the top, then start swinging.
    gsap.set(rope, { scaleY: 0, rotation: 0, transformOrigin: "top center" });
    entranceRef.current = gsap.to(rope, {
      scaleY: 1,
      duration: 0.85,
      ease: "power3.out",
      onComplete: startSwing,
    });

    const dragInstances = Draggable.create(rope, {
      type: "rotation",
      inertia: true,
      bounds: { minRotation: -85, maxRotation: 85 },
      dragResistance: 0.45,
      throwResistance: 1600,
      edgeResistance: 1,
      onPress: () => {
        swingRef.current?.kill();
      },
      onRelease: function (this: Draggable) {
        setTimeout(
          () => {
            direction = this.rotation >= 0 ? -1 : 1;
            angle = Math.max(Math.abs(this.rotation) - GRAVITY * 2, MIN_ANGLE);
            startSwing();
          },
          (this.tween?.duration() ?? 0) * 900,
        );
      },
    });
    draggableRef.current = dragInstances[0] ?? null;

    return () => {
      entranceRef.current?.kill();
      swingRef.current?.kill();
      draggableRef.current?.kill();
      entranceRef.current = null;
      swingRef.current = null;
      draggableRef.current = null;
    };
  }, [open]);

  return (
    <motion.div
      aria-label="Bygget af WeGoDigital"
      initial={false}
      animate={open ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: DURATION.base, ease: EASING.out }}
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center"
      style={{ visibility: open ? "visible" : "hidden" }}
    >
      {/* Close (X) — top right. Only this, the rope line, and the credits opt
          into pointer events; everything else lets clicks fall through to the
          landing page underneath. */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Luk"
        className={cn(
          "pointer-events-auto absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md ring-1 ring-black/5 transition-colors hover:bg-white hover:text-gray-900",
          FOCUS_RING,
        )}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Rope + W mascot column. Stretches to fill height so the rope hangs
          from the top and the credit links sit pinned to the bottom. */}
      <div className="relative z-10 flex w-full flex-1 flex-col items-center">
        <div
          ref={ropeRef}
          className="rope pointer-events-auto relative cursor-grab select-none active:cursor-grabbing"
          style={{
            width: ROPE_WIDTH,
            height: ROPE_HEIGHT_CSS,
            backgroundColor: "#3b3d40",
            transformOrigin: "top center",
            willChange: "transform",
          }}
        >
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 rounded-full"
            style={{
              width: 14,
              height: 14,
              backgroundColor: "#3b3d40",
              transform: "translate(-50%, -50%)",
            }}
            aria-hidden="true"
          />

          {/* The W is a real anchor — a plain click opens WeGoDigital.dk in
              a new tab; a drag is intercepted by GSAP Draggable on the parent
              rope. We position it BELOW the CTAs (see ROPE_HEIGHT_CSS) so it
              can be `pointer-events-auto` without ever covering a CTA. */}
          <a
            href={W_HREF}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Besøg WeGoDigital.dk"
            className={cn(
              "pointer-events-auto absolute left-1/2 top-full block -translate-x-1/2 cursor-pointer transition-transform duration-200 ease-out hover:scale-[1.06] active:scale-[0.97]",
              FOCUS_RING,
              "rounded-full",
            )}
            style={{
              width: W_SIZE,
              height: W_SIZE,
            }}
            // Prevent the browser's native drag-and-drop for images from
            // hijacking the GSAP Draggable interaction on the rope.
            onDragStart={(e) => e.preventDefault()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/branding/wegodigital-w.png"
              alt=""
              draggable={false}
              className="pointer-events-none h-full w-full select-none object-contain drop-shadow-[0_10px_22px_rgba(0,0,0,0.25)]"
            />
          </a>
        </div>

        {/* Credit links pinned to the bottom. Compact single row so they
            fit in the space below the W without overlapping on phones. */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={
            open
              ? { opacity: 1, y: 0, transition: { delay: 0.7, duration: 0.35 } }
              : { opacity: 0, y: 12 }
          }
          className="pointer-events-auto mt-auto mb-6 flex flex-row items-center gap-2 px-4"
        >
          <span className="rounded-full bg-gray-900/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
            Bygget af
          </span>
          <a
            href={W_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "rounded-full bg-white/95 px-4 py-2 text-base font-bold text-brand-700 shadow-md ring-1 ring-black/5 transition-transform duration-150 hover:scale-105 hover:bg-white",
              FOCUS_RING,
            )}
          >
            WeGoDigital.dk
          </a>
          <a
            href="https://www.linkedin.com/in/lukacwigo"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Lukacwigo på LinkedIn"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#0A66C2] text-white shadow-md transition-transform duration-150 hover:scale-110",
              FOCUS_RING,
            )}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>
        </motion.div>
      </div>
    </motion.div>
  );
}
