"use client";

import type { ReactNode } from "react";
import type { AvatarConfiguration } from "@/types/avatar";
import { getAvatar, getHats } from "@/lib/avatars/catalog";
import { cn } from "@/components/ui/FocusRing";

export type AvatarSize = "sm" | "md" | "lg";

interface AvatarProps {
  config: AvatarConfiguration | null | undefined;
  size?: AvatarSize;
  /** When true, render in muted/inactive style (grayscale, reduced opacity). */
  muted?: boolean;
  /** Optional small badge overlay (e.g. host crown, "(dig)"-indikator, checkmark). */
  badge?: ReactNode;
  /** Override accessible label entirely (otherwise composed from catalog). */
  altText?: string;
  className?: string;
}

const SIZE_PX: Record<AvatarSize, number> = {
  sm: 32,
  md: 64,
  lg: 96,
};

const EMOJI_SIZE: Record<AvatarSize, string> = {
  sm: "text-2xl leading-none",
  md: "text-5xl leading-none",
  lg: "text-7xl leading-none",
};

const PLACEHOLDER = "👤";

/**
 * Render a participant's avatar with stacked hats on top of an emoji base.
 *
 * Composition strategy: each layer is an absolutely-positioned emoji inside
 * a fixed-size container. Hats use slot-defined CSS transforms so a head-
 * hat sits at the top, eye-glasses at eye-level, etc.
 *
 * Accessibility: container is `role="img"` with an `aria-label` composed
 * from the avatar + each hat's Danish alt-text (e.g. "Pizza-avatar med
 * kokkehue og solbriller").
 */
export function Avatar({
  config,
  size = "md",
  muted = false,
  badge,
  altText,
  className,
}: AvatarProps) {
  const avatar = getAvatar(config?.avatar_id);
  const hats = getHats(config?.hat_ids ?? []);

  const composedLabel =
    altText ??
    (avatar
      ? [avatar.altText, ...hats.map((h) => h.altText)].join(" ")
      : "Ukendt avatar");

  const dim = SIZE_PX[size];

  return (
    <span
      role="img"
      aria-label={composedLabel}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center rounded-full bg-gray-100 transition-[filter,opacity] duration-200",
        muted ? "opacity-50 grayscale" : "",
        className,
      )}
      style={{ width: dim, height: dim }}
    >
      <span aria-hidden="true" className={cn("select-none", EMOJI_SIZE[size])}>
        {avatar ? avatar.emoji : PLACEHOLDER}
      </span>
      {hats.map((hat) => (
        <span
          key={hat.id}
          aria-hidden="true"
          className={cn(
            "absolute inset-0 flex items-center justify-center pointer-events-none select-none",
            EMOJI_SIZE[size],
          )}
          style={{ transform: hat.transform }}
        >
          {hat.emoji}
        </span>
      ))}
      {badge && (
        <span className="absolute -bottom-1 -right-1 z-10 flex items-center justify-center">
          {badge}
        </span>
      )}
    </span>
  );
}
