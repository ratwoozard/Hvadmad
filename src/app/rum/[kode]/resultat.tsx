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
  hasAnyValidResult,
} from "@/lib/match/algorithm";
import {
  getClosestMatch,
  getLeastVoted,
  getMostVoted,
  getParticipantTopPicks,
} from "@/lib/match/insights";
import { EASING } from "@/lib/motion/tokens";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { WinnerHero } from "@/components/results/WinnerHero";
import { VoteBars } from "@/components/results/VoteBars";
import { ParticipantPicks } from "@/components/results/ParticipantPicks";
import { StatCards } from "@/components/results/StatCards";
import { ClosestMatch } from "@/components/results/ClosestMatch";
import { RandomWheel, type WheelOption } from "@/components/results/RandomWheel";
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
      setResults(calculated);
      setVotes(allVotes);
      setParticipants(allParticipants);
      setLoading(false);
    }
    loadResults();
  }, [room.id]);

  const validResults = useMemo(
    () => results.filter((r) => !r.is_eliminated),
    [results],
  );

  const winner = validResults[0] ?? null;
  const mostVoted = useMemo(() => getMostVoted(results), [results]);
  const leastVoted = useMemo(() => getLeastVoted(results), [results]);
  const closest = useMemo(() => getClosestMatch(results), [results]);
  const picks = useMemo(
    () => getParticipantTopPicks(participants, votes, results),
    [participants, votes, results],
  );

  const sessionId = typeof window !== "undefined" ? getSessionId() : undefined;

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-bounce">
            <Icon name="ui-gauge" size={48} />
          </div>
          <p className="mt-2 text-gray-500">Beregner resultater...</p>
        </div>
      </div>
    );
  }

  if (!hasAnyValidResult(results)) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">😅</div>
        <h2 className="text-2xl font-bold text-gray-900">Ingen matches!</h2>
        <p className="text-center text-gray-600">
          Gruppen kunne ikke blive enig om noget. Prøv en anden kategori!
        </p>
        <Button as="a" href="/" className="mt-4">
          <Icon name="nav-home" size={20} className="mr-2" /> Start forfra
        </Button>
      </div>
    );
  }

  const wheelOptions: WheelOption[] = validResults.slice(0, 3).map((r) => ({
    id: r.food_option_id,
    name: r.name,
    emoji: r.emoji,
  }));

  const totalVoteCount = votes.length;

  return (
    <div className="flex flex-col gap-4 py-4 pb-32">
      <motion.header
        className="text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASING.out }}
      >
        <h1 className="text-2xl font-bold text-gray-900">
          Afstemning afsluttet
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Tak for jeres stemmer – her er resultatet!
        </p>
      </motion.header>

      <WinnerHero winner={winner} />

      <VoteBars results={validResults} />

      {picks.length > 0 ? (
        <ParticipantPicks picks={picks} currentSessionId={sessionId} />
      ) : null}

      <StatCards
        mostVoted={{
          icon: <Icon name="status-badge-check" size={18} />,
          iconBg: "bg-amber-100",
          label: "Mest stemt",
          value: mostVoted?.result.name ?? null,
          detail: mostVoted
            ? `${mostVoted.count} ${mostVoted.count === 1 ? "stemme" : "stemmer"}`
            : null,
        }}
        leastVoted={{
          icon: <Icon name="ui-leaf" size={18} />,
          iconBg: "bg-violet-100",
          label: "Mindst stemt",
          value: leastVoted?.result.name ?? null,
          detail: leastVoted
            ? `${leastVoted.count} ${leastVoted.count === 1 ? "stemme" : "stemmer"}`
            : null,
        }}
        totalVotes={{
          icon: <Icon name="nav-person" size={18} />,
          iconBg: "bg-sky-100",
          label: "Antal stemmer",
          value: `${totalVoteCount}`,
          detail: `i alt fra ${participants.length} ${participants.length === 1 ? "person" : "personer"}`,
        }}
      />

      {closest ? <ClosestMatch pair={closest} /> : null}

      {wheelOptions.length >= 2 ? (
        <Card className="text-center">
          <p className="mb-3 text-sm text-gray-500">Kan I ikke vælge?</p>
          {!wheelOpen ? (
            <Button
              onClick={() => setWheelOpen(true)}
              fullWidth
              variant="secondary"
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
      ) : null}

      <div className="mt-2 flex flex-col gap-3">
        <Button as="a" href="/opret" fullWidth size="lg">
          🔁 Stem igen
        </Button>
        <Button as="a" href="/" variant="secondary" fullWidth size="lg">
          <Icon name="nav-home" size={20} className="mr-2" /> Forsiden
        </Button>
      </div>

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
