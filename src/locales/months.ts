import type { AppLocale } from "@/locales/types";

/** Month index 1–12 → label for select UIs */
export function getMonthChoices(locale: AppLocale): { value: string; label: string }[] {
  const labelsEn = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ] as const;
  const labelsEs = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ] as const;
  const ls = locale === "es" ? labelsEs : labelsEn;
  return ls.map((label, i) => ({ value: String(i + 1), label }));
}
