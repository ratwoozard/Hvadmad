"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateRoomCode } from "@/lib/room/codes";
import { getSessionId } from "@/lib/session";
import { createRoom, joinRoom } from "@/lib/supabase/queries";
import {
  CATEGORY_LABELS,
  CATEGORY_EMOJIS,
  type VotingCategory,
} from "@/types/room";

const CATEGORIES: VotingCategory[] = [
  "hjemmelavet",
  "takeaway",
  "restaurant",
  "koekkentype",
  "hurtig",
];

export default function OpretPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (nickname.trim().length < 2) {
      setError("Nickname skal være mindst 2 tegn");
      return;
    }

    setIsCreating(true);
    setError("");

    try {
      const sessionId = getSessionId();
      const code = generateRoomCode();

      const room = await createRoom(code, sessionId, nickname.trim());
      await joinRoom(room.id, sessionId, nickname.trim(), true);

      router.push(`/rum/${room.code}`);
    } catch (e: any) {
      setError(e.message || "Noget gik galt. Prøv igen.");
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col gap-6">
      <button
        onClick={() => router.back()}
        className="self-start text-sm text-gray-500 hover:text-gray-700"
      >
        ← Tilbage
      </button>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Opret madrum</h1>
        <p className="mt-1 text-gray-600">
          Vælg et nickname, så opretter vi et rum til dig
        </p>
      </div>

      <div className="card">
        <label
          htmlFor="nickname"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Dit nickname
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="F.eks. Christian"
          className="input-field"
          maxLength={20}
          autoFocus
          autoComplete="off"
        />
      </div>

      {error && (
        <p className="text-center text-sm text-red-500">{error}</p>
      )}

      <button
        onClick={handleCreate}
        disabled={nickname.trim().length < 2 || isCreating}
        className="btn-primary w-full text-lg disabled:opacity-50"
      >
        {isCreating ? "Opretter..." : "🎉 Opret rum"}
      </button>
    </div>
  );
}
