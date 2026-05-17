"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Room, Participant, ParticipantPick } from "@/types/room";
import type { FoodOption } from "@/types/food";
import {
  claimPick,
  releasePick,
  getRoomPicks,
  getFoodOptionsByCategory,
  finalizeCollectingPhase,
} from "@/lib/supabase/queries";
import {
  broadcastPickChange,
  broadcastStatusChange,
  createRoomChannel,
  subscribeToRoom,
} from "@/lib/supabase/realtime";
import { getSessionId } from "@/lib/session";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { AvatarBadge } from "@/components/avatar/AvatarBadge";
import { cn, FOCUS_RING } from "@/components/ui/FocusRing";

interface IndsamlingProps {
  room: Room;
  participant: Participant;
  participants: Participant[];
  onRoomUpdate: (room: Room) => void;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "0:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export default function Indsamling({
  room,
  participant,
  participants,
  onRoomUpdate,
}: IndsamlingProps) {
  const [options, setOptions] = useState<FoodOption[]>([]);
  const [picks, setPicks] = useState<ParticipantPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [finalizing, setFinalizing] = useState(false);
  const finalizingRef = useRef(false);

  const requiredCount = room.collect_count ?? 3;
  const deadlineMs = room.collect_deadline
    ? new Date(room.collect_deadline).getTime()
    : null;
  const remainingMs = deadlineMs ? Math.max(0, deadlineMs - now) : 0;
  const timeIsUp = deadlineMs !== null && remainingMs <= 0;

  // Map foodOptionId -> participantId who claimed it.
  const ownerByFood = useMemo(() => {
    const map = new Map<string, string>();
    picks.forEach((p) => map.set(p.food_option_id, p.participant_id));
    return map;
  }, [picks]);

  const participantById = useMemo(() => {
    const map = new Map<string, Participant>();
    participants.forEach((p) => map.set(p.id, p));
    return map;
  }, [participants]);

  const myPicks = useMemo(
    () => picks.filter((p) => p.participant_id === participant.id),
    [picks, participant.id],
  );
  const myPickCount = myPicks.length;
  const canPickMore = myPickCount < requiredCount;
  const iAmDone = myPickCount >= requiredCount;

  const pickCountByParticipant = useMemo(() => {
    const map = new Map<string, number>();
    picks.forEach((p) => {
      map.set(p.participant_id, (map.get(p.participant_id) ?? 0) + 1);
    });
    return map;
  }, [picks]);

  const everyoneDone =
    participants.length > 0 &&
    participants.every(
      (p) => (pickCountByParticipant.get(p.id) ?? 0) >= requiredCount,
    );

  const refreshPicks = useCallback(async () => {
    try {
      const next = await getRoomPicks(room.id);
      setPicks(next);
    } catch {
      // Soft-fail; the 2s polling loop in page.tsx + the realtime broadcast
      // will catch us up on the next tick.
    }
  }, [room.id]);

  // Initial load: dishes for the category + current picks.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!room.category) {
        setError("Rummet mangler en kategori.");
        setLoading(false);
        return;
      }
      try {
        const [opts, currentPicks] = await Promise.all([
          getFoodOptionsByCategory(room.category),
          getRoomPicks(room.id),
        ]);
        if (cancelled) return;
        setOptions(opts);
        setPicks(currentPicks);
        setLoading(false);
      } catch (e: unknown) {
        if (cancelled) return;
        const message =
          e instanceof Error ? e.message : "Kunne ikke indlæse retter.";
        setError(message);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [room.id, room.category]);

  // 1s timer + 2s pick-refresh fallback (in addition to realtime broadcasts).
  useEffect(() => {
    const tickInterval = window.setInterval(() => setNow(Date.now()), 1000);
    const refreshInterval = window.setInterval(() => {
      void refreshPicks();
    }, 2000);
    return () => {
      window.clearInterval(tickInterval);
      window.clearInterval(refreshInterval);
    };
  }, [refreshPicks]);

  // Realtime channel: react to pick_change broadcasts so the "taken" overlay
  // shows up instantly without waiting for the 2-second poll.
  useEffect(() => {
    const channel = createRoomChannel(room.code);
    subscribeToRoom(
      channel,
      {
        session_id: getSessionId(),
        nickname: participant.nickname,
        is_host: participant.is_host,
        status: "active",
        joined_at: participant.joined_at,
      },
      {
        onPickChange: () => {
          void refreshPicks();
        },
        onStatusChange: (payload) => {
          if (payload.new_status === "voting") {
            onRoomUpdate({ ...room, status: "voting" });
          }
        },
      },
    );
    return () => {
      channel.unsubscribe();
    };
  }, [
    room,
    participant.nickname,
    participant.is_host,
    participant.joined_at,
    refreshPicks,
    onRoomUpdate,
  ]);

  // Auto-finalize: the moment the deadline elapses OR everyone has hit their
  // quota, the first client to notice flips the room to `voting`.
  useEffect(() => {
    if (loading || finalizingRef.current) return;
    if (!(timeIsUp || everyoneDone)) return;

    finalizingRef.current = true;
    setFinalizing(true);

    (async () => {
      try {
        const didTransition = await finalizeCollectingPhase(room.id);
        if (didTransition) {
          const channel = createRoomChannel(room.code);
          broadcastStatusChange(channel, {
            new_status: "voting",
            triggered_by: getSessionId(),
          });
          onRoomUpdate({ ...room, status: "voting" });
        }
      } catch {
        // Polling in page.tsx will recover us if needed.
        finalizingRef.current = false;
        setFinalizing(false);
      }
    })();
  }, [
    timeIsUp,
    everyoneDone,
    loading,
    room,
    onRoomUpdate,
  ]);

  const handleClaim = useCallback(
    async (option: FoodOption) => {
      if (pendingId || !canPickMore || iAmDone) return;
      setPendingId(option.id);
      setError(null);

      // Optimistic insert so the UI feels instant.
      const optimistic: ParticipantPick = {
        room_id: room.id,
        food_option_id: option.id,
        participant_id: participant.id,
        picked_at: new Date().toISOString(),
      };
      setPicks((prev) => [...prev, optimistic]);

      const result = await claimPick(room.id, participant.id, option.id);
      if (!result.ok) {
        // Rollback optimistic state and refresh so the user sees who got it.
        setPicks((prev) =>
          prev.filter(
            (p) =>
              !(
                p.food_option_id === option.id &&
                p.participant_id === participant.id &&
                p.picked_at === optimistic.picked_at
              ),
          ),
        );
        await refreshPicks();
        if (result.reason === "taken") {
          setError(`${option.name} blev lige taget af en anden.`);
        } else {
          setError(result.message ?? "Noget gik galt. Prøv igen.");
        }
      } else {
        const channel = createRoomChannel(room.code);
        broadcastPickChange(channel, {
          participant_id: participant.id,
          food_option_id: option.id,
          action: "claim",
        });
      }
      setPendingId(null);
    },
    [
      pendingId,
      canPickMore,
      iAmDone,
      room.id,
      room.code,
      participant.id,
      refreshPicks,
    ],
  );

  const handleRelease = useCallback(
    async (option: FoodOption) => {
      if (pendingId) return;
      setPendingId(option.id);
      setError(null);

      const previous = picks;
      setPicks((prev) =>
        prev.filter(
          (p) =>
            !(
              p.food_option_id === option.id &&
              p.participant_id === participant.id
            ),
        ),
      );

      try {
        await releasePick(room.id, participant.id, option.id);
        const channel = createRoomChannel(room.code);
        broadcastPickChange(channel, {
          participant_id: participant.id,
          food_option_id: option.id,
          action: "release",
        });
      } catch (e: unknown) {
        setPicks(previous);
        const message =
          e instanceof Error ? e.message : "Kunne ikke fjerne valg.";
        setError(message);
      }
      setPendingId(null);
    },
    [pendingId, picks, room.id, room.code, participant.id],
  );

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce text-4xl">🧺</div>
          <p className="mt-2 text-gray-500">Indlæser retter...</p>
        </div>
      </div>
    );
  }

  if (error && options.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <div className="text-4xl">😕</div>
        <p className="text-center text-gray-600">{error}</p>
      </div>
    );
  }

  const remainingLabel = formatRemaining(remainingMs);
  const urgent = remainingMs > 0 && remainingMs < 15_000;

  return (
    <div className="flex min-h-[80vh] flex-col gap-5 py-2">
      <header className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              🧺 Vælg dine retter
            </h1>
            <p className="text-sm text-gray-600">
              Pluk {requiredCount}{" "}
              {requiredCount === 1 ? "ret" : "retter"} fra listen.
            </p>
          </div>
          <div
            className={cn(
              "rounded-xl px-4 py-2 text-center font-mono text-lg font-semibold tabular-nums shadow-sm transition-colors",
              urgent
                ? "bg-red-100 text-red-700"
                : "bg-brand-100 text-brand-800",
            )}
            aria-live="polite"
            aria-label={`Tid tilbage: ${remainingLabel}`}
          >
            <div className="text-[10px] uppercase tracking-wide opacity-70">
              Tid tilbage
            </div>
            <div>{remainingLabel}</div>
          </div>
        </div>

        <Card padding="sm" className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-800">
              Din fremdrift: {myPickCount} / {requiredCount}
            </span>
            {iAmDone && (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                ✓ Færdig
              </span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <motion.div
              className="h-full bg-brand-500"
              initial={false}
              animate={{
                width: `${Math.min(100, (myPickCount / requiredCount) * 100)}%`,
              }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </Card>

        <Card padding="sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Gruppen ({participants.length})
          </p>
          <ul className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const count = pickCountByParticipant.get(p.id) ?? 0;
              const done = count >= requiredCount;
              return (
                <li key={p.id}>
                  <AvatarBadge
                    participant={p}
                    size="sm"
                    isYou={p.id === participant.id}
                    showName
                    trailing={
                      <span
                        className={cn(
                          "text-xs",
                          done ? "text-green-700" : "text-gray-500",
                        )}
                      >
                        {done ? "✓ klar" : `${count}/${requiredCount}`}
                      </span>
                    }
                  />
                </li>
              );
            })}
          </ul>
        </Card>

        <AnimatePresence>
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              role="alert"
              className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <section aria-labelledby="dishes-heading">
        <h2 id="dishes-heading" className="sr-only">
          Tilgængelige retter
        </h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {options.map((opt) => {
              const ownerId = ownerByFood.get(opt.id);
              const isMine = ownerId === participant.id;
              const isTakenByOther = !!ownerId && !isMine;
              const owner = ownerId ? participantById.get(ownerId) : null;
              const disabled =
                pendingId === opt.id ||
                isTakenByOther ||
                (!isMine && !canPickMore) ||
                finalizing;

              return (
                <motion.li
                  key={opt.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      isMine ? handleRelease(opt) : handleClaim(opt)
                    }
                    disabled={disabled}
                    aria-pressed={isMine}
                    className={cn(
                      "relative flex w-full min-h-touch items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all",
                      FOCUS_RING,
                      isMine
                        ? "border-brand-500 bg-brand-50 shadow-sm"
                        : isTakenByOther
                          ? "cursor-not-allowed border-transparent bg-gray-100 opacity-70"
                          : "border-gray-200 bg-white hover:border-brand-200 hover:bg-brand-50/40 active:bg-brand-50",
                      pendingId === opt.id && "opacity-60",
                    )}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {opt.emoji ?? "🍽️"}
                    </span>
                    <span className="flex-1">
                      <span className="block font-semibold text-gray-900">
                        {opt.name}
                      </span>
                      {opt.description && (
                        <span className="block text-xs text-gray-500">
                          {opt.description}
                        </span>
                      )}
                    </span>
                    {isMine && (
                      <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs font-semibold text-white">
                        ✓ Dit valg
                      </span>
                    )}
                    {isTakenByOther && owner && (
                      <span
                        className="flex items-center gap-1 text-xs text-gray-500"
                        title={`Taget af ${owner.nickname}`}
                      >
                        <span className="hidden sm:inline">Taget af</span>
                        <AvatarBadge
                          participant={owner}
                          size="sm"
                          showName={false}
                        />
                      </span>
                    )}
                  </button>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>

        {options.length === 0 && (
          <p className="text-center text-sm text-gray-500">
            Der er ingen retter i denne kategori.
          </p>
        )}
      </section>

      <footer
        className="sticky bottom-0 -mx-4 mt-auto border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur"
        aria-live="polite"
      >
        {iAmDone ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-gray-700">
              ✅ Du har valgt {requiredCount}{" "}
              {requiredCount === 1 ? "ret" : "retter"}. Venter på de andre…
            </p>
            <span className="animate-pulse text-xl" aria-hidden="true">
              ⏳
            </span>
          </div>
        ) : (
          <p className="text-sm text-gray-700">
            Vælg {requiredCount - myPickCount} mere for at være klar.
          </p>
        )}
      </footer>
    </div>
  );
}
