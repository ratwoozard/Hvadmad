"use client";

import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/avatar/Avatar";
import { EASING, STAGGER } from "@/lib/motion/tokens";
import type { ParticipantPick } from "@/lib/match/insights";

interface ParticipantPicksProps {
  picks: ParticipantPick[];
  currentSessionId?: string;
}

const containerVariants: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: STAGGER.list } },
};

const rowVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.22, ease: EASING.out },
  },
};

/**
 * "Hvem stemte hvad" — a per-participant view of each member's favourite
 * pick. The pick is the dish the participant rated highest (Ja > Måske,
 * tie-broken by group match-%). Participants whose only votes were Nej
 * are listed with a soft "Sagde nej til alt" pill.
 *
 * The current user (matched on session id) is subtly highlighted with a
 * "(dig)" suffix on their name.
 */
export function ParticipantPicks({
  picks,
  currentSessionId,
}: ParticipantPicksProps) {
  if (picks.length === 0) return null;

  return (
    <Card aria-labelledby="participant-picks-heading">
      <header className="mb-4 flex items-start gap-3">
        <span
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-xl"
          aria-hidden="true"
        >
          👥
        </span>
        <div>
          <h2
            id="participant-picks-heading"
            className="font-bold text-gray-900"
          >
            Hvem stemte hvad
          </h2>
          <p className="text-xs text-gray-500">Se hvem der stemte på hvad.</p>
        </div>
      </header>

      <motion.ul
        variants={containerVariants}
        initial="initial"
        animate="animate"
        className="flex flex-col divide-y divide-gray-100"
      >
        {picks.map(({ participant, pick }) => {
          const isYou = participant.session_id === currentSessionId;

          return (
            <motion.li
              key={participant.id}
              variants={rowVariants}
              className="flex items-center gap-3 py-2.5"
            >
              <Avatar
                config={{
                  avatar_id: participant.avatar_id ?? null,
                  hat_ids: participant.hat_ids ?? [],
                }}
                size="sm"
                altText={`${participant.nickname}${isYou ? " (dig)" : ""}`}
                className={
                  isYou ? "ring-2 ring-brand-500 ring-offset-1" : undefined
                }
              />

              <span className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
                {participant.nickname}
                {isYou ? (
                  <span className="ml-1 text-xs font-normal text-gray-500">
                    (dig)
                  </span>
                ) : null}
              </span>

              {pick ? (
                <span className="inline-flex max-w-[55%] items-center gap-1 truncate rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                  {pick.emoji ? (
                    <span aria-hidden="true">{pick.emoji}</span>
                  ) : null}
                  <span className="truncate">{pick.name}</span>
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500">
                  Sagde nej til alt
                </span>
              )}
            </motion.li>
          );
        })}
      </motion.ul>
    </Card>
  );
}
