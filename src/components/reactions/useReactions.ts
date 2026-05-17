"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import { broadcastReaction } from "@/lib/supabase/realtime";
import type { ReactionPayload } from "@/lib/supabase/realtime";

export interface FlyingReaction {
  /** Locally unique id used as React key + cleanup target. */
  id: number;
  symbol: string;
  /** Display name for accessibility / future "X sent ❤️" tooltips. */
  nickname?: string;
  /** True when the local user sent it (lets the bar give immediate feedback). */
  fromSelf: boolean;
}

/** How long a flying emoji lives on screen before being cleaned up. */
const REACTION_LIFETIME_MS = 2600;

/** Hard cap so a flood of reactions can't OOM the page. */
const MAX_CONCURRENT = 80;

let nextId = 0;

/**
 * Realtime reaction wiring for a single room.
 *
 * - Opens a dedicated `room:<code>:reactions` broadcast channel so it doesn't
 *   collide with the existing status/vote broadcasts.
 * - `send(symbol)` spawns a local flying emoji instantly *and* broadcasts to
 *   everyone else in the room, so the sender gets zero-latency feedback while
 *   peers see the same animation a moment later.
 * - Incoming reactions from other peers also spawn flying emojis.
 *
 * Flying emojis are auto-removed after {@link REACTION_LIFETIME_MS} ms and
 * capped at {@link MAX_CONCURRENT} concurrent items.
 */
export function useReactions(
  roomCode: string,
  sessionId: string,
  nickname: string,
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const [reactions, setReactions] = useState<FlyingReaction[]>([]);

  const spawn = useCallback(
    (symbol: string, opts: { nickname?: string; fromSelf: boolean }) => {
      const id = ++nextId;
      setReactions((curr) => {
        const next = [
          ...curr,
          { id, symbol, nickname: opts.nickname, fromSelf: opts.fromSelf },
        ];
        return next.length > MAX_CONCURRENT
          ? next.slice(next.length - MAX_CONCURRENT)
          : next;
      });
      window.setTimeout(() => {
        setReactions((curr) => curr.filter((r) => r.id !== id));
      }, REACTION_LIFETIME_MS);
    },
    [],
  );

  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase.channel(`room:${roomCode}:reactions`, {
      config: { broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel.on(
      "broadcast",
      { event: "reaction" },
      ({ payload }: { payload: ReactionPayload }) => {
        // Defensive: even though `self: false` should keep us from receiving
        // our own broadcasts, double-check by session id so a config drift
        // doesn't show every reaction twice locally.
        if (payload.session_id === sessionId) return;
        spawn(payload.symbol, {
          nickname: payload.nickname,
          fromSelf: false,
        });
      },
    );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomCode, sessionId, spawn]);

  const send = useCallback(
    (symbol: string) => {
      spawn(symbol, { nickname, fromSelf: true });
      const channel = channelRef.current;
      if (channel) {
        broadcastReaction(channel, {
          symbol,
          session_id: sessionId,
          nickname,
        });
      }
    },
    [sessionId, nickname, spawn],
  );

  return { reactions, send };
}
