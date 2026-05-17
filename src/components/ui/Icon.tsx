import Image from "next/image";

import { ICON_CATALOG, type IconName } from "@/lib/icons/catalog";

export type { IconName } from "@/lib/icons/catalog";

type IconProps = {
  /** Catalog key — autocompletes from `IconName`. */
  name: IconName;
  /**
   * Edge length in CSS pixels for the rendered icon. The underlying PNG is
   * served at 2× via Next.js' built-in image optimization for crispness on
   * retina displays.
   */
  size?: number;
  /**
   * - `decorative` (default): icon is purely decorative; rendered with
   *   `aria-hidden` and an empty alt so screen readers skip it. Use this when
   *   the icon sits next to descriptive text.
   * - `label`: icon carries meaning on its own (e.g. a standalone icon-button).
   *   Falls back to the catalog's Danish label, override with `label` prop.
   */
  role?: "decorative" | "label";
  /** Override the accessible label (only used when `role="label"`). */
  label?: string;
  className?: string;
};

/**
 * Renders one of the bitmap icons extracted from the source illustration sheets.
 *
 * The PNGs are flat illustrations with their own colour and shading, so we do
 * NOT recolour them via CSS filters — that would muddy the cream highlights
 * and orange accents that anchor the icon family to the HvadMad brand. If a
 * single-colour glyph is needed for a tight space, use a unicode symbol or an
 * inline SVG instead of forcing a bitmap to be monochrome.
 *
 * Use cases:
 *   - Inline next to text in a Button: `<Icon name="action-pencil" size={20} />`
 *   - Standalone affordance: `<button><Icon name="action-trash" role="label" /></button>`
 *   - Decorative hero on an empty/error state: `<Icon name="status-warning" size={64} />`
 */
export function Icon({
  name,
  size = 24,
  role = "decorative",
  label,
  className = "",
}: IconProps) {
  const entry = ICON_CATALOG[name];
  const isDecorative = role === "decorative";
  const accessibleLabel = isDecorative ? "" : (label ?? entry.label);

  return (
    <Image
      src={entry.src}
      alt={accessibleLabel}
      width={size}
      height={size}
      aria-hidden={isDecorative || undefined}
      className={`inline-block select-none ${className}`}
      draggable={false}
    />
  );
}
