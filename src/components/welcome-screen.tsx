"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { AuthForm } from "@/components/auth-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useLocale } from "@/locales/locale-context";
import { UI_STRINGS } from "@/locales/ui-strings";

export function WelcomeScreen() {
  const { locale } = useLocale();
  const w = UI_STRINGS[locale].welcome;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="absolute right-6 top-6">
        <LanguageSwitcher />
      </div>
      <div className="grid w-full max-w-6xl items-center gap-14 lg:grid-cols-2 lg:gap-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="space-y-8 text-center lg:text-left"
        >
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-soft-lavender/20 bg-off-white/[0.04] px-4 py-1.5 backdrop-blur"
          >
            <Sparkles className="h-3.5 w-3.5 text-soft-lavender" />
            <span className="text-xs font-medium uppercase tracking-[0.22em] text-soft-lavender/90">
              {w.badge}
            </span>
          </motion.div>

          <div className="space-y-5">
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-balance text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4.25rem]"
            >
              <span className="block text-off-white/90">{w.titleLine1}</span>
              <span className="gradient-text block">{w.brand}</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.7 }}
              className="mx-auto max-w-xl text-balance text-lg text-soft-lavender/80 lg:mx-0"
            >
              {w.subtitle}
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="hidden flex-wrap items-center gap-x-6 gap-y-3 text-xs text-soft-lavender/70 lg:flex"
          >
            <Bullet>{w.bulletEncrypted}</Bullet>
            <Bullet>{w.bulletOneQ}</Bullet>
            <Bullet>{w.bulletAutosave}</Bullet>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center lg:justify-end"
        >
          <AuthForm />
        </motion.div>
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full bg-electric-violet/80 shadow-[0_0_12px_rgba(124,58,237,0.8)]" />
      {children}
    </span>
  );
}
