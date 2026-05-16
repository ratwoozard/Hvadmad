"use client";

import { AVATARS } from "@/lib/avatars/catalog";
import { FOCUS_RING, cn } from "@/components/ui/FocusRing";
import { Avatar } from "./Avatar";

interface CharacterPickerProps {
  selectedAvatarId: string | null;
  onChange: (avatarId: string) => void;
  error?: string;
}

export function CharacterPicker({
  selectedAvatarId,
  onChange,
  error,
}: CharacterPickerProps) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-medium text-gray-700">
        Vælg en karakter
      </legend>
      <p className="mt-1 text-sm text-gray-500">
        Den vises sammen med dig i lobbyen, afstemningen og resultatet.
      </p>

      <div
        role="radiogroup"
        aria-label="Vælg en karakter"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? "character-picker-error" : undefined}
        className="mt-3 grid grid-cols-4 gap-2 sm:gap-3"
      >
        {AVATARS.map((avatar) => {
          const selected = selectedAvatarId === avatar.id;
          return (
            <button
              key={avatar.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={avatar.altText}
              onClick={() => onChange(avatar.id)}
              className={cn(
                "flex aspect-square min-h-16 items-center justify-center rounded-2xl border-2 bg-white p-1.5 transition-all hover:bg-gray-50 active:scale-95",
                selected
                  ? "border-brand-500 bg-brand-50 shadow-sm"
                  : "border-gray-100",
                FOCUS_RING,
              )}
            >
              <Avatar
                config={{ avatar_id: avatar.id, hat_ids: [] }}
                size="md"
                className="bg-transparent"
              />
            </button>
          );
        })}
      </div>

      {error && (
        <p id="character-picker-error" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </fieldset>
  );
}
