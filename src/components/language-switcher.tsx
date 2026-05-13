"use client";

import { cn } from "@/lib/utils";
import { useLocale } from "@/locales/locale-context";
import { UI_STRINGS } from "@/locales/ui-strings";
import type { AppLocale } from "@/locales/types";

const LOCALES = ["en", "es"] as const satisfies readonly AppLocale[];

type LanguageSwitcherProps = {
  className?: string;
};

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const lang = UI_STRINGS[locale].language;

  return (
    <div
      role="group"
      aria-label={lang.aria}
      className={cn(
        "inline-flex overflow-hidden rounded-full border border-soft-lavender/20 bg-off-white/[0.04] p-0.5 backdrop-blur",
        className,
      )}
    >
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={cn(
            "min-w-[4.25rem] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors",
            locale === code
              ? "rounded-full bg-electric-violet/90 text-off-white shadow-sm"
              : "text-soft-lavender/70 hover:text-off-white",
          )}
        >
          {code === "en" ? lang.en : lang.es}
        </button>
      ))}
    </div>
  );
}
