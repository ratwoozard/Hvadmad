import type { Avatar, AvatarConfiguration, Hat, Slot } from "@/types/avatar";
import { MAX_HATS } from "@/types/avatar";

export const AVATARS: readonly Avatar[] = [
  { id: "pizza", name: "Pizza", emoji: "🍕", altText: "Pizza-avatar" },
  { id: "burger", name: "Burger", emoji: "🍔", altText: "Burger-avatar" },
  { id: "taco", name: "Taco", emoji: "🌮", altText: "Taco-avatar" },
  { id: "sushi", name: "Sushi", emoji: "🍣", altText: "Sushi-avatar" },
  { id: "pasta", name: "Pasta", emoji: "🍝", altText: "Pasta-avatar" },
  { id: "salad", name: "Salat", emoji: "🥗", altText: "Salat-avatar" },
  { id: "sandwich", name: "Sandwich", emoji: "🥪", altText: "Sandwich-avatar" },
  { id: "ramen", name: "Ramen", emoji: "🍜", altText: "Ramen-avatar" },
  { id: "fox", name: "Ræv", emoji: "🦊", altText: "Ræve-avatar" },
  { id: "cat", name: "Kat", emoji: "🐱", altText: "Katte-avatar" },
  { id: "dog", name: "Hund", emoji: "🐶", altText: "Hunde-avatar" },
  { id: "panda", name: "Panda", emoji: "🐼", altText: "Panda-avatar" },
  { id: "bunny", name: "Kanin", emoji: "🐰", altText: "Kanin-avatar" },
  { id: "robot", name: "Robot", emoji: "🤖", altText: "Robot-avatar" },
  { id: "alien", name: "Alien", emoji: "👽", altText: "Alien-avatar" },
  { id: "dragon", name: "Drage", emoji: "🐉", altText: "Drage-avatar" },
];

export const HATS: readonly Hat[] = [
  // Head (hovedbeklædning)
  {
    id: "tophat",
    name: "Cylinderhat",
    emoji: "🎩",
    slot: "head",
    altText: "med cylinderhat",
    transform: "translate(0%, -55%) rotate(-8deg)",
  },
  {
    id: "crown",
    name: "Krone",
    emoji: "👑",
    slot: "head",
    altText: "med krone",
    transform: "translate(0%, -55%)",
  },
  {
    id: "cap",
    name: "Kasket",
    emoji: "🧢",
    slot: "head",
    altText: "med kasket",
    transform: "translate(0%, -55%) rotate(-10deg)",
  },
  {
    id: "chef",
    name: "Kokkehue",
    emoji: "👨‍🍳",
    slot: "head",
    altText: "med kokkehue",
    transform: "translate(0%, -60%)",
  },
  {
    id: "graduation",
    name: "Studenterhue",
    emoji: "🎓",
    slot: "head",
    altText: "med studenterhue",
    transform: "translate(0%, -55%)",
  },
  {
    id: "cowboy",
    name: "Cowboyhat",
    emoji: "🤠",
    slot: "head",
    altText: "med cowboyhat",
    transform: "translate(0%, -55%)",
  },
  // Eyes (briller)
  {
    id: "glasses",
    name: "Briller",
    emoji: "👓",
    slot: "eyes",
    altText: "med briller",
    transform: "translate(0%, -10%)",
  },
  {
    id: "sunglasses",
    name: "Solbriller",
    emoji: "🕶️",
    slot: "eyes",
    altText: "med solbriller",
    transform: "translate(0%, -10%)",
  },
  {
    id: "monocle",
    name: "Monokel",
    emoji: "🧐",
    slot: "eyes",
    altText: "med monokel",
    transform: "translate(0%, -10%)",
  },
  // Mouth (mund/ansigt)
  {
    id: "pipe",
    name: "Pibe",
    emoji: "🚬",
    slot: "mouth",
    altText: "med pibe",
    transform: "translate(40%, 25%) rotate(20deg)",
  },
  {
    id: "lipstick",
    name: "Læbestift",
    emoji: "💋",
    slot: "mouth",
    altText: "med læbestift",
    transform: "translate(0%, 30%)",
  },
  {
    id: "moustache",
    name: "Overskæg",
    emoji: "👨",
    slot: "mouth",
    altText: "med overskæg",
    transform: "translate(0%, 25%) scaleY(0.5)",
  },
  // Neck (halsudstyr)
  {
    id: "bow",
    name: "Butterfly",
    emoji: "🎀",
    slot: "neck",
    altText: "med butterfly",
    transform: "translate(0%, 55%)",
  },
  {
    id: "scarf",
    name: "Halstørklæde",
    emoji: "🧣",
    slot: "neck",
    altText: "med halstørklæde",
    transform: "translate(0%, 55%)",
  },
  {
    id: "tie",
    name: "Slips",
    emoji: "👔",
    slot: "neck",
    altText: "med slips",
    transform: "translate(0%, 65%)",
  },
  {
    id: "necklace",
    name: "Halskæde",
    emoji: "📿",
    slot: "neck",
    altText: "med halskæde",
    transform: "translate(0%, 55%)",
  },
];

