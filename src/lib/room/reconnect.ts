import { getSessionId } from "@/lib/session";
import { getParticipantBySession } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";

const RECONNECT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function attemptReconnect(
  roomId: string
): Promise<{ success: boolean; participantId?: string }> {
  const sessionId = getSessionId();
  if (!sessionId) return { success: false };

  const participant = await getParticipantBySession(roomId, sessionId);
  if (!participant) return { success: false };

  const lastSeen = new Date(participant.last_seen).getTime();
  const now = Date.now();

  if (now - lastSeen > RECONNECT_WINDOW_MS) {
    return { success: false };
  }

  await supabase
    .from("participants")
    .update({ status: "active", last_seen: new Date().toISOString() })
    .eq("id", participant.id);

  return { success: true, participantId: participant.id };
}

export function startHeartbeat(
  participantId: string,
  intervalMs: number = 30000
): () => void {
  const timer = setInterval(async () => {
    await supabase
      .from("participants")
      .update({ last_seen: new Date().toISOString() })
      .eq("id", participantId);
  }, intervalMs);

  return () => clearInterval(timer);
}
