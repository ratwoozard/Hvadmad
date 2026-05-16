"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Room, Participant, VotingCategory } from "@/types/room";
import { CATEGORY_LABELS, CATEGORY_EMOJIS } from "@/types/room";
import {
  updateRoomStatus,
  getFoodOptionsByCategory,
  setRoomFoodOptions,
} from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import { selectRandomOptions } from "@/lib/food/selection";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { cn, FOCUS_RING } from "@/components/ui/FocusRing";
import { fadeUp } from "@/lib/motion/variants";

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

const MODE_OPTION =
  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all";
const MODE_SELECTED = "border-2 border-brand-500 bg-brand-100 text-brand-800";
const MODE_IDLE =
  "border-2 border-transparent bg-gray-50 hover:bg-gray-100 active:bg-gray-200";

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

  const addCustomDish = () => setCustomDishes([...customDishes, ""]);
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
        await setRoomFoodOptions(
          room.id,
          selected.map((o) => o.id),
        );
        await updateRoomStatus(room.id, "voting", selectedCategory);
        onRoomUpdate({
          ...room,
          status: "voting",
          category: selectedCategory,
        });
      } else if (voteMode === "vote-category") {
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
          await setRoomFoodOptions(
            room.id,
            inserted.map((o: { id: string }) => o.id),
          );
        }
        await updateRoomStatus(room.id, "voting", "koekkentype");
        onRoomUpdate({ ...room, status: "voting", category: "koekkentype" });
      } else if (voteMode === "custom" && validCustomDishes.length >= 2) {
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
          await setRoomFoodOptions(
            room.id,
            inserted.map((o: { id: string }) => o.id),
          );
        }
        await updateRoomStatus(room.id, "voting", "hjemmelavet");
        onRoomUpdate({ ...room, status: "voting", category: "hjemmelavet" });
      }
    } catch {
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
        <Card className="mt-4">
          <p className="text-sm text-gray-500">Rumkode</p>
          <p className="text-4xl font-bold tracking-widest text-brand-600">
            {room.code}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              onClick={handleCopy}
              variant="secondary"
              size="sm"
              fullWidth
            >
              {copied ? "✓ Kopieret!" : "📋 Kopiér link"}
            </Button>
          </div>
          <p className="mt-2 break-all text-xs text-gray-400">{shareUrl}</p>
        </Card>
      </div>

      <Card>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Deltagere ({participants.length})
        </h2>
        <ul className="flex flex-wrap gap-2" aria-live="polite">
          <AnimatePresence initial={false}>
            {participants.map((p) => (
              <motion.li
                key={p.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium",
                  p.is_host
                    ? "bg-brand-100 text-brand-800"
                    : "bg-gray-100 text-gray-700",
                )}
              >
                {p.is_host && "👑 "}
                {p.nickname}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        {participants.length < 2 && (
          <p className="mt-3 text-center text-sm text-gray-400">
            Del koden med din gruppe for at starte...
          </p>
        )}
      </Card>

      {isHost && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Hvordan vil I stemme?
          </h2>

          <div className="mb-4 grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => {
                setVoteMode("category");
                setSelectedCategory(null);
              }}
              className={cn(
                MODE_OPTION,
                voteMode === "category" ? MODE_SELECTED : MODE_IDLE,
                FOCUS_RING,
              )}
            >
              <span className="text-xl">📋</span>
              <div>
                <span className="font-medium">Jeg vælger kategori</span>
                <p className="text-xs text-gray-500">
                  Du vælger, resten stemmer på retter
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVoteMode("vote-category")}
              className={cn(
                MODE_OPTION,
                voteMode === "vote-category" ? MODE_SELECTED : MODE_IDLE,
                FOCUS_RING,
              )}
            >
              <span className="text-xl">🗳️</span>
              <div>
                <span className="font-medium">Alle stemmer om kategori</span>
                <p className="text-xs text-gray-500">
                  Gruppen vælger kategori sammen
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setVoteMode("custom")}
              className={cn(
                MODE_OPTION,
                voteMode === "custom" ? MODE_SELECTED : MODE_IDLE,
                FOCUS_RING,
              )}
            >
              <span className="text-xl">✏️</span>
              <div>
                <span className="font-medium">Egne retter</span>
                <p className="text-xs text-gray-500">
                  Skriv dine egne forslag ind
                </p>
              </div>
            </button>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {voteMode === "category" && (
              <motion.div
                key="cat"
                variants={fadeUp}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <p className="mb-2 text-sm font-medium text-gray-600">
                  Vælg kategori:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        MODE_OPTION,
                        selectedCategory === cat ? MODE_SELECTED : MODE_IDLE,
                        FOCUS_RING,
                      )}
                    >
                      <span className="text-xl">{CATEGORY_EMOJIS[cat]}</span>
                      <span className="text-sm font-medium">
                        {CATEGORY_LABELS[cat]}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {voteMode === "vote-category" && (
              <motion.div
                key="vote-cat"
                variants={fadeUp}
                initial="initial"
                animate="animate"
                exit="exit"
                className="rounded-xl bg-blue-50 p-3 text-sm text-blue-700"
              >
                Alle deltagere stemmer på hvilken type mad I skal have.
                Kategorierne bliver vist som valgmuligheder.
              </motion.div>
            )}

            {voteMode === "custom" && (
              <motion.div
                key="custom"
                variants={fadeUp}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <p className="mb-2 text-sm font-medium text-gray-600">
                  Tilføj retter (mindst 2):
                </p>
                <div className="flex flex-col gap-2">
                  {customDishes.map((dish, index) => (
                    <div key={index} className="flex items-end gap-2">
                      <Input
                        value={dish}
                        onChange={(e) => updateCustomDish(index, e.target.value)}
                        placeholder={`Ret ${index + 1}, f.eks. "Pizza margherita"`}
                        maxLength={60}
                        hideLabel
                        label={`Ret ${index + 1}`}
                      />
                      {customDishes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          aria-label={`Fjern ret ${index + 1}`}
                          onClick={() => removeCustomDish(index)}
                          className="!min-w-0 px-3 text-red-400 hover:text-red-600"
                        >
                          ✕
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addCustomDish}
                    className="self-start"
                  >
                    + Tilføj endnu en ret
                  </Button>
                </div>
                {validCustomDishes.length > 0 && (
                  <p className="mt-2 text-xs text-gray-400">
                    {validCustomDishes.length} ret
                    {validCustomDishes.length !== 1 ? "ter" : ""} klar
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={handleStartVoting}
            disabled={!canStart || isStarting}
            loading={isStarting}
            size="lg"
            fullWidth
            className="mt-4"
          >
            {isStarting ? "Starter..." : "🚀 Start afstemning"}
          </Button>
        </Card>
      )}

      {!isHost && (
        <Card className="text-center">
          <p className="text-gray-500">
            Venter på at værten starter afstemningen...
          </p>
          <div className="mt-2 animate-pulse text-2xl">⏳</div>
        </Card>
      )}
    </div>
  );
}
