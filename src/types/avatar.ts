export type Slot = "head" | "eyes" | "mouth" | "neck";

export interface Avatar {
  id: string;
  name: string;
  emoji: string;
  altText: string;
}

export interface Hat {
  id: string;
  name: string;
  emoji: string;
  slot: Slot;
  altText: string;
  /** Optional CSS transform applied to the emoji to better position it on the avatar. */
  transform?: string;
}

export interface AvatarConfiguration {
  avatar_id: string | null;
  hat_ids: string[];
}

export const MAX_HATS = 3;
