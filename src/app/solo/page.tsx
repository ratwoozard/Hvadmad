"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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

  const [spinnerActive, setSpinnerActive] = useState(false);
  const [spinnerResult, setSpinnerResult] = useState<SoloResult | null>(null);

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
    } catch (e: any) {
      setSetupError(e.message || "Noget gik galt. Prøv igen.");
    } finally {
      setIsStarting(false);
    }
  };

  const handleVote = (value: VoteValue) => {
    if (currentIndex >= options.length) return;
    const option = options[currentIndex];
    const next = { ...votes, [option.id]: value };
    setVotes(next);

    if (currentIndex + 1 >= options.length) {
      setPhase("results");
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const results: SoloResult[] = options
    .map((option) => ({ option, value: votes[option.id] }))
    .filter((r) => r.value !== undefined && r.value !== VOTE_NEJ)
    .sort((a, b) => (b.value as number) - (a.value as number));

  const handleSpin = () => {
    if (results.length === 0) return;
    setSpinnerActive(true);
    setSpinnerResult(null);

    let spins = 0;
    const maxSpins = 15;
    const tick = () => {
      spins++;
      const randomIdx = Math.floor(Math.random() * results.length);
      setSpinnerResult(results[randomIdx]);

      if (spins >= maxSpins) {
        const top = results.slice(0, Math.min(3, results.length));
        const finalIdx = Math.floor(Math.random() * top.length);
        setSpinnerResult(top[finalIdx]);
        setSpinnerActive(false);
        return;
      }
      setTimeout(tick, 150 + spins * 20);
    };
    setTimeout(tick, 150);
  };

  const handleRestart = () => {
    setPhase("setup");
    setVoteMode(null);
    setSelectedCategory(null);
    setCustomDishes([""]);
    setOptions([]);
    setVotes({});
    setCurrentIndex(0);
    setSpinnerResult(null);
  };

  if (phase === "setup") {
    return (
      <div className="flex min-h-[80vh] flex-col gap-6">
        <button
          onClick={() => router.back()}
          className="self-start text-sm text-gray-500 hover:text-gray-700"
        >
          ← Tilbage
        </button>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">🧑 Solo</h1>
          <p className="mt-1 text-gray-600">
            Stem alene og find ud af hvad du har lyst til
          </p>
        </div>

        <div className="card">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Hvad vil du stemme på?
          </h2>

          <div className="grid grid-cols-1 gap-2 mb-4">
            <button
              onClick={() => {
                setVoteMode("category");
                setSelectedCategory(null);
              }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                voteMode === "category"
                  ? "border-2 border-brand-500 bg-brand-100 text-brand-800"
                  : "border-2 border-transparent bg-gray-50 hover:bg-gray-100"
              }`}
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
              onClick={() => setVoteMode("vote-category")}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                voteMode === "vote-category"
                  ? "border-2 border-brand-500 bg-brand-100 text-brand-800"
                  : "border-2 border-transparent bg-gray-50 hover:bg-gray-100"
              }`}
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
                <p className="text-xs text-gray-500">
                  Skriv dine egne forslag ind
                </p>
              </div>
            </button>
          </div>

          {voteMode === "category" && (
            <div className="animate-fade-in">
              <p className="mb-2 text-sm font-medium text-gray-600">
                Vælg kategori:
              </p>
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
                    <span className="font-medium text-sm">
                      {CATEGORY_LABELS[cat]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {voteMode === "vote-category" && (
            <div className="animate-fade-in rounded-xl bg-blue-50 p-3 text-sm text-blue-700">
              Du stemmer på hvilken type mad du har lyst til. Kategorierne
              vises som valgmuligheder.
            </div>
          )}

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
                  {validCustomDishes.length} ret
                  {validCustomDishes.length !== 1 ? "ter" : ""} klar
                </p>
              )}
            </div>
          )}

          {setupError && (
            <p className="mt-3 text-center text-sm text-red-500">
              {setupError}
            </p>
          )}

          <button
            onClick={handleStart}
            disabled={!canStart || isStarting}
            className="btn-primary mt-4 w-full text-lg disabled:opacity-50"
          >
            {isStarting ? "Starter..." : "🚀 Start afstemning"}
          </button>
        </div>
      </div>
    );
  }

  if (phase === "voting") {
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
                  width: `${(currentIndex / options.length) * 100}%`,
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
            className="btn-vote-yes w-full"
          >
            👍 Ja!
          </button>
          <button
            onClick={() => handleVote(VOTE_MAASKE)}
            className="btn-vote-maybe w-full"
          >
            🤷 Måske
          </button>
          <button
            onClick={() => handleVote(VOTE_NEJ)}
            className="btn-vote-no w-full"
          >
            👎 Nej tak
          </button>
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
        <button onClick={handleRestart} className="btn-primary mt-4">
          🔁 Prøv igen
        </button>
        <a href="/" className="btn-secondary">
          🏠 Forsiden
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">🎉 Dine valg</h1>
        <p className="mt-1 text-gray-600">
          Her er det du har lyst til – sorteret efter top
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {results.map((r, index) => (
          <motion.div
            key={r.option.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`card ${
              index === 0 ? "border-2 border-brand-500 shadow-md" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
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
      </div>

      <div className="card text-center">
        <p className="mb-3 text-sm text-gray-500">Kan du ikke vælge?</p>
        <button
          onClick={handleSpin}
          disabled={spinnerActive}
          className="btn-primary w-full disabled:opacity-50"
        >
          {spinnerActive ? "🎰 Spinner..." : "🎲 Spin hjulet!"}
        </button>
        {spinnerResult && !spinnerActive && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mt-4 rounded-xl bg-brand-50 p-4"
          >
            <p className="text-sm text-gray-500">Vinderen er:</p>
            <p className="text-2xl font-bold text-brand-700">
              {spinnerResult.option.emoji} {spinnerResult.option.name}
            </p>
          </motion.div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button onClick={handleRestart} className="btn-secondary w-full">
          🔁 Stem igen
        </button>
        <a href="/" className="btn-secondary w-full text-center">
          🏠 Forsiden
        </a>
      </div>
    </div>
  );
}
