"use client";

import { useState } from "react";
import type { Room, Participant, VotingCategory } from "@/types/room";
import { CATEGORY_LABELS, CATEGORY_EMOJIS } from "@/types/room";
import {
  updateRoomStatus,
  getFoodOptionsByCategory,
  setRoomFoodOptions,
} from "@/lib/supabase/queries";
import { selectRandomOptions } from "@/lib/food/selection";
import { getSessionId } from "@/lib/session";

const CATEGORIES: VotingCategory[] = [
  "hjemmelavet",
  "takeaway",
  "restaurant",
  "koekkentype",
  "hurtig",
];

interface LobbyProps {
  room: Room;
  participant: Participant;
  participants: Participant[];
  onRoomUpdate: (room: Room) => void;
  onParticipantsUpdate: (participants: Participant[]) => void;
}

export default function Lobby({
  room,
  participant,
  participants,
  onRoomUpdate,
}: LobbyProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<VotingCategory | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isHost = participant.is_host;
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${room.code}`
      : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select text
    }
  };

  const handleStartVoting = async () => {
    if (!selectedCategory) return;

    setIsStarting(true);
    try {
      const allOptions = await getFoodOptionsByCategory(selectedCategory);
      const selected = selectRandomOptions(allOptions);

      await setRoomFoodOptions(
        room.id,
        selected.map((o) => o.id)
      );
      await updateRoomStatus(room.id, "voting", selectedCategory);

      onRoomUpdate({ ...room, status: "voting", category: selectedCategory });
    } catch (e: any) {
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">🍕 Madrum</h1>
        <div className="mt-4 card">
          <p className="text-sm text-gray-500">Rumkode</p>
          <p className="text-4xl font-bold tracking-widest text-brand-600">
            {room.code}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleCopy}
              className="btn-secondary flex-1 text-sm"
            >
              {copied ? "✓ Kopieret!" : "📋 Kopiér link"}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400 break-all">{shareUrl}</p>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Deltagere ({participants.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <span
              key={p.id}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ${
                p.is_host
                  ? "bg-brand-100 text-brand-800"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {p.is_host && "👑 "}
              {p.nickname}
            </span>
          ))}
        </div>
        {participants.length < 2 && (
          <p className="mt-3 text-center text-sm text-gray-400">
            Del koden med din gruppe for at starte...
          </p>
        )}
      </div>

      {isHost && (
        <div className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Vælg kategori
          </h2>
          <div className="grid grid-cols-1 gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  selectedCategory === cat
                    ? "border-2 border-brand-500 bg-brand-100 text-brand-800"
                    : "border-2 border-transparent bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <span className="text-2xl">{CATEGORY_EMOJIS[cat]}</span>
                <span className="font-medium">{CATEGORY_LABELS[cat]}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleStartVoting}
            disabled={!selectedCategory || isStarting}
            className="btn-primary mt-4 w-full text-lg disabled:opacity-50"
          >
            {isStarting ? "Starter..." : "🚀 Start afstemning"}
          </button>
        </div>
      )}

      {!isHost && (
        <div className="card text-center">
          <p className="text-gray-500">
            Venter på at værten starter afstemningen...
          </p>
          <div className="mt-2 text-2xl animate-pulse">⏳</div>
        </div>
      )}
    </div>
  );
}
