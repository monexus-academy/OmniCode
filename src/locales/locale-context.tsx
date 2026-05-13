"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { AppLocale } from "@/locales/types";
import { LOCALE_STORAGE_KEY, isAppLocale } from "@/locales/types";

type LocaleCtx = {
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
};

const LocaleContext = createContext<LocaleCtx | null>(null);

function readStoredLocale(): AppLocale {
  if (typeof window === "undefined") return "en";
  try {
    const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isAppLocale(raw) ? raw : "en";
  } catch {
    return "en";
  }
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => readStoredLocale());

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale === "es" ? "es" : "en";
  }, [locale]);

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
