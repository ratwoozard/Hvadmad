"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, FOCUS_RING } from "@/components/ui/FocusRing";
import { useReactions, type FlyingReaction } from "./useReactions";

/**
 * Symbol set offered in the reaction bar. Kept short so the bar fits on
 * one row on a 360px mobile viewport.
 */
const REACTIONS = ["🎉", "❤️", "😂", "🔥", "👏", "🤤"] as const;

interface ReactionBarProps {
  roomCode: string;
  sessionId: string;
  nickname: string;
  /** Hide the helper text under the buttons, useful in tight layouts. */
  hideHint?: boolean;
}

/**
 * Shared multiplayer reaction bar.
 *
 * Renders a row of emoji buttons inline plus a viewport-wide overlay where
 * incoming reactions (own + remote) fly up across the screen with randomized
 * positions, rotations, and scales — same vibe as the inspiration snippet
 * but pulled out of the button so reactions from other peers can use it too.
 */
export function ReactionBar({
  roomCode,
  sessionId,
  nickname,
  hideHint = false,
}: ReactionBarProps) {
  const { reactions, send } = useReactions(roomCode, sessionId, nickname);

  return (
    <>
      <ReactionOverlay reactions={reactions} />

      <div className="relative z-10 flex flex-col items-center gap-2">
        {!hideHint && (
          <p className="text-xs text-gray-500">Send en reaktion ✨</p>
        )}
        <div
          role="group"
          aria-label="Send en reaktion"
          className="flex items-center justify-center gap-1 rounded-full bg-white/95 px-2 py-1.5 shadow-md ring-1 ring-black/5 backdrop-blur"
        >
          {REACTIONS.map((symbol) => (
            <motion.button
              key={symbol}
              type="button"
              onClick={() => send(symbol)}
              whileTap={{ scale: 0.82 }}
              whileHover={{ scale: 1.12 }}
              transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "flex h-11 w-11 select-none items-center justify-center rounded-full text-2xl leading-none",
                "hover:bg-brand-50 active:bg-brand-100",
                FOCUS_RING,
              )}
              aria-label={`Send ${symbol} reaktion`}
            >
              <span aria-hidden="true">{symbol}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </>
  );
}

/**
 * Fullscreen overlay containing the currently airborne reactions. Lives in a
 * separate component so the bar's flex layout doesn't interfere with the
 * fixed-position animation surface.
 */
function ReactionOverlay({ reactions }: { reactions: FlyingReaction[] }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      <AnimatePresence>
        {reactions.map((r) => (
          <FlyingEmoji key={r.id} symbol={r.symbol} fromSelf={r.fromSelf} />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface FlyingEmojiProps {
  symbol: string;
  fromSelf: boolean;
}

function FlyingEmoji({ symbol, fromSelf }: FlyingEmojiProps) {
  // Roll the random numbers once per instance so the same emoji keeps a
  // stable trajectory across re-renders.
  const seed = useMemo(
    () => ({
      startXvw: 8 + Math.random() * 84, // 8–92vw horizontal launch point
      driftXvw: (Math.random() - 0.5) * 24, // ±12vw lateral drift
      rotate: Math.random() * 120 - 60, // ±60° spin
      scale: 1.6 + Math.random() * 1.4, // 1.6–3.0 final scale
      duration: 2.2 + Math.random() * 1.0, // 2.2–3.2s float time
      riseVh: 80 + Math.random() * 15, // 80–95vh climb
    }),
    [],
  );

  return (
    <motion.span
      initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
      animate={{
        x: `${seed.driftXvw}vw`,
        y: `-${seed.riseVh}vh`,
        opacity: 0,
        scale: seed.scale,
        rotate: seed.rotate,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: seed.duration, ease: [0.22, 0.61, 0.36, 1] }}
      className="absolute select-none text-4xl"
      style={{
        left: `${seed.startXvw}vw`,
        bottom: "12vh",
        // Own reactions render slightly brighter so the sender can pick them
        // out from the crowd without needing a label.
        filter: fromSelf ? "drop-shadow(0 0 6px rgba(249,168,37,0.55))" : undefined,
        willChange: "transform, opacity",
      }}
    >
      {symbol}
    </motion.span>
  );
}
