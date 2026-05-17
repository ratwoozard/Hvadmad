import { supabase } from "./client";
import type {
  Room,
  Participant,
  ParticipantPick,
  RoomStatus,
  VotingCategory,
} from "@/types/room";
import type { Vote, VoteValue } from "@/types/voting";
import type { FoodOption } from "@/types/food";
import type { AvatarConfiguration } from "@/types/avatar";

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

function isMissingAvatarSchemaError(error: SupabaseErrorLike): boolean {
  const message = error.message?.toLowerCase() ?? "";
  return (
    error.code === "PGRST204" &&
    (message.includes("avatar_id") || message.includes("hat_ids"))
  );
}

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
    .in("status", ["lobby", "voting", "calculating"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) return null;
  return data[0];
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
  isHost: boolean = false,
  avatar: AvatarConfiguration | null = null,
): Promise<Participant> {
  const baseInsertRow: Record<string, unknown> = {
    room_id: roomId,
    session_id: sessionId,
    nickname,
    is_host: isHost,
  };
  const insertRow: Record<string, unknown> = { ...baseInsertRow };
  if (avatar) {
    insertRow.avatar_id = avatar.avatar_id;
    insertRow.hat_ids = avatar.hat_ids;
  }

  const { data, error } = await supabase
    .from("participants")
    .insert(insertRow)
    .select()
    .single();

  if (error && avatar && isMissingAvatarSchemaError(error)) {
    if (typeof console !== "undefined") {
      // Hjælp udvikleren: avatar_id/hat_ids-kolonnerne mangler i databasen.
      // Kør migrationen `supabase/migrations/008_add_avatar.sql` for at få
      // valgte karakterer gemt korrekt.
      console.warn(
        "[hvadmad] Avatar-kolonnerne mangler i 'participants'. " +
          "Joiner uden avatar (placeholder vises). " +
          "Kør `supabase db reset` eller anvend migration 008_add_avatar.sql.",
      );
    }
    const fallback = await supabase
      .from("participants")
      .insert(baseInsertRow)
      .select()
      .single();

    if (fallback.error) {
      throw new Error(`Kunne ikke joine rum: ${fallback.error.message}`);
    }
    return fallback.data;
  }

  if (error) throw new Error(`Kunne ikke joine rum: ${error.message}`);
  return data;
}

export async function updateParticipantAvatar(
  participantId: string,
  avatar: AvatarConfiguration,
): Promise<void> {
  const { error } = await supabase
    .from("participants")
    .update({
      avatar_id: avatar.avatar_id,
      hat_ids: avatar.hat_ids,
    })
    .eq("id", participantId);

  if (error)
    throw new Error(`Kunne ikke opdatere avatar: ${error.message}`);
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

// ----------------------------------------------------------------------------
// "Alle vælger fra liste" (collecting) mode
// ----------------------------------------------------------------------------

/**
 * Move a room into the collecting phase. The host configures category, the
 * required pick count per participant, and a hard deadline (ms in the future).
 */
export async function startCollectingPhase(
  roomId: string,
  category: VotingCategory,
  collectCount: number,
  deadlineMs: number,
): Promise<void> {
  const deadline = new Date(deadlineMs).toISOString();
  const { error } = await supabase
    .from("rooms")
    .update({
      status: "collecting",
      category,
      collect_count: collectCount,
      collect_deadline: deadline,
      last_activity: new Date().toISOString(),
    })
    .eq("id", roomId);

  if (error)
    throw new Error(`Kunne ikke starte indsamling: ${error.message}`);
}

/**
 * Attempt to claim a food option for a participant. Returns true on success,
 * false if another participant already claimed it (DB primary key collision)
 * so the UI can refresh and grey it out.
 */
export async function claimPick(
  roomId: string,
  participantId: string,
  foodOptionId: string,
): Promise<{ ok: boolean; reason?: "taken" | "error"; message?: string }> {
  const { error } = await supabase.from("participant_picks").insert({
    room_id: roomId,
    participant_id: participantId,
    food_option_id: foodOptionId,
  });

  if (!error) return { ok: true };

  if (error.code === "23505") {
    return { ok: false, reason: "taken" };
  }
  return { ok: false, reason: "error", message: error.message };
}

export async function releasePick(
  roomId: string,
  participantId: string,
  foodOptionId: string,
): Promise<void> {
  const { error } = await supabase
    .from("participant_picks")
    .delete()
    .eq("room_id", roomId)
    .eq("participant_id", participantId)
    .eq("food_option_id", foodOptionId);

  if (error) throw new Error(`Kunne ikke fjerne valg: ${error.message}`);
}

export async function getRoomPicks(roomId: string): Promise<ParticipantPick[]> {
  const { data, error } = await supabase
    .from("participant_picks")
    .select()
    .eq("room_id", roomId);

  if (error) throw new Error(`Kunne ikke hente valg: ${error.message}`);
  return data;
}

/**
 * End the collecting phase and seed the voting pool with the union of every
 * participant's picks. Idempotent — if another client already flipped the
 * room into `voting`, this is a no-op.
 *
 * Returns true if THIS call performed the transition (so the caller can
 * trigger a single broadcast), false if someone beat us to it or there were
 * no picks at all.
 */
export async function finalizeCollectingPhase(
  roomId: string,
): Promise<boolean> {
  const { data: room } = await supabase
    .from("rooms")
    .select("status, category")
    .eq("id", roomId)
    .single();

  if (!room || room.status !== "collecting") return false;

  const picks = await getRoomPicks(roomId);
  const uniqueFoodIds = Array.from(new Set(picks.map((p) => p.food_option_id)));

  if (uniqueFoodIds.length === 0) return false;

  // Atomically claim the transition: only succeeds while status is still
  // 'collecting'. Prevents two clients from double-seeding the food options.
  const { data: updated, error: updateError } = await supabase
    .from("rooms")
    .update({
      status: "voting",
      last_activity: new Date().toISOString(),
    })
    .eq("id", roomId)
    .eq("status", "collecting")
    .select("id");

  if (updateError) {
    throw new Error(
      `Kunne ikke afslutte indsamling: ${updateError.message}`,
    );
  }
  if (!updated || updated.length === 0) return false;

  await setRoomFoodOptions(roomId, uniqueFoodIds);
  return true;
}
