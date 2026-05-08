"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "h-12 w-full rounded-xl border border-soft-lavender/15 bg-off-white/[0.03] px-4 text-base text-off-white",
          "placeholder:text-soft-lavender/40 caret-electric-violet",
          "transition-all duration-300 ease-out",
          "hover:border-soft-lavender/30 hover:bg-off-white/[0.05]",
          "focus:border-electric-violet/70 focus:bg-off-white/[0.06] focus:outline-none focus:ring-4 focus:ring-electric-violet/15",
          "disabled:cursor-not-allowed disabled:opacity-60",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
