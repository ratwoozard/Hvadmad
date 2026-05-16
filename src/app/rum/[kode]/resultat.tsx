"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Room, Participant } from "@/types/room";
import type { MatchResult } from "@/types/voting";
import {
  getVotesForRoom,
  getRoomFoodOptions,
  getParticipants,
} from "@/lib/supabase/queries";
import {
  calculateResults,
  getTopResults,
  hasAnyValidResult,
} from "@/lib/match/algorithm";
import { resultStagger } from "@/lib/motion/variants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ResultRow } from "@/components/results/ResultRow";
import { RandomWheel, type WheelOption } from "@/components/results/RandomWheel";

interface ResultatProps {
  room: Room;
  participant: Participant;
}

export default function Resultat({ room }: ResultatProps) {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [wheelOpen, setWheelOpen] = useState(false);

  useEffect(() => {
    async function loadResults() {
      const [votes, foodOptions, participants] = await Promise.all([
        getVotesForRoom(room.id),
        getRoomFoodOptions(room.id),
        getParticipants(room.id),
      ]);

      const calculated = calculateResults(
        votes,
        foodOptions,
        participants.length,
      );
      const top = getTopResults(calculated, 5);
      setResults(top);
      setLoading(false);
    }
    loadResults();
  }, [room.id]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce text-4xl">📊</div>
          <p className="mt-2 text-gray-500">Beregner resultater...</p>
        </div>
      </div>
    );
  }

  if (
    !hasAnyValidResult(results.map((r) => ({ ...r, is_eliminated: false })))
  ) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">😅</div>
        <h2 className="text-2xl font-bold text-gray-900">Ingen matches!</h2>
        <p className="text-center text-gray-600">
          Gruppen kunne ikke blive enig om noget. Prøv en anden kategori!
        </p>
        <Button as="a" href="/" className="mt-4">
          🏠 Start forfra
        </Button>
      </div>
    );
  }

  const wheelOptions: WheelOption[] = results.slice(0, 3).map((r) => ({
    id: r.food_option_id,
    name: r.name,
    emoji: r.emoji,
  }));

  return (
    <div className="flex flex-col gap-6 py-4">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">🎉 Resultater</h1>
        <p className="mt-1 text-gray-600">Her er gruppens bedste matches</p>
      </motion.div>

      <motion.div
        variants={resultStagger}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-3"
      >
        {results.map((result, index) => (
          <ResultRow
            key={result.food_option_id}
            rank={index + 1}
            name={result.name}
            emoji={result.emoji}
            matchPercent={result.match_percentage}
            explanation={result.explanation}
            isTop={index === 0}
          />
        ))}
      </motion.div>

      <Card className="text-center">
        <p className="mb-3 text-sm text-gray-500">Kan I ikke vælge?</p>
        {!wheelOpen ? (
          <Button
            onClick={() => setWheelOpen(true)}
            fullWidth
            disabled={wheelOptions.length < 2}
          >
            🎲 Spin hjulet!
          </Button>
        ) : (
          <RandomWheel
            key={wheelOptions.map((o) => o.id).join("-")}
            options={wheelOptions}
            onResult={() => {
              // Result already rendered inside RandomWheel via aria-live.
            }}
          />
        )}
        {wheelOpen && (
          <Button
            onClick={() => setWheelOpen(false)}
            variant="ghost"
            size="sm"
            className="mt-3"
          >
            Skjul hjulet
          </Button>
        )}
      </Card>

      <Button as="a" href="/" variant="secondary" fullWidth>
        🏠 Start forfra
      </Button>
    </div>
  );
}
