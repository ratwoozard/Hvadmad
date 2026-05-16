import type { VotingCategory } from "./room";

export interface FoodOption {
  id: string;
  name: string;
  category: VotingCategory;
  description: string | null;
  emoji: string | null;
  tags: string[];
}

export interface RoomFoodOption {
  room_id: string;
  food_option_id: string;
  display_order: number;
  food_option?: FoodOption;
}
