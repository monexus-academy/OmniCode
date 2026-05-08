"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, LogOut, PlayCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

type StartScreenProps = {
  onStart: () => void;
};

export function StartScreen({ onStart }: StartScreenProps) {
  const { user, signOut } = useAuth();
  const [pulsed, setPulsed] = useState(false);

  const handleStart = useCallback(async () => {
    setPulsed(true);
    try {
      const el = document.documentElement;
      if (
        !document.fullscreenElement &&
        typeof el.requestFullscreen === "function"
      ) {
        await el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
      }
    } catch {
      // fullscreen may be blocked; continue regardless
    }
    setTimeout(() => onStart(), 150);
  }, [onStart]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        void handleStart();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleStart]);

  const greeting = (user?.email ?? "").split("@")[0] || "there";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16"
    >
      <div className="absolute right-6 top-6">
        <button
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 rounded-full border border-soft-lavender/15 bg-off-white/[0.04] px-4 py-2 text-xs uppercase tracking-[0.2em] text-soft-lavender/80 backdrop-blur transition-all hover:border-soft-lavender/35 hover:text-off-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>

      <div className="flex w-full max-w-3xl flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-soft-lavender/20 bg-off-white/[0.03] px-4 py-1.5 text-xs font-medium uppercase tracking-[0.28em] text-soft-lavender/90"
        >
          You're authenticated
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="font-display text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl"
        >
          <span className="block text-off-white/85">Hello,</span>
          <span className="gradient-text block capitalize">{greeting}.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-6 max-w-xl text-balance text-base text-soft-lavender/80 sm:text-lg"
        >
          When you're ready, hit <Kbd>Enter</Kbd> or press start. We'll move
          into focus mode and walk through a short questionnaire — one question
          at a time.
        </motion.p>

        <AnimatePresence>
          <motion.div
            key="start-cta"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.7 }}
            className="mt-12 flex flex-col items-center gap-5"
          >
            <motion.div
              animate={pulsed ? { scale: [1, 1.04, 1] } : {}}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <span className="absolute inset-0 -z-10 animate-pulse rounded-2xl bg-electric-violet/30 blur-2xl" />
              <Button
                onClick={() => void handleStart()}
                size="xl"
                className="rounded-2xl px-14 text-lg font-semibold tracking-tight"
              >
                <PlayCircle className="h-6 w-6" />
                <span>Start</span>
              </Button>
            </motion.div>

            <p className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-soft-lavender/60">
              <span>Or press</span>
              <Kbd>
                <CornerDownLeft className="h-3 w-3" /> Enter
              </Kbd>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center gap-1 rounded-md border border-soft-lavender/25 bg-off-white/[0.05] px-2 py-0.5 font-sans text-[11px] font-medium tracking-wider text-soft-lavender shadow-[inset_0_-1px_0_rgba(196,181,253,0.2)]">
      {children}
    </kbd>
  );
}
