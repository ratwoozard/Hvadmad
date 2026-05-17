/**
 * Mademoji-katalog til ventespillet "Madmoji-tumult".
 *
 * Hver post er en stand-alone unicode emoji så vi ikke skal hente billeder
 * for at køre kampen. Holdt adskilt fra deltagernes karakter-avatar
 * (`src/lib/avatars/catalog.ts`) fordi spillet er en lokal "hyggekamp"
 * og må ikke afhænge af, hvad spilleren har valgt som sin avatar.
 */

export interface Madmoji {
  /** Stable id (engelsk navn, kebab-case). */
  readonly id: string;
  /** Den faktiske emoji der vises. */
  readonly emoji: string;
  /** Dansk navn til a11y/announcements ("Du er en pizza!"). */
  readonly name: string;
}

export const MADEMOJIS: readonly Madmoji[] = [
  { id: "pizza", emoji: "🍕", name: "pizza" },
  { id: "burger", emoji: "🍔", name: "burger" },
  { id: "hotdog", emoji: "🌭", name: "hotdog" },
  { id: "taco", emoji: "🌮", name: "taco" },
  { id: "burrito", emoji: "🌯", name: "burrito" },
  { id: "sushi", emoji: "🍣", name: "sushi" },
  { id: "ramen", emoji: "🍜", name: "ramen" },
  { id: "dumpling", emoji: "🥟", name: "dumpling" },
  { id: "rice", emoji: "🍚", name: "ris" },
  { id: "curry", emoji: "🍛", name: "karry" },
  { id: "spaghetti", emoji: "🍝", name: "spaghetti" },
  { id: "fries", emoji: "🍟", name: "pommes" },
  { id: "popcorn", emoji: "🍿", name: "popcorn" },
  { id: "donut", emoji: "🍩", name: "donut" },
  { id: "cookie", emoji: "🍪", name: "cookie" },
  { id: "cake", emoji: "🍰", name: "kage" },
  { id: "icecream", emoji: "🍨", name: "is" },
  { id: "chocolate", emoji: "🍫", name: "chokolade" },
  { id: "croissant", emoji: "🥐", name: "croissant" },
  { id: "pretzel", emoji: "🥨", name: "kringle" },
  { id: "pancakes", emoji: "🥞", name: "pandekager" },
  { id: "egg", emoji: "🍳", name: "spejlæg" },
  { id: "bacon", emoji: "🥓", name: "bacon" },
  { id: "chicken", emoji: "🍗", name: "kyllingelår" },
  { id: "shrimp", emoji: "🍤", name: "tigerrejer" },
  { id: "salad", emoji: "🥗", name: "salat" },
  { id: "sandwich", emoji: "🥪", name: "sandwich" },
  { id: "avocado", emoji: "🥑", name: "avocado" },
  { id: "cheese", emoji: "🧀", name: "ost" },
  { id: "strawberry", emoji: "🍓", name: "jordbær" },
];

export function pickRandomMademoji(
  random: () => number = Math.random,
): Madmoji {
  const idx = Math.floor(random() * MADEMOJIS.length);
  return MADEMOJIS[idx] ?? MADEMOJIS[0];
}

/**
 * Trækker `count` unikke mademojis. Hvis `count` er større end katalogets
 * størrelse falder vi tilbage til simpel sampling med gentagelser.
 */
export function pickUniqueMademojis(
  count: number,
  random: () => number = Math.random,
): Madmoji[] {
  if (count <= 0) return [];
  if (count >= MADEMOJIS.length) {
    return [...MADEMOJIS];
  }
  const pool = [...MADEMOJIS];
  const out: Madmoji[] = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(random() * pool.length);
    out.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return out;
}
