"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import type { FoodOption } from "@/types/food";
import type { VoteValue } from "@/types/voting";
import { VOTE_JA, VOTE_MAASKE, VOTE_NEJ } from "@/types/voting";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
  type VotingCategory,
} from "@/types/room";
import { getFoodOptionsByCategory } from "@/lib/supabase/queries";
import { selectRandomOptions } from "@/lib/food/selection";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { cn, FOCUS_RING } from "@/components/ui/FocusRing";
import { VoteCard, type VoteDirection } from "@/components/voting/VoteCard";
import { VoteProgress } from "@/components/voting/VoteProgress";
import { RandomWheel, type WheelOption } from "@/components/results/RandomWheel";
import { resultStagger, fadeUp } from "@/lib/motion/variants";
import { Avatar } from "@/components/avatar/Avatar";
import { CharacterPicker } from "@/components/avatar/CharacterPicker";
import type { AvatarConfiguration } from "@/types/avatar";
import { EMPTY_CONFIG } from "@/lib/avatars/default";

type Phase = "setup" | "voting" | "results";
type VoteMode = "category" | "vote-category" | "custom";

const CATEGORIES: VotingCategory[] = [
  "hjemmelavet",
  "takeaway",
  "restaurant",
  "koekkentype",
  "hurtig",
];

interface SoloResult {
  option: FoodOption;
  value: VoteValue;
}

function directionFor(value: VoteValue): VoteDirection {
  if (value === VOTE_JA) return "ja";
  if (value === VOTE_NEJ) return "nej";
  return "maaske";
}

const MODE_OPTION =
  "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all";
const MODE_SELECTED = "border-2 border-brand-500 bg-brand-100 text-brand-800";
const MODE_IDLE =
  "border-2 border-transparent bg-gray-50 hover:bg-gray-100 active:bg-gray-200";

