"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Room, Participant } from "@/types/room";
import type { FoodOption } from "@/types/food";
import type { VoteValue } from "@/types/voting";
import { VOTE_JA, VOTE_MAASKE, VOTE_NEJ } from "@/types/voting";
import {
  getRoomFoodOptions,
  submitVote,
  updateParticipantVoted,
  updateRoomStatus,
} from "@/lib/supabase/queries";
import { getSessionId } from "@/lib/session";
import {
  createRoomChannel,
  broadcastVoteProgress,
  broadcastStatusChange,
} from "@/lib/supabase/realtime";

interface StemmeProps {
  room: Room;
  participant: Participant;
  onRoomUpdate: (room: Room) => void;
}

export default function Stemme({ room, participant, onRoomUpdate }: StemmeProps) {
  const [options, setOptions] = useState<FoodOption[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      const foodOptions = await getRoomFoodOptions(room.id);
      setOptions(foodOptions);
      setLoading(false);
    }
    loadOptions();
  }, [room.id]);

  const handleVote = async (value: VoteValue) => {
    if (submitting || currentIndex >= options.length) return;
    setSubmitting(true);

    const option = options[currentIndex];

    try {
      await submitVote(room.id, participant.id, option.id, value);

      if (currentIndex + 1 >= options.length) {
        await updateParticipantVoted(participant.id);

        const channel = createRoomChannel(room.code);
        broadcastVoteProgress(channel, {
          session_id: getSessionId(),
          nickname: participant.nickname,
          total_voted: 0,
          total_participants: 0,
        });

        setDone(true);
      } else {
        setCurrentIndex((prev) => prev + 1);
      }
    } catch (e: any) {
      // Retry silently
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce">🗳️</div>
          <p className="mt-2 text-gray-500">Indlæser madmuligheder...</p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-900">Du er færdig!</h2>
        <p className="text-gray-600">Venter på de andre deltagere...</p>
        <div className="mt-4 animate-pulse text-2xl">⏳</div>

        {participant.is_host && (
          <button
            onClick={async () => {
              await updateRoomStatus(room.id, "results");
              const channel = createRoomChannel(room.code);
              broadcastStatusChange(channel, {
                new_status: "results",
                triggered_by: getSessionId(),
              });
              onRoomUpdate({ ...room, status: "results" });
            }}
            className="btn-primary mt-4"
          >
            📊 Vis resultater nu
          </button>
        )}
      </div>
    );
  }

  const currentOption = options[currentIndex];

  return (
    <div className="flex min-h-[80vh] flex-col justify-between gap-6 py-4">
      <div className="text-center">
        <div className="flex items-center justify-between px-2">
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {options.length}
          </span>
          <div className="h-2 flex-1 mx-4 rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-brand-500 transition-all duration-300"
              style={{
                width: `${((currentIndex) / options.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentOption.id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
          className="card text-center py-12"
        >
          <div className="text-6xl mb-4">{currentOption.emoji || "🍽️"}</div>
          <h2 className="text-2xl font-bold text-gray-900">
            {currentOption.name}
          </h2>
          {currentOption.description && (
            <p className="mt-2 text-gray-500">{currentOption.description}</p>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-3">
        <button
          onClick={() => handleVote(VOTE_JA)}
          disabled={submitting}
          className="btn-vote-yes w-full"
        >
          👍 Ja!
        </button>
        <button
          onClick={() => handleVote(VOTE_MAASKE)}
          disabled={submitting}
          className="btn-vote-maybe w-full"
        >
          🤷 Måske
        </button>
        <button
          onClick={() => handleVote(VOTE_NEJ)}
          disabled={submitting}
          className="btn-vote-no w-full"
        >
          👎 Nej tak
        </button>
      </div>
    </div>
  );
}
