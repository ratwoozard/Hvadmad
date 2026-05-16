"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Room, Participant } from "@/types/room";
import type { MatchResult } from "@/types/voting";
import { getVotesForRoom, getRoomFoodOptions, getParticipants } from "@/lib/supabase/queries";
import { calculateResults, getTopResults, hasAnyValidResult } from "@/lib/match/algorithm";
import { getMatchLevel, getMatchColor } from "@/lib/match/scoring";

interface ResultatProps {
  room: Room;
  participant: Participant;
}

export default function Resultat({ room, participant }: ResultatProps) {
  const [results, setResults] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [spinnerActive, setSpinnerActive] = useState(false);
  const [spinnerResult, setSpinnerResult] = useState<MatchResult | null>(null);

  useEffect(() => {
    async function loadResults() {
      const [votes, foodOptions, participants] = await Promise.all([
        getVotesForRoom(room.id),
        getRoomFoodOptions(room.id),
        getParticipants(room.id),
      ]);

      const calculated = calculateResults(votes, foodOptions, participants.length);
      const top = getTopResults(calculated, 5);
      setResults(top);
      setLoading(false);
    }
    loadResults();
  }, [room.id]);

  const handleSpin = () => {
    if (results.length === 0) return;
    setSpinnerActive(true);
    setSpinnerResult(null);

    let spins = 0;
    const maxSpins = 15;
    const interval = setInterval(() => {
      spins++;
      const randomIdx = Math.floor(Math.random() * results.length);
      setSpinnerResult(results[randomIdx]);

      if (spins >= maxSpins) {
        clearInterval(interval);
        const finalIdx = Math.floor(Math.random() * Math.min(3, results.length));
        setSpinnerResult(results[finalIdx]);
        setSpinnerActive(false);
      }
    }, 150 + spins * 20);
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce">📊</div>
          <p className="mt-2 text-gray-500">Beregner resultater...</p>
        </div>
      </div>
    );
  }

  if (!hasAnyValidResult(results.map((r) => ({ ...r, is_eliminated: false })))) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <div className="text-6xl">😅</div>
        <h2 className="text-2xl font-bold text-gray-900">Ingen matches!</h2>
        <p className="text-center text-gray-600">
          Gruppen kunne ikke blive enig om noget. Prøv en anden kategori!
        </p>
        <a href="/" className="btn-primary mt-4">
          🏠 Start forfra
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">🎉 Resultater</h1>
        <p className="mt-1 text-gray-600">Her er gruppens bedste matches</p>
      </div>

      <div className="flex flex-col gap-3">
        {results.map((result, index) => (
          <motion.div
            key={result.food_option_id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`card ${index === 0 ? "border-2 border-brand-500 shadow-md" : ""}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{result.emoji || "🍽️"}</span>
                  <h3 className="font-bold text-gray-900">{result.name}</h3>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-brand-500 transition-all"
                      style={{ width: `${result.match_percentage}%` }}
                    />
                  </div>
                  <span
                    className={`text-sm font-bold ${getMatchColor(getMatchLevel(result.match_percentage))}`}
                  >
                    {result.match_percentage}%
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {result.explanation}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="card text-center">
        <p className="mb-3 text-sm text-gray-500">Kan I ikke vælge?</p>
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
              {spinnerResult.emoji} {spinnerResult.name}
            </p>
          </motion.div>
        )}
      </div>

      <a href="/" className="btn-secondary w-full text-center">
        🏠 Start forfra
      </a>
    </div>
  );
}
