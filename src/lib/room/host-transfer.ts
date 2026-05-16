import { supabase } from "@/lib/supabase/client";
import type { Participant } from "@/types/room";

const HOST_DISCONNECT_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export async function transferHostRole(
  roomId: string,
  oldHostId: string
): Promise<Participant | null> {
  const { data: participants } = await supabase
    .from("participants")
    .select()
    .eq("room_id", roomId)
    .neq("id", oldHostId)
    .in("status", ["active", "voting", "done"])
    .order("joined_at", { ascending: true })
    .limit(1);

  if (!participants || participants.length === 0) return null;

  const newHost = participants[0];

  await supabase
    .from("participants")
    .update({ is_host: false })
    .eq("id", oldHostId);

  await supabase
    .from("participants")
    .update({ is_host: true })
    .eq("id", newHost.id);

  await supabase
    .from("rooms")
    .update({
      host_session_id: newHost.session_id,
      host_nickname: newHost.nickname,
    })
    .eq("id", roomId);

  return newHost;
}

export function getHostDisconnectTimeout(): number {
  return HOST_DISCONNECT_TIMEOUT_MS;
}
