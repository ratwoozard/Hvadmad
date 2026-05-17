"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn, FOCUS_RING } from "./FocusRing";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hideLabel?: boolean;
  error?: string;
  hint?: string;
  leadingIcon?: ReactNode;
  trailingElement?: ReactNode;
  fullWidth?: boolean;
}

const BASE_WRAPPER = "relative flex items-center";
const BASE_INPUT =
  "w-full rounded-xl border-2 bg-white px-4 py-3 text-base text-gray-900 transition-colors duration-150 placeholder:text-gray-400 disabled:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed";

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hideLabel = false,
    error,
    hint,
    leadingIcon,
    trailingElement,
    fullWidth = true,
    className,
    id: providedId,
    "aria-describedby": providedDescribedBy,
    ...rest
  },
  ref,
) {
  const autoId = useId();
  const id = providedId ?? `input-${autoId}`;
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint && !error ? `${id}-hint` : undefined;
  const describedBy =
    [providedDescribedBy, errorId, hintId].filter(Boolean).join(" ") ||
    undefined;

  const borderClasses = error
    ? "border-red-500 focus:border-red-500"
    : "border-gray-200 hover:border-gray-300 focus:border-brand-500";

  const ringClasses = error
    ? "focus-visible:ring-2 focus-visible:ring-red-200"
    : FOCUS_RING.replace("focus-visible:ring-brand-300", "focus-visible:ring-brand-200");

  const paddingClasses = cn(leadingIcon ? "pl-10" : "", trailingElement ? "pr-10" : "");

  return (
    <div className={cn(fullWidth ? "w-full" : "", className)}>
      {label && (
        <label
          htmlFor={id}
          className={cn(
            "mb-2 block text-sm font-medium text-gray-700",
            hideLabel ? "sr-only" : "",
          )}
        >
          {label}
        </label>
      )}

      <div className={BASE_WRAPPER}>
        {leadingIcon && (
          <span
            className="pointer-events-none absolute left-3 inline-flex text-gray-400"
            aria-hidden="true"
          >
            {leadingIcon}
          </span>
        )}

        <input
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(BASE_INPUT, borderClasses, ringClasses, paddingClasses)}
          {...rest}
        />

        {trailingElement && (
          <span className="absolute right-3 inline-flex items-center">
            {trailingElement}
          </span>
        )}
      </div>

      {error ? (
        <p id={errorId} className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1 text-sm text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
