import { City } from "country-state-city";

import type { AnswersMap } from "@/lib/onboarding-fields";

/**
 * Maps app slug keys from {@link geo-regions} to ISO 3166-2 codes used by country-state-city.
 */
export const MEXICO_SLUG_TO_ISO: Record<string, string> = {
  aguascalientes: "AGU",
  "baja-california": "BCN",
  "baja-california-sur": "BCS",
  campeche: "CAM",
  chiapas: "CHP",
  chihuahua: "CHH",
  cdmx: "CDMX",
  coahuila: "COA",
  colima: "COL",
  durango: "DUR",
  guanajuato: "GUA",
  guerrero: "GRO",
  hidalgo: "HID",
  jalisco: "JAL",
  mexico: "MEX",
  michoacan: "MIC",
  morelos: "MOR",
  nayarit: "NAY",
  "nuevo-leon": "NLE",
  oaxaca: "OAX",
  puebla: "PUE",
  queretaro: "QUE",
  "quintana-roo": "ROO",
  "san-luis-potosi": "SLP",
  sinaloa: "SIN",
  sonora: "SON",
  tabasco: "TAB",
  tamaulipas: "TAM",
  tlaxcala: "TLA",
  veracruz: "VER",
  yucatan: "YUC",
  zacatecas: "ZAC",
};

export type CityFieldMode =
  | { kind: "select"; options: { value: string; label: string }[] }
  | { kind: "text"; helper?: string };

/**
 * Mexico / US: dropdown sourced from country-state-city for the selected state.
 * Canada: free-text city (no state step).
 */
export function getCityFieldMode(answers: AnswersMap): CityFieldMode {
  const country = answers.countryOfResidence;

  if (country === "ca") {
    return {
      kind: "text",
      helper: "Type your city or town.",
    };
  }

  const state = answers.stateOfResidence;

  if ((country === "mx" || country === "us") && state) {
    let iso = "";

    if (country === "mx") {
      iso = MEXICO_SLUG_TO_ISO[state] ?? "";
    } else {
      iso = state.toUpperCase();
    }

    if (!iso) {
      return { kind: "text", helper: "Could not load cities for this state." };
    }

    const cc = country === "mx" ? "MX" : "US";
    const rows = City.getCitiesOfState(cc, iso);
    const options = [...rows]
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      )
      .map((c) => ({
        value: c.name,
        label: c.name,
      }));

    return {
      kind: "select",
      options,
    };
  }

  return {
    kind: "text",
    helper: "Type your city.",
  };
}
