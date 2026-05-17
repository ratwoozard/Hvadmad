"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { FallingFoods } from "@/components/landing/FallingFoods";
import { WRopeReveal } from "@/components/landing/WRopeReveal";
import { EASING, DURATION } from "@/lib/motion/tokens";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length >= 4) {
      router.push(`/join/${code}`);
    }
  };

  // Warm, brand-aligned gradient. Sits at z-0 (above body bg-gray-50) and is
  // pointer-events-none so it never eats clicks. The image background was
  // replaced because it was too busy behind the foreground content and
  // competing with the falling-food rain layer (z-20) we now render on top.
  const background = (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-b from-brand-50 via-orange-50 to-amber-100"
    />
  );

  const content = (
    <div className="pointer-events-auto relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.base, ease: EASING.out }}
      >
        <h1 className="text-4xl font-bold text-gray-900">🍕 HvadMad</h1>
        <p className="mt-2 text-lg text-gray-600">
          Hvad skal vi spise? Stem sammen!
        </p>
      </motion.div>

      <div className="flex w-full flex-col gap-4">
        <Button
          onClick={() => router.push("/opret")}
          size="lg"
          fullWidth
        >
          🎉 Opret madrum
        </Button>

        <Button
          onClick={() => router.push("/solo")}
          variant="secondary"
          size="lg"
          fullWidth
        >
          🧑 Spil solo
        </Button>

        <AnimatePresence mode="wait" initial={false}>
          {!showJoin ? (
            <motion.div
              key="join-button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.fast }}
            >
              <Button
                onClick={() => setShowJoin(true)}
                variant="secondary"
                size="lg"
                fullWidth
              >
                🔗 Join et rum
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="join-form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: DURATION.base, ease: EASING.out }}
            >
              <Card>
                <form onSubmit={handleJoin}>
                  <Input
                    id="join-code"
                    label="Indtast rumkode"
                    value={joinCode}
                    onChange={(e) =>
                      setJoinCode(e.target.value.toUpperCase())
                    }
                    placeholder="F.eks. ABCD5"
                    className="text-center text-2xl uppercase tracking-widest"
                    maxLength={6}
                    autoFocus
                    autoComplete="off"
                  />
                  <div className="mt-4 flex gap-2">
                    <Button
                      type="submit"
                      disabled={joinCode.trim().length < 4}
                      fullWidth
                    >
                      Gå
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-sm text-gray-400">
        Ingen login. Ingen data. Bare mad. 🍽️
      </p>
    </div>
  );

  return (
    <>
      {background}
      <FallingFoods
        onCatch={() => setShowCredits(true)}
        paused={showCredits}
      />
      <WRopeReveal
        open={showCredits}
        onClose={() => setShowCredits(false)}
      />
      {/* `pointer-events-none` on the wrapper so the empty whitespace
          surrounding the centered card lets clicks fall through to the
          falling-food layer underneath. The inner `content` div re-enables
          pointer events for the real CTA stack. */}
      <div className="pointer-events-none relative z-30 flex min-h-[80vh] w-full flex-col items-center justify-center px-4 py-10">
        {content}
      </div>
    </>
  );
}
