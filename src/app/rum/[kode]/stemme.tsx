"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
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
import { Button } from "@/components/ui/Button";
import { VoteCard, type VoteDirection } from "@/components/voting/VoteCard";
import { VoteProgress } from "@/components/voting/VoteProgress";
import { Avatar } from "@/components/avatar/Avatar";

interface StemmeProps {
  room: Room;
  participant: Participant;
  onRoomUpdate: (room: Room) => void;
}

function directionFor(value: VoteValue): VoteDirection {
  if (value === VOTE_JA) return "ja";
  if (value === VOTE_NEJ) return "nej";
  return "maaske";
}

export default function Stemme({ room, participant, onRoomUpdate }: StemmeProps) {
  const [options, setOptions] = useState<FoodOption[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [exitDirection, setExitDirection] = useState<VoteDirection | null>(null);

  useEffect(() => {
    async function loadOptions() {
      const foodOptions = await getRoomFoodOptions(room.id);
      setOptions(foodOptions);
      setLoading(false);
    }
    loadOptions();
  }, [room.id]);

  const handleVote = useCallback(
    async (value: VoteValue) => {
      if (submitting || loading || currentIndex >= options.length) return;
      setSubmitting(true);
      setExitDirection(directionFor(value));

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

          window.setTimeout(() => setDone(true), 280);
        } else {
          window.setTimeout(() => {
            setCurrentIndex((prev) => prev + 1);
            setExitDirection(null);
          }, 280);
        }
      } catch {
        setExitDirection(null);
      }

      setSubmitting(false);
    },
    [
      submitting,
      loading,
      currentIndex,
      options,
      room.id,
      room.code,
      participant.id,
      participant.nickname,
    ],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        handleVote(VOTE_JA);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        handleVote(VOTE_NEJ);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleVote(VOTE_MAASKE);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleVote]);

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce text-4xl">🗳️</div>
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
          <Button
            onClick={async () => {
              await updateRoomStatus(room.id, "results");
              const channel = createRoomChannel(room.code);
              broadcastStatusChange(channel, {
                new_status: "results",
                triggered_by: getSessionId(),
              });
              onRoomUpdate({ ...room, status: "results" });
            }}
            className="mt-4"
          >
            📊 Vis resultater nu
          </Button>
        )}
      </div>
    );
  }

  const currentOption = options[currentIndex];

  return (
    <div className="flex min-h-[80vh] flex-col justify-between gap-6 py-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Avatar
            config={{
              avatar_id: participant.avatar_id ?? null,
              hat_ids: participant.hat_ids ?? [],
            }}
            size="sm"
          />
          <span>
            Du stemmer som{" "}
            <span className="font-medium text-gray-900">
              {participant.nickname}
            </span>
          </span>
        </div>
        <VoteProgress current={currentIndex} total={options.length} />
      </div>

      <div className="relative flex-1">
        <AnimatePresence mode="popLayout" initial={false}>
          {currentOption && (
            <VoteCard
              key={currentOption.id}
              option={currentOption}
              exitDirection={exitDirection}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          onClick={() => handleVote(VOTE_JA)}
          disabled={submitting}
          variant="vote-yes"
          size="lg"
          fullWidth
          aria-keyshortcuts="ArrowUp"
        >
          👍 Ja!
        </Button>
        <Button
          onClick={() => handleVote(VOTE_MAASKE)}
          disabled={submitting}
          variant="vote-maybe"
          size="lg"
          fullWidth
          aria-keyshortcuts="ArrowRight"
        >
          🤷 Måske
        </Button>
        <Button
          onClick={() => handleVote(VOTE_NEJ)}
          disabled={submitting}
          variant="vote-no"
          size="lg"
          fullWidth
          aria-keyshortcuts="ArrowDown"
        >
          👎 Nej tak
        </Button>
        <p className="text-center text-xs text-gray-400">
          Tip: brug piletasterne ↑ ↓ → for at stemme hurtigt
        </p>
      </div>
    </div>
  );
}
