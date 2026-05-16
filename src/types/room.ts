export type RoomStatus = "lobby" | "voting" | "calculating" | "results";

export type ParticipantStatus =
  | "active"
  | "voting"
  | "done"
  | "inactive"
  | "disconnected";

export type VotingCategory =
  | "hjemmelavet"
  | "takeaway"
  | "restaurant"
  | "koekkentype"
  | "hurtig";

export interface Room {
  id: string;
  code: string;
  status: RoomStatus;
  category: VotingCategory | null;
  host_session_id: string;
  host_nickname: string;
  created_at: string;
  last_activity: string;
  expires_at: string;
}

export interface Participant {
  id: string;
  room_id: string;
  session_id: string;
  nickname: string;
  is_host: boolean;
  status: ParticipantStatus;
  joined_at: string;
  last_seen: string;
  has_voted: boolean;
  avatar_id: string | null;
  hat_ids: string[];
}

export interface RoomWithParticipants extends Room {
  participants: Participant[];
}

export const CATEGORY_LABELS: Record<VotingCategory, string> = {
  hjemmelavet: "Hjemmelavet mad",
  takeaway: "Take-away",
  restaurant: "Restaurant",
  koekkentype: "Køkkentype",
  hurtig: "Hurtig aftensmad",
};

export const CATEGORY_EMOJIS: Record<VotingCategory, string> = {
  hjemmelavet: "🍳",
  takeaway: "🥡",
  restaurant: "🍽️",
  koekkentype: "🌍",
  hurtig: "⚡",
};
