"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateRoomCode } from "@/lib/room/codes";
import { getSessionId } from "@/lib/session";
import { createRoom, joinRoom } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { CharacterPicker } from "@/components/avatar/CharacterPicker";
import type { AvatarConfiguration } from "@/types/avatar";
import { EMPTY_CONFIG } from "@/lib/avatars/default";

export default function OpretPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [characterError, setCharacterError] = useState("");
  const [config, setConfig] = useState<AvatarConfiguration>(EMPTY_CONFIG);

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

  const finalize = async (chosen: AvatarConfiguration) => {
    setIsCreating(true);
    setError("");

    try {
      const sessionId = getSessionId();
      const code = generateRoomCode();

      const room = await createRoom(code, sessionId, nickname.trim());
      await joinRoom(room.id, sessionId, nickname.trim(), true, chosen);

      router.push(`/rum/${room.code}`);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Noget gik galt. Prøv igen.";
      setError(message);
      setIsCreating(false);
    }
  };

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
        <h1 className="text-2xl font-bold text-gray-900">Opret madrum</h1>
        <p className="mt-1 text-gray-600">
          Skriv dit nickname og vælg en karakter
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <Input
            id="nickname"
            label="Dit nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="F.eks. Christian"
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
              nickname.trim().length < 2 || !config.avatar_id || isCreating
            }
            loading={isCreating}
            size="lg"
            fullWidth
            className="mt-5"
          >
            {isCreating ? "Opretter..." : "Opret rum"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
