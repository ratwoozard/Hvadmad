import { supabase } from "./client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface PresenceState {
  session_id: string;
  nickname: string;
  is_host: boolean;
  status: "active" | "voting" | "done";
  joined_at: string;
}

export interface RoomStatusChangePayload {
  new_status: "lobby" | "collecting" | "voting" | "calculating" | "results";
  category?: string;
  food_option_count?: number;
  triggered_by: string;
}

export interface PickChangePayload {
  participant_id: string;
  food_option_id: string;
  action: "claim" | "release";
}

export interface VoteProgressPayload {
  session_id: string;
  nickname: string;
  total_voted: number;
  total_participants: number;
}

export interface HostTransferPayload {
  old_host_session_id: string;
  new_host_session_id: string;
  new_host_nickname: string;
  reason: "disconnect_timeout" | "manual";
}

export interface ReactionPayload {
  symbol: string;
  session_id: string;
  nickname: string;
}

export function createRoomChannel(roomCode: string): RealtimeChannel {
  return supabase.channel(`room:${roomCode}`);
}

export function subscribeToRoom(
  channel: RealtimeChannel,
  presenceState: PresenceState,
  callbacks: {
    onPresenceSync?: (state: Record<string, PresenceState[]>) => void;
    onPresenceJoin?: (key: string, newPresences: PresenceState[]) => void;
    onPresenceLeave?: (key: string, leftPresences: PresenceState[]) => void;
    onStatusChange?: (payload: RoomStatusChangePayload) => void;
    onVoteProgress?: (payload: VoteProgressPayload) => void;
    onHostTransfer?: (payload: HostTransferPayload) => void;
    onPickChange?: (payload: PickChangePayload) => void;
  }
): RealtimeChannel {
  channel
    .on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<PresenceState>();
      callbacks.onPresenceSync?.(state as any);
    })
    .on("presence", { event: "join" }, ({ key, newPresences }) => {
      callbacks.onPresenceJoin?.(key, newPresences as any);
    })
    .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
      callbacks.onPresenceLeave?.(key, leftPresences as any);
    })
    .on("broadcast", { event: "room_status_change" }, ({ payload }) => {
      callbacks.onStatusChange?.(payload as RoomStatusChangePayload);
    })
    .on("broadcast", { event: "vote_progress" }, ({ payload }) => {
      callbacks.onVoteProgress?.(payload as VoteProgressPayload);
    })
    .on("broadcast", { event: "host_transfer" }, ({ payload }) => {
      callbacks.onHostTransfer?.(payload as HostTransferPayload);
    })
    .on("broadcast", { event: "pick_change" }, ({ payload }) => {
      callbacks.onPickChange?.(payload as PickChangePayload);
    })
    .subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track(presenceState);
      }
    });

  return channel;
}

export function broadcastStatusChange(
  channel: RealtimeChannel,
  payload: RoomStatusChangePayload
) {
  channel.send({
    type: "broadcast",
    event: "room_status_change",
    payload,
  });
}

export function broadcastVoteProgress(
  channel: RealtimeChannel,
  payload: VoteProgressPayload
) {
  channel.send({
    type: "broadcast",
    event: "vote_progress",
    payload,
  });
}

export function broadcastHostTransfer(
  channel: RealtimeChannel,
  payload: HostTransferPayload
) {
  channel.send({
    type: "broadcast",
    event: "host_transfer",
    payload,
  });
}

export function broadcastReaction(
  channel: RealtimeChannel,
  payload: ReactionPayload
) {
  channel.send({
    type: "broadcast",
    event: "reaction",
    payload,
  });
}

export function broadcastPickChange(
  channel: RealtimeChannel,
  payload: PickChangePayload,
) {
  channel.send({
    type: "broadcast",
    event: "pick_change",
    payload,
  });
}
