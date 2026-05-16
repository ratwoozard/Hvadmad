"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length >= 4) {
      router.push(`/join/${code}`);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">
          🍕 HvadMad
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Hvad skal vi spise? Stem sammen!
        </p>
      </div>

      <div className="flex w-full flex-col gap-4">
        <button
          onClick={() => router.push("/opret")}
          className="btn-primary w-full text-lg"
        >
          🎉 Opret madrum
        </button>

        {!showJoin ? (
          <button
            onClick={() => setShowJoin(true)}
            className="btn-secondary w-full text-lg"
          >
            🔗 Join et rum
          </button>
        ) : (
          <form onSubmit={handleJoin} className="card animate-slide-up">
            <label
              htmlFor="join-code"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Indtast rumkode
            </label>
            <div className="flex gap-2">
              <input
                id="join-code"
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="F.eks. ABCD5"
                className="input-field flex-1 text-center text-2xl uppercase tracking-widest"
                maxLength={6}
                autoFocus
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={joinCode.trim().length < 4}
                className="btn-primary disabled:opacity-50"
              >
                Gå
              </button>
            </div>
          </form>
        )}
      </div>

      <p className="text-center text-sm text-gray-400">
        Ingen login. Ingen data. Bare mad. 🍽️
      </p>

      <footer className="fixed bottom-4 left-0 right-0 text-center">
        <a
          href="https://www.WeGoDigital.dk"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur-sm px-4 py-1.5 text-xs text-gray-400 shadow-sm border border-gray-100 hover:text-brand-500 transition-colors"
        >
          <span className="font-medium">WeGoDigital</span>
        </a>
      </footer>
    </div>
  );
}
