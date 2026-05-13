import type { AnswersMap } from "@/lib/onboarding-fields";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  INSTITUTION_TYPE_OPTIONS,
  ONBOARDING_FIELD_SEQUENCE,
  ROLE_LEVEL_OPTIONS,
  SPOKEN_LEVEL_OPTIONS,
  WORK_ARRANGEMENT_OPTIONS,
} from "@/lib/onboarding-fields";
import {
  COLLEGE_STATUS_LABEL_ES,
  COUNTRY_LABEL_ES,
  EMPLOYMENT_TYPE_LABEL_ES,
  GENDER_LABEL_ES,
  INDUSTRY_LABEL_ES,
  INSTITUTION_TYPE_LABEL_ES,
  OMNI_PURPOSE_LABEL_ES,
  PRONOUN_LABEL_ES,
  ROLE_LEVEL_LABEL_ES,
  SPOKEN_LEVEL_LABEL_ES,
  WORK_ARRANGEMENT_LABEL_ES,
} from "@/locales/choice-label-maps-es";

export const PROFILE_EDUCATION_STEP_KEYS = [
  "education_kindergarten",
  "education_elementary",
  "education_middleSchool",
  "education_highSchool",
  "education_college",
] as const;

const COLLEGE_STATUS_OPTS: readonly { value: string; label: string }[] = [
  { value: "currently-studying", label: "Currently studying" },
  { value: "finished", label: "Finished / graduated" },
];

function coerceToCanonicalSelectValue(
  raw: unknown,
  options: readonly { value: string; label: string }[],
  spanishLabelsByCanonicalValue?: Record<string, string>,
): string {
  if (typeof raw !== "string") return "";
  const t = raw.trim();
  if (!t) return "";
  const canonicalValues = new Set(options.map((o) => o.value));
  if (canonicalValues.has(t)) return t;

  const lower = t.toLowerCase();
  for (const o of options) {
    if (o.label.trim().toLowerCase() === lower) return o.value;
    const esLab = spanishLabelsByCanonicalValue?.[o.value]?.trim().toLowerCase();
    if (esLab === lower) return o.value;
  }
  return t;
}

/** Spanish-select field keys handled at the Firestore boundary (canonical values only). */
const SELECT_ES_MAP_BY_KEY: Record<
  string,
  Record<string, string> | undefined
> = {
  gender: GENDER_LABEL_ES,
  countryOfResidence: COUNTRY_LABEL_ES,
  pronouns: PRONOUN_LABEL_ES,
  omniPurpose: OMNI_PURPOSE_LABEL_ES,
};

type EducationLike = Record<string, unknown>;

function canonicalizeEducationAnswerJson(raw: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw ?? "{}") as unknown;
  } catch {
    return raw;
  }
  if (!parsed || typeof parsed !== "object") return JSON.stringify(parsed);

  const o = parsed as EducationLike;

  const entriesUnknown = o.entries;
  if (Array.isArray(entriesUnknown)) {
    for (const item of entriesUnknown) {
      if (!item || typeof item !== "object") continue;
      const e = item as Record<string, unknown>;
      if (typeof e.institutionType === "string") {
        e.institutionType = coerceToCanonicalSelectValue(
          e.institutionType,
          INSTITUTION_TYPE_OPTIONS,
          INSTITUTION_TYPE_LABEL_ES,
        );
      }
      if (typeof e.collegeStatus === "string") {
        e.collegeStatus = coerceToCanonicalSelectValue(
          e.collegeStatus,
          COLLEGE_STATUS_OPTS,
          COLLEGE_STATUS_LABEL_ES,
        );
      }
    }
  }

  return JSON.stringify(o);
}

function canonicalizeAdditionalLanguagesJson(raw: string): string {
  try {
    const parsed = JSON.parse(raw ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return raw;
    const next = parsed.map((item) => {
      if (!item || typeof item !== "object") return item;
      const row = item as Record<string, unknown>;
      if (typeof row.level === "string") {
        row.level = coerceToCanonicalSelectValue(
          row.level,
          SPOKEN_LEVEL_OPTIONS,
          SPOKEN_LEVEL_LABEL_ES,
        );
      }
      return row;
    });
    return JSON.stringify(next);
  } catch {
    return raw;
  }
}

function canonicalizeWorkHistoryJson(raw: string): string {
  try {
    const parsed = JSON.parse(raw ?? "{}") as unknown;
    if (!parsed || typeof parsed !== "object") return raw;

    const o = parsed as EducationLike;

    const entriesUnknown = o.entries;
    if (Array.isArray(entriesUnknown)) {
      for (const item of entriesUnknown) {
        if (!item || typeof item !== "object") continue;
        const e = item as Record<string, unknown>;
        if (typeof e.employmentType === "string") {
          e.employmentType = coerceToCanonicalSelectValue(
            e.employmentType,
            EMPLOYMENT_TYPE_OPTIONS,
            EMPLOYMENT_TYPE_LABEL_ES,
          );
        }
        if (typeof e.workArrangement === "string") {
          e.workArrangement = coerceToCanonicalSelectValue(
            e.workArrangement,
            WORK_ARRANGEMENT_OPTIONS,
            WORK_ARRANGEMENT_LABEL_ES,
          );
        }
        if (typeof e.industry === "string") {
          e.industry = coerceToCanonicalSelectValue(
            e.industry,
            INDUSTRY_OPTIONS,
            INDUSTRY_LABEL_ES,
          );
        }
        if (typeof e.roleLevel === "string") {
          e.roleLevel = coerceToCanonicalSelectValue(
            e.roleLevel,
            ROLE_LEVEL_OPTIONS,
            ROLE_LEVEL_LABEL_ES,
          );
        }
      }
    }
    return JSON.stringify(o);
  } catch {
    return raw;
  }
}

/**
 * Normalizes onboarding answers before writing to Firestore so enum-like fields
 * use canonical English **values** (slugs such as `full-time`), never localized labels.
 *
 * Plain-text responses (names, descriptions, URLs) pass through untouched.
 */
export function canonicalAnswersForFirestore(answers: AnswersMap): AnswersMap {
  const out: AnswersMap = { ...answers };

  const snap = answers;

  for (const field of ONBOARDING_FIELD_SEQUENCE) {
    if (field.type !== "select") continue;
    const key = field.key;
    const cur = out[key];
    if (cur === undefined) continue;

    const options = field.resolveOptions?.(snap) ?? field.options ?? [];
    const esMap = SELECT_ES_MAP_BY_KEY[key];
    const coerced = coerceToCanonicalSelectValue(cur, options, esMap);
    out[key] = coerced;
  }

  const rawLanguages = out.additionalLanguages;
  if (typeof rawLanguages === "string") {
    out.additionalLanguages = canonicalizeAdditionalLanguagesJson(rawLanguages);
  }

  const rawWork = out.workHistory;
  if (typeof rawWork === "string") {
    out.workHistory = canonicalizeWorkHistoryJson(rawWork);
  }

  for (const eduKey of PROFILE_EDUCATION_STEP_KEYS) {
    const v = out[eduKey];
    if (typeof v === "string") {
      out[eduKey] = canonicalizeEducationAnswerJson(v);
    }
  }

  return out;
}
