"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { EASING, DURATION } from "@/lib/motion/tokens";

const CursorFollower = dynamic(
  () => import("@/components/ui/effects/CursorFollower").then((m) => m.CursorFollower),
  { ssr: false },
);

const CURSOR_EFFECT_ENABLED =
  process.env.NEXT_PUBLIC_ENABLE_CURSOR_EFFECT !== "false";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length >= 4) {
      router.push(`/join/${code}`);
    }
  };

  const content = (
    <>
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
    </>
  );

  if (CURSOR_EFFECT_ENABLED) {
    return (
      <CursorFollower className="flex min-h-[80vh] w-full flex-col items-center justify-center gap-8">
        {content}
      </CursorFollower>
    );
  }

  return (
    <div className="flex min-h-[80vh] w-full flex-col items-center justify-center gap-8">
      {content}
    </div>
  );
}
