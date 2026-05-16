"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import type { AvatarConfiguration } from "@/types/avatar";
import { getAvatar } from "@/lib/avatars/catalog";
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

const PLACEHOLDER = "👤";

/**
 * Render a participant's chosen food character.
 * Accessibility: the wrapper carries the image role and Danish label, while
 * the decorative PNG itself is hidden from assistive tech.
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

  const composedLabel = altText ?? (avatar ? avatar.altText : "Ukendt avatar");

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
      {avatar ? (
        <Image
          src={avatar.imageSrc}
          alt=""
          aria-hidden="true"
          width={256}
          height={256}
          className="h-full w-full select-none object-contain"
          sizes={`${dim}px`}
          priority={size === "lg"}
        />
      ) : (
        <span aria-hidden="true" className="select-none text-2xl leading-none">
          {PLACEHOLDER}
        </span>
      )}
      {badge && (
        <span className="absolute -bottom-1 -right-1 z-10 flex items-center justify-center">
          {badge}
        </span>
      )}
    </span>
  );
}
