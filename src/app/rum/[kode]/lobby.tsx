"use client";

import { useState } from "react";
import type { Room, Participant, VotingCategory } from "@/types/room";
import { CATEGORY_LABELS, CATEGORY_EMOJIS } from "@/types/room";
import {
  updateRoomStatus,
  getFoodOptionsByCategory,
  setRoomFoodOptions,
} from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import { selectRandomOptions } from "@/lib/food/selection";
import { getSessionId } from "@/lib/session";

const CATEGORIES: VotingCategory[] = [
  "hjemmelavet",
  "takeaway",
  "restaurant",
  "koekkentype",
  "hurtig",
];

type VoteMode = "category" | "vote-category" | "custom";

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
  const [voteMode, setVoteMode] = useState<VoteMode | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<VotingCategory | null>(null);
  const [customDishes, setCustomDishes] = useState<string[]>([""]);
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
    } catch {}
  };

  const addCustomDish = () => {
    setCustomDishes([...customDishes, ""]);
  };

  const updateCustomDish = (index: number, value: string) => {
    const updated = [...customDishes];
    updated[index] = value;
    setCustomDishes(updated);
  };

  const removeCustomDish = (index: number) => {
    setCustomDishes(customDishes.filter((_, i) => i !== index));
  };

  const validCustomDishes = customDishes.filter((d) => d.trim().length > 0);

  const handleStartVoting = async () => {
    setIsStarting(true);

    try {
      if (voteMode === "category" && selectedCategory) {
        const allOptions = await getFoodOptionsByCategory(selectedCategory);
        const selected = selectRandomOptions(allOptions);
        await setRoomFoodOptions(room.id, selected.map((o) => o.id));
        await updateRoomStatus(room.id, "voting", selectedCategory);
        onRoomUpdate({ ...room, status: "voting", category: selectedCategory });
      } else if (voteMode === "vote-category") {
        // Insert the categories as temporary food options for this room
        const categoryOptions = CATEGORIES.map((cat) => ({
          name: CATEGORY_LABELS[cat],
          category: cat,
          emoji: CATEGORY_EMOJIS[cat],
          description: `Stem på ${CATEGORY_LABELS[cat].toLowerCase()}`,
          tags: [],
        }));

        const { data: inserted } = await supabase
          .from("food_options")
          .insert(categoryOptions)
          .select();

        if (inserted) {
          await setRoomFoodOptions(room.id, inserted.map((o: any) => o.id));
        }
        await updateRoomStatus(room.id, "voting", "koekkentype");
        onRoomUpdate({ ...room, status: "voting", category: "koekkentype" });
      } else if (voteMode === "custom" && validCustomDishes.length >= 2) {
        // Insert custom dishes as food options
        const customOptions = validCustomDishes.map((dish) => ({
          name: dish.trim(),
          category: "hjemmelavet" as const,
          emoji: "🍽️",
          description: null,
          tags: ["custom"],
        }));

        const { data: inserted } = await supabase
          .from("food_options")
          .insert(customOptions)
          .select();

        if (inserted) {
          await setRoomFoodOptions(room.id, inserted.map((o: any) => o.id));
        }
        await updateRoomStatus(room.id, "voting", "hjemmelavet");
        onRoomUpdate({ ...room, status: "voting", category: "hjemmelavet" });
      }
    } catch (e: any) {
      setIsStarting(false);
    }
  };

  const canStart =
    (voteMode === "category" && selectedCategory) ||
    voteMode === "vote-category" ||
    (voteMode === "custom" && validCustomDishes.length >= 2);

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
            Hvordan vil I stemme?
          </h2>

          {/* Mode selection */}
          <div className="grid grid-cols-1 gap-2 mb-4">
            <button
              onClick={() => { setVoteMode("category"); setSelectedCategory(null); }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                voteMode === "category"
                  ? "border-2 border-brand-500 bg-brand-100 text-brand-800"
                  : "border-2 border-transparent bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <span className="text-xl">📋</span>
              <div>
                <span className="font-medium">Jeg vælger kategori</span>
                <p className="text-xs text-gray-500">Du vælger, resten stemmer på retter</p>
              </div>
            </button>

            <button
              onClick={() => setVoteMode("vote-category")}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                voteMode === "vote-category"
                  ? "border-2 border-brand-500 bg-brand-100 text-brand-800"
                  : "border-2 border-transparent bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <span className="text-xl">🗳️</span>
              <div>
                <span className="font-medium">Alle stemmer om kategori</span>
                <p className="text-xs text-gray-500">Gruppen vælger kategori sammen</p>
              </div>
            </button>

            <button
              onClick={() => setVoteMode("custom")}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                voteMode === "custom"
                  ? "border-2 border-brand-500 bg-brand-100 text-brand-800"
                  : "border-2 border-transparent bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <span className="text-xl">✏️</span>
              <div>
                <span className="font-medium">Egne retter</span>
                <p className="text-xs text-gray-500">Skriv dine egne forslag ind</p>
              </div>
            </button>
          </div>

          {/* Category picker */}
          {voteMode === "category" && (
            <div className="animate-fade-in">
              <p className="mb-2 text-sm font-medium text-gray-600">Vælg kategori:</p>
              <div className="grid grid-cols-1 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                      selectedCategory === cat
                        ? "border-2 border-brand-500 bg-brand-50"
                        : "border-2 border-transparent bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">{CATEGORY_EMOJIS[cat]}</span>
                    <span className="font-medium text-sm">{CATEGORY_LABELS[cat]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Vote on category info */}
          {voteMode === "vote-category" && (
            <div className="animate-fade-in rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
              Alle deltagere stemmer på hvilken type mad I skal have. Kategorierne bliver vist som valgmuligheder.
            </div>
          )}

          {/* Custom dishes input */}
          {voteMode === "custom" && (
            <div className="animate-fade-in">
              <p className="mb-2 text-sm font-medium text-gray-600">
                Tilføj retter (mindst 2):
              </p>
              <div className="flex flex-col gap-2">
                {customDishes.map((dish, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={dish}
                      onChange={(e) => updateCustomDish(index, e.target.value)}
                      placeholder={`Ret ${index + 1}, f.eks. "Pizza margherita"`}
                      className="input-field flex-1 text-sm py-2"
                      maxLength={60}
                    />
                    {customDishes.length > 1 && (
                      <button
                        onClick={() => removeCustomDish(index)}
                        className="px-3 text-red-400 hover:text-red-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={addCustomDish}
                  className="mt-1 text-sm text-brand-600 hover:text-brand-700 font-medium"
                >
                  + Tilføj endnu en ret
                </button>
              </div>
              {validCustomDishes.length > 0 && (
                <p className="mt-2 text-xs text-gray-400">
                  {validCustomDishes.length} ret{validCustomDishes.length !== 1 ? "ter" : ""} klar
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleStartVoting}
            disabled={!canStart || isStarting}
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
