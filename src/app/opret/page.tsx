"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateRoomCode } from "@/lib/room/codes";
import { getSessionId } from "@/lib/session";
import { createRoom, joinRoom } from "@/lib/supabase/queries";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { AvatarPicker } from "@/components/avatar/AvatarPicker";
import { Avatar } from "@/components/avatar/Avatar";
import type { AvatarConfiguration } from "@/types/avatar";
import { EMPTY_CONFIG, pickRandomDefault } from "@/lib/avatars/default";

export default function OpretPage() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [config, setConfig] = useState<AvatarConfiguration>(EMPTY_CONFIG);

  const handleOpenPicker = () => {
    if (nickname.trim().length < 2) {
      setError("Nickname skal være mindst 2 tegn");
      return;
    }
    setError("");
    setPickerOpen(true);
  };

  const finalize = async (chosen: AvatarConfiguration) => {
    setIsCreating(true);
    setError("");

    try {
      const sessionId = getSessionId();
      const code = generateRoomCode();
      const finalConfig = chosen.avatar_id ? chosen : pickRandomDefault();

      const room = await createRoom(code, sessionId, nickname.trim());
      await joinRoom(room.id, sessionId, nickname.trim(), true, finalConfig);

      router.push(`/rum/${room.code}`);
    } catch (e: unknown) {
      const message =
        e instanceof Error ? e.message : "Noget gik galt. Prøv igen.";
      setError(message);
      setIsCreating(false);
    }
  };

  const handleSave = (chosen: AvatarConfiguration) => {
    setConfig(chosen);
    setPickerOpen(false);
    void finalize(chosen);
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

        {config.avatar_id && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-brand-50 p-3">
            <Avatar config={config} size="md" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Din avatar er klar</p>
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="text-xs text-brand-600 underline-offset-2 hover:underline"
              >
                Skift avatar
              </button>
            </div>
          </div>
        )}
      </Card>

      <Button
        onClick={handleOpenPicker}
        disabled={nickname.trim().length < 2 || isCreating}
        loading={isCreating}
        size="lg"
        fullWidth
      >
        {isCreating ? "Opretter..." : "🎨 Vælg avatar & opret rum"}
      </Button>

      <AvatarPicker
        open={pickerOpen}
        initialConfig={config}
        onSave={handleSave}
        onCancel={() => setPickerOpen(false)}
        saveLabel="Opret rum"
      />
    </div>
  );
}
