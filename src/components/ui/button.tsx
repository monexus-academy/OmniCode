"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium tracking-tight transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-violet/70 focus-visible:ring-offset-2 focus-visible:ring-offset-midnight-navy disabled:pointer-events-none disabled:opacity-60 cursor-pointer select-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "relative overflow-hidden bg-gradient-to-br from-electric-violet via-electric-violet to-[#9F7AFB] text-off-white shadow-[0_18px_45px_-15px_rgba(124,58,237,0.7)] hover:shadow-[0_25px_60px_-15px_rgba(124,58,237,0.85)] hover:-translate-y-[1px] active:translate-y-0 active:shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)]",
        ghost:
          "bg-transparent text-soft-lavender hover:bg-soft-lavender/10 hover:text-off-white",
        outline:
          "border border-soft-lavender/20 bg-off-white/[0.02] text-off-white hover:border-soft-lavender/40 hover:bg-off-white/[0.05]",
        subtle:
          "bg-off-white/[0.04] text-off-white hover:bg-off-white/[0.08] border border-transparent hover:border-soft-lavender/20",
      },
      size: {
        sm: "h-9 px-4",
        md: "h-11 px-6",
        lg: "h-14 px-8 text-base",
        xl: "h-16 px-12 text-base",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
