export const APP_LOCALES = ["en", "es"] as const;
export type AppLocale = (typeof APP_LOCALES)[number];

export const LOCALE_STORAGE_KEY = "omnitest.locale";

export function isAppLocale(value: string | undefined | null): value is AppLocale {
  return value === "en" || value === "es";
}
