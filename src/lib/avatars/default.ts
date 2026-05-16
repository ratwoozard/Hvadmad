import type { AvatarConfiguration } from "@/types/avatar";
import { AVATARS } from "./catalog";

/**
 * Pick a random default avatar (with no hats) for users who skip the picker.
 *
 * Injectable RNG for tests.
 */
export function pickRandomDefault(
  random: () => number = Math.random,
): AvatarConfiguration {
  const idx = Math.floor(random() * AVATARS.length);
  const chosen = AVATARS[idx] ?? AVATARS[0];
  return { avatar_id: chosen.id, hat_ids: [] };
}

export const EMPTY_CONFIG: AvatarConfiguration = {
  avatar_id: null,
  hat_ids: [],
};
