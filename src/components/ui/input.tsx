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
          "h-12 w-full rounded-xl border border-soft-lavender/25 bg-slate-indigo/55 px-4 text-base font-medium text-[#F8FAFC]",
          "shadow-inner shadow-black/20 placeholder:text-soft-lavender/55 caret-electric-violet",
          "transition-all duration-300 ease-out",
          "hover:border-soft-lavender/40 hover:bg-slate-indigo/65",
          "focus:border-electric-violet/80 focus:bg-slate-indigo/75 focus:outline-none focus:ring-4 focus:ring-electric-violet/25",
          "disabled:cursor-not-allowed disabled:opacity-60",
          "[color-scheme:dark]",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