export default function SoloPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("setup");

  const [voteMode, setVoteMode] = useState<VoteMode | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<VotingCategory | null>(null);
  const [customDishes, setCustomDishes] = useState<string[]>([""]);
  const [isStarting, setIsStarting] = useState(false);
  const [setupError, setSetupError] = useState("");

  const [options, setOptions] = useState<FoodOption[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, VoteValue>>({});
  const [exitDirection, setExitDirection] = useState<VoteDirection | null>(null);

  const [wheelOpen, setWheelOpen] = useState(false);
  const [avatarConfig, setAvatarConfig] =
    useState<AvatarConfiguration>(EMPTY_CONFIG);

  const addCustomDish = () => setCustomDishes([...customDishes, ""]);
  const updateCustomDish = (index: number, value: string) => {
    const updated = [...customDishes];
    updated[index] = value;
    setCustomDishes(updated);
  };
  const removeCustomDish = (index: number) =>
    setCustomDishes(customDishes.filter((_, i) => i !== index));

  const validCustomDishes = customDishes.filter((d) => d.trim().length > 0);

  const canStart =
    (voteMode === "category" && selectedCategory) ||
    voteMode === "vote-category" ||
    (voteMode === "custom" && validCustomDishes.length >= 2);

  const handleStart = async () => {
    setIsStarting(true);
    setSetupError("");

    try {
      let chosen: FoodOption[] = [];

      if (voteMode === "category" && selectedCategory) {
        const all = await getFoodOptionsByCategory(selectedCategory);
        chosen = selectRandomOptions(all);
      } else if (voteMode === "vote-category") {
        chosen = CATEGORIES.map((cat) => ({
          id: `cat-${cat}`,
          name: CATEGORY_LABELS[cat],
          category: cat,
          emoji: CATEGORY_EMOJIS[cat],
          description: `Lyst til ${CATEGORY_LABELS[cat].toLowerCase()}?`,
          tags: [],
        }));
      } else if (voteMode === "custom") {
        chosen = validCustomDishes.map((dish, i) => ({
          id: `custom-${i}`,
          name: dish.trim(),
          category: "hjemmelavet" as const,
          emoji: "🍽️",
          description: null,
          tags: ["custom"],
        }));
      }

      if (chosen.length === 0) {
        setSetupError("Kunne ikke hente nogen retter. Prøv en anden kategori.");
        setIsStarting(false);
        return;
      }

      setOptions(chosen);
      setCurrentIndex(0);
      setVotes({});
      setPhase("voting");
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Noget gik galt. Prøv igen.";
      setSetupError(message);
    } finally {
      setIsStarting(false);
    }
  };

  const handleVote = useCallback(
    (value: VoteValue) => {
      if (phase !== "voting" || currentIndex >= options.length) return;
      const option = options[currentIndex];
      setExitDirection(directionFor(value));
      setVotes((prev) => ({ ...prev, [option.id]: value }));

      window.setTimeout(() => {
        if (currentIndex + 1 >= options.length) {
          setPhase("results");
        } else {
          setCurrentIndex((prev) => prev + 1);
          setExitDirection(null);
        }
      }, 280);
    },
    [phase, currentIndex, options],
  );

  useEffect(() => {
    if (phase !== "voting") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
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
  }, [phase, handleVote]);

  const results: SoloResult[] = options
    .map((option) => ({ option, value: votes[option.id] }))
    .filter(
      (r): r is SoloResult => r.value !== undefined && r.value !== VOTE_NEJ,
    )
    .sort((a, b) => (b.value as number) - (a.value as number));

  const handleRestart = () => {
    setPhase("setup");
    setVoteMode(null);
    setSelectedCategory(null);
    setCustomDishes([""]);
    setOptions([]);
    setVotes({});
    setCurrentIndex(0);
    setExitDirection(null);
    setWheelOpen(false);
  };

  if (phase === "setup") {
    return (
      <div className="flex min-h-[80vh] flex-col gap-6">
        <Button
          onClick={() => router.back()}
          variant="ghost"
          size="sm"
          className="self-start"
        >
          ← Tilbage
        </Button>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">🧑 Solo</h1>
          <p className="mt-1 text-gray-600">
            Stem alene og find ud af hvad du har lyst til
          </p>
        </div>

        <Card>
          <CharacterPicker
            selectedAvatarId={avatarConfig.avatar_id}
            onChange={(avatarId) =>
              setAvatarConfig({ avatar_id: avatarId, hat_ids: [] })
            }
          />
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Hvad vil du stemme på?
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
                <span className="font-medium">Vælg en kategori</span>
                <p className="text-xs text-gray-500">
                  Stem på tilfældige retter fra en kategori
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
                <span className="font-medium">Stem om kategori</span>
                <p className="text-xs text-gray-500">
                  Find den type mad du har mest lyst til
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
                Du stemmer på hvilken type mad du har lyst til. Kategorierne
                vises som valgmuligheder.
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

          {setupError && (
            <p className="mt-3 text-center text-sm text-red-500">
              {setupError}
            </p>
          )}

          <Button
            onClick={handleStart}
            disabled={!canStart || isStarting}
            loading={isStarting}
            size="lg"
            fullWidth
            className="mt-4"
          >
            {isStarting ? "Starter..." : "🚀 Start afstemning"}
          </Button>
        </Card>

      </div>
    );
  }

  if (phase === "voting") {
    const currentOption = options[currentIndex];

    return (
      <div className="flex min-h-[80vh] flex-col justify-between gap-6 py-4">
        <div className="flex flex-col gap-2">
          {avatarConfig.avatar_id && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Avatar config={avatarConfig} size="sm" />
              <span>Du stemmer solo</span>
            </div>
          )}
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
            variant="vote-yes"
            size="lg"
            fullWidth
            aria-keyshortcuts="ArrowUp"
          >
            👍 Ja!
          </Button>
          <Button
            onClick={() => handleVote(VOTE_MAASKE)}
            variant="vote-maybe"
            size="lg"
            fullWidth
            aria-keyshortcuts="ArrowRight"
          >
            🤷 Måske
          </Button>
          <Button
            onClick={() => handleVote(VOTE_NEJ)}
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

  if (results.length === 0) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">😅</div>
        <h2 className="text-2xl font-bold text-gray-900">Ingen lyst?</h2>
        <p className="text-center text-gray-600">
          Du sagde nej til alt. Prøv en anden kategori!
        </p>
        <Button onClick={handleRestart} className="mt-4">
          🔁 Prøv igen
        </Button>
        <Button as="a" href="/" variant="secondary">
          <Icon name="nav-home" size={20} className="mr-2" /> Forsiden
        </Button>
      </div>
    );
  }

  const wheelOptions: WheelOption[] = results.slice(0, 3).map((r) => ({
    id: r.option.id,
    name: r.option.name,
    emoji: r.option.emoji,
  }));

  return (
    <div className="flex flex-col gap-6 py-4">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold text-gray-900">🎉 Dine valg</h1>
        <p className="mt-1 text-gray-600">
          Her er det du har lyst til – sorteret efter top
        </p>
      </motion.div>

      <motion.div
        variants={resultStagger}
        initial="initial"
        animate="animate"
        className="flex flex-col gap-3"
      >
        {results.map((r, index) => (
          <motion.div
            key={r.option.id}
            variants={fadeUp}
            className={
              index === 0
                ? "rounded-2xl border-2 border-brand-500 bg-white p-6 shadow-md"
                : "rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            }
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{r.option.emoji || "🍽️"}</span>
                  <h3 className="font-bold text-gray-900">{r.option.name}</h3>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {r.value === VOTE_JA ? "👍 Du sagde Ja!" : "🤷 Du sagde måske"}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <Card className="text-center">
        <p className="mb-3 text-sm text-gray-500">Kan du ikke vælge?</p>
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

      <div className="flex flex-col gap-2">
        <Button onClick={handleRestart} variant="secondary" fullWidth>
          🔁 Stem igen
        </Button>
        <Button as="a" href="/" variant="secondary" fullWidth>
          <Icon name="nav-home" size={20} className="mr-2" /> Forsiden
        </Button>
      </div>
    </div>
  );
}
