"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSessionId } from "@/lib/session";
import {
  getRoomByCode,
  joinRoom,
  getParticipantBySession,
} from "@/lib/supabase/queries";

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const kode = (params.kode as string).toUpperCase();

  const [nickname, setNickname] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkRoom() {
      const sessionId = getSessionId();
      const room = await getRoomByCode(kode);

      if (!room) {
        setError("Rummet findes ikke eller er udløbet. Tjek koden og prøv igen.");
        setChecking(false);
        return;
      }

      if (room.status !== "lobby") {
        setError("Afstemningen er allerede i gang. Du kan ikke joine nu.");
        setChecking(false);
        return;
      }

      const existing = await getParticipantBySession(room.id, sessionId);
      if (existing) {
        router.replace(`/rum/${room.code}`);
        return;
      }

      setChecking(false);
    }
    checkRoom();
  }, [kode, router]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (nickname.trim().length < 2) {
      setError("Nickname skal være mindst 2 tegn");
      return;
    }

    setIsJoining(true);
    setError("");

    try {
      const sessionId = getSessionId();
      const room = await getRoomByCode(kode);

      if (!room) {
        setError("Rummet findes ikke længere.");
        setIsJoining(false);
        return;
      }

      if (room.status !== "lobby") {
        setError("Afstemningen er allerede startet.");
        setIsJoining(false);
        return;
      }

      const { data: participantCount } = await (await import("@/lib/supabase/client")).supabase
        .from("participants")
        .select("id", { count: "exact", head: true })
        .eq("room_id", room.id);

      if (participantCount && (participantCount as any).count >= 20) {
        setError("Rummet er fuldt (maks 20 deltagere).");
        setIsJoining(false);
        return;
      }

      await joinRoom(room.id, sessionId, nickname.trim(), false);
      router.push(`/rum/${room.code}`);
    } catch (e: any) {
      setError(e.message || "Kunne ikke joine rummet. Prøv igen.");
      setIsJoining(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-bounce">🔍</div>
          <p className="mt-2 text-gray-500">Finder rum...</p>
        </div>
      </div>
    );
  }

  if (error && !nickname) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <div className="text-4xl">😕</div>
        <p className="text-center text-gray-600">{error}</p>
        <a href="/" className="btn-secondary">
          Gå til forsiden
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Join madrum</h1>
        <p className="mt-1 text-gray-600">
          Rumkode: <span className="font-bold text-brand-600">{kode}</span>
        </p>
      </div>

      <form onSubmit={handleJoin} className="card w-full">
        <label
          htmlFor="nickname"
          className="mb-2 block text-sm font-medium text-gray-700"
        >
          Vælg et nickname
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="F.eks. Maria"
          className="input-field"
          maxLength={20}
          autoFocus
          autoComplete="off"
        />

        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}

        <button
          type="submit"
          disabled={nickname.trim().length < 2 || isJoining}
          className="btn-primary mt-4 w-full text-lg disabled:opacity-50"
        >
          {isJoining ? "Joiner..." : "🎉 Join rum"}
        </button>
      </form>
    </div>
  );
}
