"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSessionId } from "@/lib/session";
import { supabase } from "@/lib/supabase/client";
import { joinRoom, getParticipantBySession } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import { CharacterPicker } from "@/components/avatar/CharacterPicker";
import type { AvatarConfiguration } from "@/types/avatar";
import { EMPTY_CONFIG } from "@/lib/avatars/default";

export default function JoinPage() {
  const params = useParams();
  const router = useRouter();
  const kode = (params.kode as string).toUpperCase();

  const [nickname, setNickname] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);
  const [roomReady, setRoomReady] = useState(false);
  const [characterError, setCharacterError] = useState("");
  const [config, setConfig] = useState<AvatarConfiguration>(EMPTY_CONFIG);

  useEffect(() => {
    async function checkRoom() {
      const sessionId = getSessionId();

      const { data: rooms } = await supabase
        .from("rooms")
        .select()
        .eq("code", kode)
        .order("created_at", { ascending: false })
        .limit(1);

      const room = rooms && rooms.length > 0 ? rooms[0] : null;

      if (!room) {
        setError(
          "Rummet findes ikke eller er udløbet. Tjek koden og prøv igen.",
        );
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

      setRoomReady(true);
      setChecking(false);
    }
    checkRoom();
  }, [kode, router]);

  const finalize = async (chosen: AvatarConfiguration) => {
    setIsJoining(true);
    setError("");

    try {
      const sessionId = getSessionId();

      const { data: rooms } = await supabase
        .from("rooms")
        .select()
        .eq("code", kode)
        .order("created_at", { ascending: false })
        .limit(1);

      const room = rooms && rooms.length > 0 ? rooms[0] : null;

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

      await joinRoom(room.id, sessionId, nickname.trim(), false, chosen);
      router.push(`/rum/${room.code}`);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Kunne ikke joine rummet. Prøv igen.";
      setError(message);
      setIsJoining(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim().length < 2) {
      setError("Nickname skal være mindst 2 tegn");
      return;
    }
    if (!config.avatar_id) {
      setCharacterError("Vælg en karakter for at fortsætte");
      return;
    }
    setError("");
    setCharacterError("");
    void finalize(config);
  };

  if (checking) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-bounce">
            <Icon name="ui-search" size={48} />
          </div>
          <p className="mt-2 text-gray-500">Finder rum...</p>
        </div>
      </div>
    );
  }

  if (error && !roomReady) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-4">
        <div className="text-4xl">😕</div>
        <p className="text-center text-gray-600">{error}</p>
        <Button as="a" href="/" variant="secondary">
          Gå til forsiden
        </Button>
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

      <Card className="w-full">
        <form onSubmit={handleSubmit}>
          <Input
            id="nickname"
            label="Vælg et nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="F.eks. Maria"
            maxLength={20}
            autoFocus
            autoComplete="off"
            error={error || undefined}
          />

          <CharacterPicker
            selectedAvatarId={config.avatar_id}
            onChange={(avatarId) => {
              setConfig({ avatar_id: avatarId, hat_ids: [] });
              setCharacterError("");
            }}
            error={characterError || undefined}
          />

          <Button
            type="submit"
            disabled={
              nickname.trim().length < 2 || !config.avatar_id || isJoining
            }
            loading={isJoining}
            size="lg"
            fullWidth
            className="mt-4"
          >
            {isJoining ? "Joiner..." : "Join rum"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
