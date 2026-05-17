"use client";

/**
 * Madmoji-tumult
 * ---------------
 * Lille free-for-all-arena der lever i lobby'en mens man venter på sin
 * gruppe. Hver spiller får tildelt en tilfældig mademoji og dyster mod
 * et knippe AI-mademojis: tryk i arenaen for at "dashe" mod et punkt,
 * og kollidér med modstandere for at hugge HP af dem. Sidste mademoji
 * tilbage vinder.
 *
 * Designnoter:
 *  - 100% lokal pr. enhed (ingen netværk, ingen Supabase). Spillet er
 *    fjernet fra realtidsflowet med fuldt overlæg, så det ikke kan
 *    forsinke afstemningens start.
 *  - Game-loop kører via requestAnimationFrame og muterer DOM-styles
 *    direkte i stedet for at re-rendre React-træet 60 gange i sekundet.
 *    React-state bruges kun til fase-skift og scoreboard.
 *  - Respekterer prefers-reduced-motion ved at vise et statisk
 *    "ventespil pauset"-kort i stedet for animeret kamp.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { MADEMOJIS, type Madmoji, pickRandomMademoji } from "@/lib/mademoji";

const ARENA_MIN = 240;
const ARENA_MAX = 360;
const FIGHTER_R = 22;
const FIGHTER_FONT = 30; // px
const MAX_SPEED = 320; // px/sek
const FRICTION = 0.92; // hver frame ved 60fps; vi skalerer for dt nedenfor
const DASH_SPEED = 380; // px/sek umiddelbart efter et tap
const DASH_COOLDOWN = 0.45; // sek
const COLLISION_DAMAGE_THRESHOLD = 110; // px/sek relativ hastighed for at gøre skade
const HIT_FLASH_SECONDS = 0.35;
const DEATH_DURATION = 0.6;
const AI_COUNT = 5;
const HP_MAX = 3;
const AI_THINK_MIN = 0.55;
const AI_THINK_MAX = 1.4;
const RESTART_DELAY = 2.4; // sek mellem rundens slut og auto-genstart

type Phase = "idle" | "playing" | "won" | "lost";

interface Fighter {
  id: number;
  emoji: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  isPlayer: boolean;
  dashCooldown: number;
  hitFlash: number;
  thinkIn: number;
  /** 0 = i live, ellers tæller op til DEATH_DURATION og fjernes derefter. */
  dying: number;
  alive: boolean;
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function spawnFighters(arenaSize: number, player: Madmoji): Fighter[] {
  const fighters: Fighter[] = [];
  const pool = MADEMOJIS.filter((m) => m.id !== player.id);
  // Bland AI-mademojis så vi får varieret felt hver runde.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const total = AI_COUNT + 1;
  for (let i = 0; i < total; i++) {
    const isPlayer = i === 0;
    const m = isPlayer ? player : pool[i - 1];
    // Spawn rundt om centrum så ingen starter for tæt på hinanden.
    const angle = (i / total) * Math.PI * 2 + rand(-0.3, 0.3);
    const radius = arenaSize * 0.32;
    fighters.push({
      id: i,
      emoji: m.emoji,
      name: m.name,
      x: arenaSize / 2 + Math.cos(angle) * radius,
      y: arenaSize / 2 + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      hp: HP_MAX,
      isPlayer,
      dashCooldown: 0,
      hitFlash: 0,
      thinkIn: rand(AI_THINK_MIN, AI_THINK_MAX),
      dying: 0,
      alive: true,
    });
  }
  return fighters;
}

