"use client";

import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "./FocusRing";

type Padding = "none" | "sm" | "md" | "lg";

const PADDING: Record<Padding, string> = {
  none: "",
  sm: "p-3",
  md: "p-6",
  lg: "p-8",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: Padding;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { interactive = false, padding = "md", className, children, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-gray-100 bg-white shadow-sm transition-shadow duration-200",
        PADDING[padding],
        interactive ? "hover:shadow-md cursor-pointer" : "",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
