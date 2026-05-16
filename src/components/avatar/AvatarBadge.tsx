"use client";

import type { Participant } from "@/types/room";
import { Avatar, type AvatarSize } from "./Avatar";
import { cn } from "@/components/ui/FocusRing";

interface AvatarBadgeProps {
  participant: Pick<
    Participant,
    "nickname" | "is_host" | "status" | "avatar_id" | "hat_ids"
  >;
  size?: AvatarSize;
  showName?: boolean;
  /** When true, draws a small ring around the avatar indicating "this is you". */
  isYou?: boolean;
  /** Optional trailing element (e.g. checkmark for "har stemt"). */
  trailing?: React.ReactNode;
  /** Click handler — when provided, the badge becomes a button. */
  onClick?: () => void;
  className?: string;
}

/**
 * Compact display of a participant: avatar + nickname + optional badges.
 *
 * Use `size="sm"` for tight lists (lobby pills, attribution groups),
 * `size="md"` for vote-progress, `size="lg"` for hero/profile contexts.
 */
export function AvatarBadge({
  participant,
  size = "sm",
  showName = true,
  isYou = false,
  trailing,
  onClick,
  className,
}: AvatarBadgeProps) {
  const muted =
    participant.status === "inactive" || participant.status === "disconnected";

  const inner = (
    <>
      <Avatar
        config={{
          avatar_id: participant.avatar_id ?? null,
          hat_ids: participant.hat_ids ?? [],
        }}
        size={size}
        muted={muted}
        className={isYou ? "ring-2 ring-brand-500 ring-offset-2" : ""}
        badge={
          participant.is_host ? (
            <span
              className="rounded-full bg-yellow-300 px-1 text-[10px] leading-none"
              aria-label="vært"
              title="Vært"
            >
              👑
            </span>
          ) : undefined
        }
      />
      {showName && (
        <span className="flex flex-col items-start text-left">
          <span className="text-sm font-medium text-gray-800">
            {participant.nickname}
            {isYou && (
              <span className="ml-1 text-xs font-normal text-brand-600">
                (dig)
              </span>
            )}
          </span>
          {trailing && <span className="text-xs text-gray-500">{trailing}</span>}
        </span>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-2 rounded-xl px-2 py-1 transition-colors hover:bg-gray-100 active:bg-gray-200",
          className,
        )}
      >
        {inner}
      </button>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {inner}
    </span>
  );
}
