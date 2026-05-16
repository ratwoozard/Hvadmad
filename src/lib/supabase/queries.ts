import { supabase } from "./client";
import type { Room, Participant, RoomStatus, VotingCategory } from "@/types/room";
import type { Vote, VoteValue } from "@/types/voting";
import type { FoodOption } from "@/types/food";

export async function createRoom(
  code: string,
  hostSessionId: string,
  hostNickname: string
): Promise<Room> {
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      code,
      host_session_id: hostSessionId,
      host_nickname: hostNickname,
    })
    .select()
    .single();

  if (error) throw new Error(`Kunne ikke oprette rum: ${error.message}`);
  return data;
}

export async function getRoomByCode(code: string): Promise<Room | null> {
  const { data, error } = await supabase
    .from("rooms")
    .select()
    .eq("code", code.toUpperCase())
    .neq("status", "results")
    .single();

  if (error) return null;
  return data;
}

export async function updateRoomStatus(
  roomId: string,
  status: RoomStatus,
  category?: VotingCategory
): Promise<void> {
  const update: Record<string, unknown> = {
    status,
    last_activity: new Date().toISOString(),
  };
  if (category) update.category = category;

  const { error } = await supabase
    .from("rooms")
    .update(update)
    .eq("id", roomId);

  if (error) throw new Error(`Kunne ikke opdatere rum: ${error.message}`);
}

export async function joinRoom(
  roomId: string,
  sessionId: string,
  nickname: string,
  isHost: boolean = false
): Promise<Participant> {
  const { data, error } = await supabase
    .from("participants")
    .insert({
      room_id: roomId,
      session_id: sessionId,
      nickname,
      is_host: isHost,
    })
    .select()
    .single();

  if (error) throw new Error(`Kunne ikke joine rum: ${error.message}`);
  return data;
}

export async function getParticipants(roomId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from("participants")
    .select()
    .eq("room_id", roomId)
    .order("joined_at", { ascending: true });

  if (error) throw new Error(`Kunne ikke hente deltagere: ${error.message}`);
  return data;
}

export async function updateParticipantVoted(
  participantId: string
): Promise<void> {
  const { error } = await supabase
    .from("participants")
    .update({ has_voted: true, status: "done" })
    .eq("id", participantId);

  if (error) throw new Error(`Kunne ikke opdatere status: ${error.message}`);
}

export async function getFoodOptionsByCategory(
  category: VotingCategory
): Promise<FoodOption[]> {
  const { data, error } = await supabase
    .from("food_options")
    .select()
    .eq("category", category);

  if (error) throw new Error(`Kunne ikke hente madmuligheder: ${error.message}`);
  return data;
}

export async function setRoomFoodOptions(
  roomId: string,
  foodOptionIds: string[]
): Promise<void> {
  const rows = foodOptionIds.map((id, index) => ({
    room_id: roomId,
    food_option_id: id,
    display_order: index,
  }));

  const { error } = await supabase.from("room_food_options").insert(rows);

  if (error)
    throw new Error(`Kunne ikke sætte madmuligheder: ${error.message}`);
}

export async function getRoomFoodOptions(
  roomId: string
): Promise<FoodOption[]> {
  const { data, error } = await supabase
    .from("room_food_options")
    .select("display_order, food_option:food_options(*)")
    .eq("room_id", roomId)
    .order("display_order", { ascending: true });

  if (error)
    throw new Error(`Kunne ikke hente rummets madmuligheder: ${error.message}`);

  return data.map((row: any) => row.food_option);
}

export async function submitVote(
  roomId: string,
  participantId: string,
  foodOptionId: string,
  value: VoteValue
): Promise<void> {
  const { error } = await supabase.from("votes").insert({
    room_id: roomId,
    participant_id: participantId,
    food_option_id: foodOptionId,
    value,
  });

  if (error) throw new Error(`Kunne ikke registrere stemme: ${error.message}`);
}

export async function getVotesForRoom(roomId: string): Promise<Vote[]> {
  const { data, error } = await supabase
    .from("votes")
    .select()
    .eq("room_id", roomId);

  if (error) throw new Error(`Kunne ikke hente stemmer: ${error.message}`);
  return data;
}

export async function getParticipantBySession(
  roomId: string,
  sessionId: string
): Promise<Participant | null> {
  const { data, error } = await supabase
    .from("participants")
    .select()
    .eq("room_id", roomId)
    .eq("session_id", sessionId)
    .single();

  if (error) return null;
  return data;
}
