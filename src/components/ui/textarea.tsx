"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "w-full rounded-xl border border-soft-lavender/15 bg-off-white/[0.03] px-4 py-3 text-base text-off-white",
          "placeholder:text-soft-lavender/40 caret-electric-violet resize-none",
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
Textarea.displayName = "Textarea";