export function MadmojiMayhem({ className }: { className?: string }) {
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const fighterElsRef = useRef<Array<HTMLDivElement | null>>([]);
  const fightersRef = useRef<Fighter[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const arenaSizeRef = useRef<number>(ARENA_MIN);
  const phaseRef = useRef<Phase>("idle");
  const restartTimerRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>("idle");
  const [arenaSize, setArenaSize] = useState<number>(ARENA_MIN);
  const [playerMademoji, setPlayerMademoji] = useState<Madmoji | null>(null);
  const [scoreboard, setScoreboard] = useState({ wins: 0, kills: 0, rounds: 0 });
  const [hpVersion, setHpVersion] = useState(0); // tvinger render af HP-prikker

  const reduced = useReducedMotion();

  // Sync phase til ref så game-loop kan læse uden at fanges af stale closures.
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Mål arenaen så vi kan skalere på mobil og tablet.
  useEffect(() => {
    const el = arenaRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      const next = clamp(rect.width, ARENA_MIN, ARENA_MAX);
      arenaSizeRef.current = next;
      setArenaSize(next);
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const writeFighterStyle = useCallback((index: number, fighter: Fighter) => {
    const el = fighterElsRef.current[index];
    if (!el) return;
    const scale = fighter.dying > 0
      ? Math.max(0, 1 - fighter.dying / DEATH_DURATION)
      : 1;
    const rot = fighter.dying > 0 ? fighter.dying * 540 : 0;
    el.style.transform =
      `translate3d(${fighter.x - FIGHTER_R}px, ${fighter.y - FIGHTER_R}px, 0) ` +
      `scale(${scale}) rotate(${rot}deg)`;
    el.style.opacity = fighter.alive ? "1" : "0";
    el.style.filter = fighter.hitFlash > 0
      ? `drop-shadow(0 0 6px rgba(239,68,68,0.9)) brightness(${1 + fighter.hitFlash})`
      : "drop-shadow(0 2px 3px rgba(0,0,0,0.18))";
  }, []);

  const stopLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startRound = useCallback(() => {
    if (restartTimerRef.current != null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    const player = pickRandomMademoji();
    setPlayerMademoji(player);
    fightersRef.current = spawnFighters(arenaSizeRef.current, player);
    setHpVersion((v) => v + 1);
    setPhase("playing");
    phaseRef.current = "playing";
    lastTimeRef.current = 0;

    const step = (time: number) => {
      const fighters = fightersRef.current;
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dtRaw = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      const dt = Math.min(dtRaw, 1 / 30); // cap så pausede faner ikke teleporterer

      const size = arenaSizeRef.current;

      // Friktion skaleret med dt så det føles ens uanset framerate.
      const frictionFactor = Math.pow(FRICTION, dt * 60);

      let aliveCount = 0;
      let lastAlive: Fighter | null = null;

      for (const f of fighters) {
        if (!f.alive) continue;

        if (f.dying > 0) {
          f.dying += dt;
          if (f.dying >= DEATH_DURATION) {
            f.alive = false;
          }
          continue;
        }

        // AI-beslutninger.
        if (!f.isPlayer) {
          f.thinkIn -= dt;
          if (f.thinkIn <= 0 && f.dashCooldown <= 0) {
            const targets = fighters.filter(
              (o) => o.alive && o.dying === 0 && o.id !== f.id,
            );
            if (targets.length > 0) {
              const target = targets[Math.floor(Math.random() * targets.length)];
              let dx = target.x - f.x;
              let dy = target.y - f.y;
              // Lavt HP → 35% chance for at flygte i stedet for at jagte.
              if (f.hp <= 1 && Math.random() < 0.35) {
                dx = -dx;
                dy = -dy;
              }
              const len = Math.hypot(dx, dy) || 1;
              const speed = DASH_SPEED * (0.75 + Math.random() * 0.3);
              f.vx = (dx / len) * speed;
              f.vy = (dy / len) * speed;
              f.dashCooldown = DASH_COOLDOWN + Math.random() * 0.25;
            }
            f.thinkIn = rand(AI_THINK_MIN, AI_THINK_MAX);
          }
        }

        f.dashCooldown = Math.max(0, f.dashCooldown - dt);
        f.hitFlash = Math.max(0, f.hitFlash - dt);

        // Anvend friktion + cap topfart.
        f.vx *= frictionFactor;
        f.vy *= frictionFactor;
        const speed2 = f.vx * f.vx + f.vy * f.vy;
        const max2 = MAX_SPEED * MAX_SPEED;
        if (speed2 > max2) {
          const s = MAX_SPEED / Math.sqrt(speed2);
          f.vx *= s;
          f.vy *= s;
        }

        f.x += f.vx * dt;
        f.y += f.vy * dt;

        // Bounce mod vægge.
        if (f.x < FIGHTER_R) {
          f.x = FIGHTER_R;
          f.vx = Math.abs(f.vx) * 0.6;
        } else if (f.x > size - FIGHTER_R) {
          f.x = size - FIGHTER_R;
          f.vx = -Math.abs(f.vx) * 0.6;
        }
        if (f.y < FIGHTER_R) {
          f.y = FIGHTER_R;
          f.vy = Math.abs(f.vy) * 0.6;
        } else if (f.y > size - FIGHTER_R) {
          f.y = size - FIGHTER_R;
          f.vy = -Math.abs(f.vy) * 0.6;
        }

        aliveCount += 1;
        lastAlive = f;
      }

      // Parvis kollision.
      let hpChanged = false;
      for (let i = 0; i < fighters.length; i++) {
        const a = fighters[i];
        if (!a.alive || a.dying > 0) continue;
        for (let j = i + 1; j < fighters.length; j++) {
          const b = fighters[j];
          if (!b.alive || b.dying > 0) continue;
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy);
          const minDist = FIGHTER_R * 2;
          if (dist < minDist && dist > 0.0001) {
            // Skub fra hinanden.
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;
            a.x -= nx * overlap;
            a.y -= ny * overlap;
            b.x += nx * overlap;
            b.y += ny * overlap;

            // Beregn approach-hastighed (negativ = bevæger sig mod hinanden).
            const rvx = b.vx - a.vx;
            const rvy = b.vy - a.vy;
            const approach = -(rvx * nx + rvy * ny);

            // Elastisk bounce (let dæmpet).
            const restitution = 0.6;
            const impulse = approach * restitution;
            a.vx -= nx * impulse;
            a.vy -= ny * impulse;
            b.vx += nx * impulse;
            b.vy += ny * impulse;

            if (approach > COLLISION_DAMAGE_THRESHOLD) {
              const aSpeed = Math.hypot(a.vx, a.vy);
              const bSpeed = Math.hypot(b.vx, b.vy);
              const loser = aSpeed < bSpeed ? a : b;
              const winner = loser === a ? b : a;
              loser.hp -= 1;
              loser.hitFlash = HIT_FLASH_SECONDS;
              hpChanged = true;
              if (loser.hp <= 0) {
                loser.dying = 0.0001;
                if (winner.isPlayer) {
                  // Spilleren fik et kill.
                  setScoreboard((s) => ({ ...s, kills: s.kills + 1 }));
                }
              }
            }
          }
        }
      }

      if (hpChanged) {
        setHpVersion((v) => v + 1);
      }

      // Skriv styles til DOM.
      for (let i = 0; i < fighters.length; i++) {
        writeFighterStyle(i, fighters[i]);
      }

      // Vinder-check (kun når runden er aktiv).
      if (phaseRef.current === "playing" && aliveCount <= 1) {
        const won = lastAlive?.isPlayer === true;
        phaseRef.current = won ? "won" : "lost";
        setPhase(won ? "won" : "lost");
        setScoreboard((s) => ({
          ...s,
          rounds: s.rounds + 1,
          wins: s.wins + (won ? 1 : 0),
        }));
        restartTimerRef.current = window.setTimeout(() => {
          startRound();
        }, RESTART_DELAY * 1000);
      }

      if (phaseRef.current === "playing") {
        rafRef.current = requestAnimationFrame(step);
      } else {
        // Lad død-animationer spille en lille smule ud efter runde-slut.
        rafRef.current = requestAnimationFrame(coastStep);
      }
    };

    const coastStep = (time: number) => {
      const fighters = fightersRef.current;
      if (lastTimeRef.current === 0) lastTimeRef.current = time;
      const dt = Math.min((time - lastTimeRef.current) / 1000, 1 / 30);
      lastTimeRef.current = time;
      const frictionFactor = Math.pow(FRICTION, dt * 60);
      for (let i = 0; i < fighters.length; i++) {
        const f = fighters[i];
        if (!f.alive) continue;
        if (f.dying > 0) {
          f.dying += dt;
          if (f.dying >= DEATH_DURATION) f.alive = false;
        } else {
          f.vx *= frictionFactor;
          f.vy *= frictionFactor;
          f.x += f.vx * dt;
          f.y += f.vy * dt;
        }
        writeFighterStyle(i, f);
      }
      if (phaseRef.current === "won" || phaseRef.current === "lost") {
        rafRef.current = requestAnimationFrame(coastStep);
      }
    };

    rafRef.current = requestAnimationFrame(step);
  }, [writeFighterStyle]);

  // Stop loop ved unmount.
  useEffect(() => {
    return () => {
      stopLoop();
      if (restartTimerRef.current != null) {
        window.clearTimeout(restartTimerRef.current);
      }
    };
  }, [stopLoop]);

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (phaseRef.current !== "playing") return;
      const el = arenaRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const player = fightersRef.current.find((f) => f.isPlayer);
      if (!player || !player.alive || player.dying > 0) return;
      if (player.dashCooldown > 0) return;
      const dx = x - player.x;
      const dy = y - player.y;
      const len = Math.hypot(dx, dy) || 1;
      player.vx = (dx / len) * DASH_SPEED;
      player.vy = (dy / len) * DASH_SPEED;
      player.dashCooldown = DASH_COOLDOWN;
    },
    [],
  );

  const fightersForRender = useMemo(() => {
    // Vi rendrer slot-DIVs én gang og lader rAF mutere transform.
    // hpVersion bruges kun til at lave en lille re-render af HP-prikker.
    return new Array(AI_COUNT + 1).fill(0).map((_, i) => i);
  }, []);

  const [open, setOpen] = useState(false);

  // Når brugeren lukker spillet, stop loop og nulstil til idle.
  useEffect(() => {
    if (!open) {
      stopLoop();
      phaseRef.current = "idle";
      setPhase("idle");
      if (restartTimerRef.current != null) {
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      fightersRef.current = [];
      setPlayerMademoji(null);
    }
  }, [open, stopLoop]);

  if (reduced) {
    return (
      <Card className={className}>
        <div className="flex items-start gap-3">
          <span aria-hidden className="text-2xl">🥊</span>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Ventespil
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Madmoji-tumult er sat på pause fordi du har slået animationer fra
              i dit system. Skru op for animationer for at brawle mod en
              håndfuld AI-mademojis mens du venter.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!open) {
    return (
      <Card className={className}>
        <div className="flex items-start gap-3">
          <span aria-hidden className="text-2xl">🥊</span>
          <div className="flex-1">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Mens I venter
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Træd ind i <strong>Madmoji-tumult</strong> — du bliver tildelt en
              tilfældig mademoji og dyster mod 5 vilde AI-mademojis i en
              free-for-all-deathmatch. Sidste mademoji tilbage vinder.
            </p>
            <Button
              onClick={() => {
                setOpen(true);
                // Lille forsinkelse så arenaen er målt før loopet starter.
                requestAnimationFrame(() => startRound());
              }}
              variant="primary"
              size="md"
              className="mt-3"
            >
              🥊 Start kamp
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const banner = (() => {
    if (phase === "won") {
      return {
        text: `Du vandt! ${playerMademoji?.emoji ?? "🍕"} regerer arenaen.`,
        tone: "bg-emerald-50 text-emerald-800 border-emerald-200",
      };
    }
    if (phase === "lost") {
      return {
        text: `Du blev ramt ud. ${playerMademoji?.emoji ?? "🍕"} ligger ned…`,
        tone: "bg-rose-50 text-rose-800 border-rose-200",
      };
    }
    return null;
  })();

  return (
    <Card className={className} padding="sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-lg">🥊</span>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
            Madmoji-tumult
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 active:bg-gray-200"
          aria-label="Luk ventespillet"
        >
          ✕ Luk
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-2" aria-live="polite">
          <span className="text-gray-500">Du er:</span>
          <span
            className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700"
            aria-label={
              playerMademoji
                ? `Du er en ${playerMademoji.name}`
                : "Vælger mademoji…"
            }
          >
            <span aria-hidden className="text-base">
              {playerMademoji?.emoji ?? "❓"}
            </span>
            <span className="hidden sm:inline">
              {playerMademoji?.name ?? "…"}
            </span>
          </span>
        </div>
        <div className="flex gap-3 text-gray-500">
          <span>
            <strong className="font-semibold text-gray-800">
              {scoreboard.wins}
            </strong>{" "}
            sejre
          </span>
          <span>
            <strong className="font-semibold text-gray-800">
              {scoreboard.kills}
            </strong>{" "}
            kills
          </span>
        </div>
      </div>

      <div
        ref={arenaRef}
        role="application"
        aria-label="Madmoji-tumult arena. Tryk i kassen for at suse din mademoji mod et punkt."
        onPointerDown={(e) => {
          e.preventDefault();
          handlePointer(e.clientX, e.clientY);
        }}
        onContextMenu={(e) => e.preventDefault()}
        className="relative mx-auto aspect-square w-full max-w-[360px] touch-none select-none overflow-hidden rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-amber-50 to-rose-50 shadow-inner"
        style={{ height: arenaSize, width: arenaSize }}
      >
        {/* Subtilt rude-mønster for at give arenaen karakter. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 50%, rgba(249,168,37,0.18) 0, transparent 60%)",
          }}
        />

        {fightersForRender.map((i) => {
          const f = fightersRef.current[i];
          const isPlayer = i === 0;
          // hpVersion fastholdes som dep så HP-prikker re-render ved skade.
          const hp = f?.hp ?? HP_MAX;
          return (
            <div
              key={i}
              ref={(el) => {
                fighterElsRef.current[i] = el;
              }}
              className="pointer-events-none absolute left-0 top-0 will-change-transform"
              style={{
                width: FIGHTER_R * 2,
                height: FIGHTER_R * 2,
                transition: "opacity 200ms ease-out",
              }}
            >
              <div
                className={
                  "relative flex h-full w-full items-center justify-center rounded-full " +
                  (isPlayer
                    ? "ring-2 ring-brand-500 ring-offset-1 ring-offset-amber-50"
                    : "")
                }
              >
                <span
                  aria-hidden
                  className="select-none leading-none"
                  style={{ fontSize: FIGHTER_FONT }}
                >
                  {f?.emoji ?? "🍕"}
                </span>
                {/* HP-prikker over hovedet. */}
                <div
                  key={`hp-${hpVersion}-${i}`}
                  className="absolute -top-2 left-1/2 flex -translate-x-1/2 gap-0.5"
                  aria-hidden
                >
                  {Array.from({ length: HP_MAX }).map((_, dotIdx) => (
                    <span
                      key={dotIdx}
                      className={
                        "block h-1.5 w-1.5 rounded-full " +
                        (dotIdx < hp
                          ? isPlayer
                            ? "bg-brand-500"
                            : "bg-gray-700/70"
                          : "bg-gray-300")
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Overlay-banner ved sejr/nederlag. */}
        {banner && (
          <div
            role="status"
            className={
              "absolute inset-x-3 bottom-3 rounded-xl border px-3 py-2 text-center text-sm font-medium shadow-sm backdrop-blur-sm " +
              banner.tone
            }
          >
            {banner.text}
            <div className="mt-0.5 text-xs opacity-70">Ny runde starter…</div>
          </div>
        )}

        {phase === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
            <Button onClick={startRound} variant="primary" size="md">
              🥊 Start kamp
            </Button>
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-[11px] text-gray-500">
        Tryk i arenaen for at sende{" "}
        <span aria-hidden>{playerMademoji?.emoji ?? "🍕"}</span> susende mod et
        punkt. Hurtigere = stærkere ved kollision.
      </p>
    </Card>
  );
}