export const SLOT_LABELS: Record<Slot, string> = {
  head: "Hovedbeklædning",
  eyes: "Briller",
  mouth: "Mund",
  neck: "Hals",
};

// ---------- Lookups ----------

const AVATAR_INDEX = new Map<string, Avatar>(AVATARS.map((a) => [a.id, a]));
const HAT_INDEX = new Map<string, Hat>(HATS.map((h) => [h.id, h]));

export function getAvatar(id: string | null | undefined): Avatar | null {
  if (!id) return null;
  return AVATAR_INDEX.get(id) ?? null;
}

export function getHat(id: string): Hat | null {
  return HAT_INDEX.get(id) ?? null;
}

export function getHats(ids: readonly string[]): Hat[] {
  return ids.map((id) => HAT_INDEX.get(id)).filter((h): h is Hat => h != null);
}

export function getHatsForSlot(slot: Slot): Hat[] {
  return HATS.filter((h) => h.slot === slot);
}

// ---------- Validation helpers ----------

export interface AddHatResult {
  next: string[];
  /** True if the new hat replaced an existing one in the same slot. */
  replacedSlot: boolean;
  /** True if max-hats reached and the operation was rejected. */
  rejectedMaxHats: boolean;
}

/**
 * Add a hat to a configuration. If another hat already occupies the same slot
 * it is replaced (slot-conflict resolution). Returns the new id list unchanged
 * (with `rejectedMaxHats: true`) if max-hats would be exceeded.
 */
export function addHat(
  currentIds: readonly string[],
  newHatId: string,
): AddHatResult {
  const hat = getHat(newHatId);
  if (!hat) {
    return { next: [...currentIds], replacedSlot: false, rejectedMaxHats: false };
  }

  // Toggle off if already present
  if (currentIds.includes(newHatId)) {
    return {
      next: currentIds.filter((id) => id !== newHatId),
      replacedSlot: false,
      rejectedMaxHats: false,
    };
  }

  const withoutSlotConflict = currentIds.filter((id) => {
    const existing = getHat(id);
    return existing && existing.slot !== hat.slot;
  });
  const replacedSlot = withoutSlotConflict.length < currentIds.length;

  if (!replacedSlot && currentIds.length >= MAX_HATS) {
    return { next: [...currentIds], replacedSlot: false, rejectedMaxHats: true };
  }

  return {
    next: [...withoutSlotConflict, newHatId],
    replacedSlot,
    rejectedMaxHats: false,
  };
}

export function removeHat(
  currentIds: readonly string[],
  hatId: string,
): string[] {
  return currentIds.filter((id) => id !== hatId);
}

/**
 * Returns true if the configuration is valid: no more than MAX_HATS hats and
 * no two hats in the same slot.
 */
export function isValidConfig(config: AvatarConfiguration): boolean {
  if (config.hat_ids.length > MAX_HATS) return false;
  const seenSlots = new Set<Slot>();
  for (const id of config.hat_ids) {
    const hat = getHat(id);
    if (!hat) return false;
    if (seenSlots.has(hat.slot)) return false;
    seenSlots.add(hat.slot);
  }
  return true;
}
