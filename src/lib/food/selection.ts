import type { FoodOption } from "@/types/food";

const OPTIONS_PER_SESSION = 12;

export function selectRandomOptions(
  allOptions: FoodOption[],
  count: number = OPTIONS_PER_SESSION
): FoodOption[] {
  const shuffled = [...allOptions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, allOptions.length));
}
