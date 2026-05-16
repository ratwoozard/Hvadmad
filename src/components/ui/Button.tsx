"use client";

import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn, FOCUS_RING } from "./FocusRing";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "vote-yes"
  | "vote-maybe"
  | "vote-no";

type Size = "sm" | "md" | "lg";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-brand-500 text-white shadow-md hover:bg-brand-600 active:bg-brand-700",
  secondary:
    "border-2 border-brand-500 bg-white text-brand-700 hover:bg-brand-50 active:bg-brand-100",
  ghost: "bg-transparent text-brand-700 hover:bg-brand-50 active:bg-brand-100",
  "vote-yes":
    "bg-vote-yes text-white shadow-lg hover:bg-green-600 active:bg-green-700",
  "vote-maybe":
    "bg-vote-maybe text-white shadow-lg hover:bg-amber-600 active:bg-amber-700",
  "vote-no":
    "bg-vote-no text-white shadow-lg hover:bg-red-600 active:bg-red-700",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-4 py-2 text-sm min-h-touch min-w-touch",
  md: "px-6 py-3 text-base min-h-touch min-w-touch",
  lg: "px-8 py-4 text-lg min-h-touch min-w-touch",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

type ButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
    as?: "button";
    type?: "button" | "submit" | "reset";
  };

type AnchorProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "type"> & {
    as: "a";
  };

export type Props = ButtonProps | AnchorProps;

const Spinner = () => (
  <svg
    className="h-4 w-4 animate-spin"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeOpacity="0.25"
    />
    <path
      d="M22 12a10 10 0 0 1-10 10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
    />
  </svg>
);

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, Props>(
  function Button(props, ref) {
    const {
      variant = "primary",
      size = "md",
      loading = false,
      leadingIcon,
      trailingIcon,
      fullWidth = false,
      children,
      className,
      ...rest
    } = props;

    const classes = cn(
      BASE,
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      FOCUS_RING,
      fullWidth ? "w-full" : "",
      className,
    );

    const inner = (
      <>
        {loading ? <Spinner /> : leadingIcon}
        {children}
        {!loading && trailingIcon}
      </>
    );

    const motionProps = {
      whileTap: { scale: 0.96 },
      transition: { duration: 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
    };

    if (props.as === "a") {
      const { as: _as, ...anchorRest } = rest as AnchorProps;
      return (
        <motion.a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={classes}
          aria-busy={loading || undefined}
          {...(motionProps as HTMLMotionProps<"a">)}
          {...anchorRest}
        >
          {inner}
        </motion.a>
      );
    }

    const { as: _as, type = "button", disabled, ...buttonRest } =
      rest as ButtonProps;
    return (
      <motion.button
        ref={ref as React.Ref<HTMLButtonElement>}
        type={type}
        className={classes}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...(motionProps as HTMLMotionProps<"button">)}
        {...buttonRest}
      >
        {inner}
      </motion.button>
    );
  },
);
