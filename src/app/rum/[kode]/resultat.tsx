"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Room, Participant } from "@/types/room";
import type { MatchResult, Vote } from "@/types/voting";
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
import { resultStagger, fadeUp } from "@/lib/motion/variants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ResultRow } from "@/components/results/ResultRow";
import { RandomWheel, type WheelOption } from "@/components/results/RandomWheel";
import {
  VoteAttribution,
} from "@/components/avatar/VoteAttribution";
import {
  groupVotesByOption,
  EMPTY_GROUP,
} from "@/lib/avatars/attribution";
import { getSessionId } from "@/lib/session";
import { ReactionBar } from "@/components/reactions/ReactionBar";

interface ResultatProps {
  room: Room;
  participant: Participant;
}

export default function Resultat({ room, participant }: ResultatProps) {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [wheelOpen, setWheelOpen] = useState(false);

  useEffect(() => {
    async function loadResults() {
      const [allVotes, foodOptions, allParticipants] = await Promise.all([
        getVotesForRoom(room.id),
        getRoomFoodOptions(room.id),
        getParticipants(room.id),
      ]);

      const calculated = calculateResults(
        allVotes,
        foodOptions,
        allParticipants.length,
      );
      const top = getTopResults(calculated, 5);
      setResults(top);
      setVotes(allVotes);
      setParticipants(allParticipants);
      setLoading(false);
    }
    loadResults();
  }, [room.id]);

  const attribution = useMemo(
    () => groupVotesByOption(votes, participants),
    [votes, participants],
  );

  const sessionId = typeof window !== "undefined" ? getSessionId() : undefined;

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
    <div className="flex flex-col gap-6 py-4 pb-32">
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
        className="flex flex-col gap-4"
      >
        {results.map((result, index) => {
          const group = attribution.get(result.food_option_id) ?? EMPTY_GROUP;
          return (
            <motion.div key={result.food_option_id} variants={fadeUp}>
              <ResultRow
                rank={index + 1}
                name={result.name}
                emoji={result.emoji}
                matchPercent={result.match_percentage}
                explanation={result.explanation}
                isTop={index === 0}
              />
              <VoteAttribution
                group={group}
                currentSessionId={sessionId}
              />
            </motion.div>
          );
        })}
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
            onResult={() => {}}
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

      {sessionId && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
          <div className="pointer-events-auto">
            <ReactionBar
              roomCode={room.code}
              sessionId={sessionId}
              nickname={participant.nickname}
            />
          </div>
        </div>
      )}
    </div>
  );
}
