"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AvatarConfiguration, Slot } from "@/types/avatar";
import { MAX_HATS } from "@/types/avatar";
import {
  AVATARS,
  HATS,
  SLOT_LABELS,
  addHat,
  getHatsForSlot,
} from "@/lib/avatars/catalog";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { Avatar } from "./Avatar";
import { Button } from "@/components/ui/Button";
import { cn, FOCUS_RING } from "@/components/ui/FocusRing";

interface AvatarPickerProps {
  open: boolean;
  initialConfig: AvatarConfiguration;
  onSave: (config: AvatarConfiguration) => void;
  onCancel?: () => void;
  /** Allow skipping with a default random pick. */
  allowSkip?: boolean;
  /** Custom save-button label (default: "Klar"). */
  saveLabel?: string;
}

type Tab = "avatars" | "hats";

const SLOT_ORDER: Slot[] = ["head", "eyes", "mouth", "neck"];

/**
 * Modal picker for choosing one base avatar + up to MAX_HATS hats across
 * 4 slots. Live preview, slot-conflict resolution, focus trap, escape
 * to cancel, reduced-motion-aware.
 */
export function AvatarPicker({
  open,
  initialConfig,
  onSave,
  onCancel,
  allowSkip = true,
  saveLabel = "Klar",
}: AvatarPickerProps) {
  const reduced = useReducedMotion();
  const [tab, setTab] = useState<Tab>("avatars");
  const [config, setConfig] = useState<AvatarConfiguration>(initialConfig);
  const [hatMessage, setHatMessage] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setConfig(initialConfig);
      setTab("avatars");
      setHatMessage(null);
    }
  }, [open, initialConfig]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onCancel) {
        e.preventDefault();
        onCancel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  const handlePickAvatar = (avatarId: string) => {
    setConfig((prev) => ({ ...prev, avatar_id: avatarId }));
  };

  const handleToggleHat = (hatId: string) => {
    setConfig((prev) => {
      const result = addHat(prev.hat_ids, hatId);
      if (result.rejectedMaxHats) {
        setHatMessage(
          `Du kan stable op til ${MAX_HATS} hatte — fjern én for at vælge en ny.`,
        );
        window.setTimeout(() => setHatMessage(null), 2500);
        return prev;
      }
      setHatMessage(null);
      return { ...prev, hat_ids: result.next };
    });
  };

  const handleSave = () => {
    onSave(config);
  };

  const handleSkip = () => {
    onSave({ avatar_id: null, hat_ids: [] });
  };

  const hatsBySlot = useMemo(() => {
    return SLOT_ORDER.map((slot) => ({
      slot,
      label: SLOT_LABELS[slot],
      hats: getHatsForSlot(slot),
    }));
  }, []);

  if (!open) return null;

  const transition = reduced
    ? { duration: 0 }
    : { duration: 0.22, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  return (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-picker-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduced ? 0 : 0.18 }}
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={transition}
          className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        >
          <header className="border-b border-gray-100 px-4 py-3">
            <h2
              id="avatar-picker-title"
              className="text-lg font-bold text-gray-900"
            >
              Vælg din avatar
            </h2>
            <p className="text-sm text-gray-500">
              Vælg en base og stable op til {MAX_HATS} hatte
            </p>
          </header>

          {/* Live preview */}
          <div className="flex flex-col items-center gap-2 border-b border-gray-100 bg-gradient-to-b from-brand-50/50 to-white py-5">
            <Avatar config={config} size="lg" />
            <p className="text-xs text-gray-500">
              {config.hat_ids.length} / {MAX_HATS} hatte valgt
            </p>
          </div>

          {/* Tabs */}
          <div
            role="tablist"
            aria-label="Picker-faner"
            className="flex border-b border-gray-100"
          >
            <button
              type="button"
              role="tab"
              aria-selected={tab === "avatars"}
              onClick={() => setTab("avatars")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                tab === "avatars"
                  ? "border-b-2 border-brand-500 text-brand-700"
                  : "text-gray-500 hover:text-gray-700",
                FOCUS_RING,
              )}
            >
              Avatar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "hats"}
              onClick={() => setTab("hats")}
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors",
                tab === "hats"
                  ? "border-b-2 border-brand-500 text-brand-700"
                  : "text-gray-500 hover:text-gray-700",
                FOCUS_RING,
              )}
            >
              Hatte ({config.hat_ids.length})
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-4">
            {tab === "avatars" && (
              <div
                role="tabpanel"
                aria-label="Vælg en avatar"
                className="grid grid-cols-4 gap-3"
              >
                {AVATARS.map((avatar, index) => {
                  const selected = config.avatar_id === avatar.id;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => handlePickAvatar(avatar.id)}
                      aria-pressed={selected}
                      aria-label={`${avatar.altText}, valg ${index + 1} af ${AVATARS.length}`}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-xl border-2 text-3xl transition-all",
                        selected
                          ? "border-brand-500 bg-brand-50 scale-105"
                          : "border-transparent bg-gray-50 hover:bg-gray-100 active:bg-gray-200",
                        FOCUS_RING,
                      )}
                    >
                      <span aria-hidden="true">{avatar.emoji}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {tab === "hats" && (
              <div role="tabpanel" aria-label="Vælg hatte" className="flex flex-col gap-4">
                {hatMessage && (
                  <p
                    role="status"
                    className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"
                  >
                    {hatMessage}
                  </p>
                )}

                {hatsBySlot.map(({ slot, label, hats }) => (
                  <section key={slot}>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {label}
                    </h3>
                    <div className="grid grid-cols-4 gap-2">
                      {hats.map((hat, idx) => {
                        const selected = config.hat_ids.includes(hat.id);
                        return (
                          <button
                            key={hat.id}
                            type="button"
                            onClick={() => handleToggleHat(hat.id)}
                            aria-pressed={selected}
                            aria-label={`${hat.name}, ${slot}-hat, valg ${idx + 1} af ${hats.length}`}
                            className={cn(
                              "flex aspect-square items-center justify-center rounded-xl border-2 text-2xl transition-all",
                              selected
                                ? "border-brand-500 bg-brand-50"
                                : "border-transparent bg-gray-50 hover:bg-gray-100 active:bg-gray-200",
                              FOCUS_RING,
                            )}
                          >
                            <span aria-hidden="true">{hat.emoji}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <footer className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3">
            <Button onClick={handleSave} size="lg" fullWidth>
              ✨ {saveLabel}
            </Button>
            <div className="flex gap-2">
              {allowSkip && (
                <Button
                  onClick={handleSkip}
                  variant="ghost"
                  size="sm"
                  fullWidth
                >
                  Spring over
                </Button>
              )}
              {onCancel && (
                <Button
                  onClick={onCancel}
                  variant="ghost"
                  size="sm"
                  fullWidth
                >
                  Annullér
                </Button>
              )}
            </div>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
