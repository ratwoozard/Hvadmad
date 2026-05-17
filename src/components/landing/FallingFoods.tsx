"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * A sparse, slow rain of clickable 3D-style food characters that drift from
 * the top of the viewport to the bottom. Each item is an accessible button —
 * clicking (or activating with the keyboard) calls `onCatch` which the parent
 * uses to drop the WeGoDigital "W" rope easter-egg.
 *
 * Design constraints (per UI request):
 *  - Not too many on screen (cap at MAX_ACTIVE).
 *  - Not too frequent (SPAWN_MIN/MAX_MS).
 *  - Not too fast (FALL_MIN/MAX_S).
 *  - Honour prefers-reduced-motion: skip the rain entirely so we don't strobe.
 *  - Stay out of the way of real CTAs: the wrapper is pointer-events-none and
 *    only the food buttons opt back in, so empty space never eats clicks.
 */

const FOODS: ReadonlyArray<{ src: string; alt: string }> = [
  { src: "/characters/pizza.png", alt: "Pizza" },
  { src: "/characters/taco.png", alt: "Taco" },
  { src: "/characters/sushi.png", alt: "Sushi" },
  { src: "/characters/burger.png", alt: "Burger" },
  { src: "/characters/donut.png", alt: "Donut" },
  { src: "/characters/croissant.png", alt: "Croissant" },
  { src: "/characters/icecream.png", alt: "Is" },
  { src: "/characters/strawberry.png", alt: "Jordbær" },
  { src: "/characters/avocado.png", alt: "Avocado" },
  { src: "/characters/hotdog.png", alt: "Hotdog" },
  { src: "/characters/ramen.png", alt: "Ramen" },
  { src: "/characters/pancakes.png", alt: "Pandekager" },
  { src: "/characters/dumpling.png", alt: "Dumpling" },
  { src: "/characters/onigiri.png", alt: "Onigiri" },
];

const MAX_ACTIVE = 6;
const SPAWN_MIN_MS = 1600;
const SPAWN_MAX_MS = 3200;
const FALL_MIN_S = 9;
const FALL_MAX_S = 14;
const SIZE_MIN_PX = 44;
const SIZE_MAX_PX = 72;

interface Drop {
  id: number;
  src: string;
  alt: string;
  leftPct: number;
  size: number;
  duration: number;
  rotateFrom: number;
  rotateTo: number;
  drift: number;
}

interface FallingFoodsProps {
  /** Called when the user clicks/activates a falling food item. */
  onCatch: () => void;
  /** When true, no new items spawn (e.g. while the rope easter-egg is open). */
  paused?: boolean;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function pickFood(): { src: string; alt: string } {
  return FOODS[Math.floor(Math.random() * FOODS.length)];
}

export function FallingFoods({ onCatch, paused = false }: FallingFoodsProps) {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (reducedMotion || paused) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const spawn = () => {
      if (cancelled) return;

      setDrops((current) => {
        if (current.length >= MAX_ACTIVE) return current;
        const food = pickFood();
        const next: Drop = {
          id: ++idRef.current,
          src: food.src,
          alt: food.alt,
          leftPct: rand(2, 92),
          size: rand(SIZE_MIN_PX, SIZE_MAX_PX),
          duration: rand(FALL_MIN_S, FALL_MAX_S),
          rotateFrom: rand(-25, 25),
          rotateTo: rand(180, 540) * (Math.random() < 0.5 ? -1 : 1),
          drift: rand(-40, 40),
        };
        return [...current, next];
      });

      timeoutId = setTimeout(spawn, rand(SPAWN_MIN_MS, SPAWN_MAX_MS));
    };

    timeoutId = setTimeout(spawn, 800);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [reducedMotion, paused]);

  const handleCatch = (id: number) => {
    setDrops((current) => current.filter((d) => d.id !== id));
    onCatch();
  };

  if (reducedMotion) return null;

  return (
    <div
      aria-hidden="false"
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
    >
      <AnimatePresence>
        {drops.map((d) => (
          <motion.button
            key={d.id}
            type="button"
            aria-label={`Fang ${d.alt}`}
            onClick={() => handleCatch(d.id)}
            initial={{
              top: "-10vh",
              x: 0,
              rotate: d.rotateFrom,
              opacity: 0,
            }}
            animate={{
              top: "110vh",
              x: d.drift,
              rotate: d.rotateTo,
              opacity: [0, 1, 1, 1, 0.9],
            }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.25 } }}
            transition={{
              duration: d.duration,
              ease: "linear",
              opacity: {
                duration: d.duration,
                times: [0, 0.05, 0.5, 0.9, 1],
                ease: "linear",
              },
            }}
            onAnimationComplete={() => {
              setDrops((current) => current.filter((x) => x.id !== d.id));
            }}
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.9 }}
            style={{
              left: `${d.leftPct}%`,
              width: d.size,
              height: d.size,
              willChange: "transform, top, opacity",
            }}
            className="pointer-events-auto absolute cursor-pointer select-none rounded-full p-1 outline-none transition-[filter] duration-150 hover:drop-shadow-[0_6px_14px_rgba(0,0,0,0.18)] focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            {/* Use a plain <img> so we don't pay the next/image cost for
                short-lived decorative sprites. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={d.src}
              alt=""
              draggable={false}
              className="h-full w-full object-contain"
            />
          </motion.button>
        ))}
      </AnimatePresence>
    </div>
  );
}
