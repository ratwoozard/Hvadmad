"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateRoomCode } from "@/lib/room/codes";
import { getSessionId } from "@/lib/session";
import { createRoom, joinRoom } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

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
          Vælg et nickname, så opretter vi et rum til dig
        </p>
      </div>

      <Card>
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
      </Card>

      <Button
        onClick={handleCreate}
        disabled={nickname.trim().length < 2 || isCreating}
        loading={isCreating}
        size="lg"
        fullWidth
      >
        {isCreating ? "Opretter..." : "🎉 Opret rum"}
      </Button>
    </div>
  );
}
