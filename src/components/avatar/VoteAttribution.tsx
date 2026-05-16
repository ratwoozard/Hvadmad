"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Participant } from "@/types/room";
import type { AttributionGroup } from "@/lib/avatars/attribution";
import { Avatar } from "./Avatar";
import { cn } from "@/components/ui/FocusRing";

interface VoteAttributionProps {
  group: AttributionGroup;
  currentSessionId?: string;
  /** Show all members in expanded mode (used in modal). */
  expanded?: boolean;
}

const MAX_VISIBLE = 5;

const SECTIONS = [
  {
    key: "ja" as const,
    label: "Ja",
    icon: "👍",
    bg: "bg-green-50",
    emptyText: "Ingen sagde ja",
  },
  {
    key: "maaske" as const,
    label: "Måske",
    icon: "🤷",
    bg: "bg-amber-50",
    emptyText: "Ingen sagde måske",
  },
  {
    key: "nej" as const,
    label: "Nej",
    icon: "👎",
    bg: "bg-red-50",
    emptyText: "Ingen sagde nej 🎉",
  },
];

function AttributionSection({
  members,
  label,
  icon,
  bg,
  emptyText,
  currentSessionId,
  expanded,
}: {
  members: Participant[];
  label: string;
  icon: string;
  bg: string;
  emptyText: string;
  currentSessionId?: string;
  expanded: boolean;
}) {
  const [showAll, setShowAll] = useState(expanded);
  const visible = showAll ? members : members.slice(0, MAX_VISIBLE);
  const overflow = members.length - visible.length;

  return (
    <div className={cn("rounded-xl px-3 py-2", bg)}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-gray-600">
        <span>
          <span aria-hidden="true">{icon}</span> {label} ({members.length})
        </span>
      </div>
      {members.length === 0 ? (
        <p className="mt-1 text-xs text-gray-500">{emptyText}</p>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-1">
          <AnimatePresence initial={false}>
            {visible.map((p) => {
              const isYou = p.session_id === currentSessionId;
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.18 }}
                  title={isYou ? `${p.nickname} (dig)` : p.nickname}
                >
                  <Avatar
                    config={{
                      avatar_id: p.avatar_id ?? null,
                      hat_ids: p.hat_ids ?? [],
                    }}
                    size="sm"
                    altText={`${p.nickname}${isYou ? " (dig)" : ""}`}
                    className={
                      isYou ? "ring-2 ring-brand-500 ring-offset-1" : ""
                    }
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
          {!showAll && overflow > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="ml-1 inline-flex h-8 items-center justify-center rounded-full bg-white px-2 text-xs font-medium text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
              aria-label={`Vis ${overflow} flere`}
            >
              +{overflow} flere
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Visual attribution of a single food option's votes — three groups
 * (Ja / Måske / Nej) each rendering up to 5 avatars + an overflow "+N flere"
 * stack. The current user's own avatar gets a brand-coloured ring.
 */
export function VoteAttribution({
  group,
  currentSessionId,
  expanded = false,
}: VoteAttributionProps) {
  return (
    <div className="mt-3 grid gap-2">
      {SECTIONS.map((s) => (
        <AttributionSection
          key={s.key}
          members={group[s.key]}
          label={s.label}
          icon={s.icon}
          bg={s.bg}
          emptyText={s.emptyText}
          currentSessionId={currentSessionId}
          expanded={expanded}
        />
      ))}
    </div>
  );
}
