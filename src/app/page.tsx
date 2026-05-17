"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { EASING, DURATION } from "@/lib/motion/tokens";
import { useSceneTransition } from "@/components/transitions/TransitionProvider";

export default function Home() {
  const router = useRouter();
  const { pixelateTo, isTransitioning } = useSceneTransition();
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length >= 4) {
      router.push(`/join/${code}`);
    }
  };

  // Render the background as `fixed` so it ignores the layout's `max-w-md`
  // <main> and actually covers the whole viewport. Placed before the content
  // in source order so it paints underneath without needing a negative z-index
  // (which would clash with body's `bg-gray-50`).
  const background = (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/backgrounds/frontpage-food-bg.png')",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-white/40 via-white/55 to-white/65"
      />
    </>
  );

  const content = (
    <div className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8">
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
          onClick={() => pixelateTo("/opret", { pattern: "wave" })}
          size="lg"
          fullWidth
          disabled={isTransitioning}
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
      <div className="relative flex min-h-[80vh] w-full flex-col items-center justify-center px-4 py-10">
        {content}
      </div>
    </>
  );
}
