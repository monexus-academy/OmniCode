import type { AnswersMap, OnboardingField } from "@/lib/onboarding-fields";
import {
  EMPLOYMENT_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  INSTITUTION_TYPE_OPTIONS,
  ROLE_LEVEL_OPTIONS,
  SPOKEN_LEVEL_OPTIONS,
  WORK_ARRANGEMENT_OPTIONS,
  getVisibleOnboardingFields,
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
import { FIELD_COPY_ES } from "@/locales/field-copy-es";
import type { AppLocale } from "@/locales/types";

const COLLEGE_STATUS_OPTIONS = [
  { value: "currently-studying", label: "Currently studying" },
  { value: "finished", label: "Finished / graduated" },
];

function relabelOpts(
  options: { value: string; label: string }[] | undefined,
  mapEs: Record<string, string>,
  locale: AppLocale,
): { value: string; label: string }[] | undefined {
  if (!options || locale === "en") return options;
  return options.map((o) => ({
    value: o.value,
    label: mapEs[o.value] ?? o.label,
  }));
}

function localizeInnerField(field: OnboardingField, locale: AppLocale): OnboardingField {
  if (locale === "en") return field;

  const patch = FIELD_COPY_ES[field.key] ?? {};

  let next: OnboardingField = {
    ...field,
    ...patch,
  };

  if (field.key === "countryOfResidence" && field.options) {
    next = {
      ...next,
      options: field.options.map((o) => ({
        ...o,
        label: COUNTRY_LABEL_ES[o.value] ?? o.label,
      })),
    };
  }

  if (field.key === "gender" && field.options) {
    next = { ...next, options: relabelOpts(field.options, GENDER_LABEL_ES, locale) };
  }

  if (field.key === "pronouns" && field.options) {
    next = { ...next, options: relabelOpts(field.options, PRONOUN_LABEL_ES, locale) };
  }

  if (field.key === "omniPurpose" && field.options) {
    next = { ...next, options: relabelOpts(field.options, OMNI_PURPOSE_LABEL_ES, locale) };
  }

  return next;
}

/**
 * Builds the visible onboarding step list with labels/prompts for the chosen UI language.
 */
export function getLocalizedVisibleFields(
  answers: AnswersMap,
  locale: AppLocale,
): OnboardingField[] {
  const base = getVisibleOnboardingFields(answers);
  return base.map((f) => localizeInnerField(f, locale));
}

export type QuestionnaireLexicon = {
  locale: AppLocale;
  spokenLevelOpts: { value: string; label: string }[];
  institutionOpts: { value: string; label: string }[];
  collegeStatusOpts: { value: string; label: string }[];
  employmentOpts: { value: string; label: string }[];
  workArrangementOpts: { value: string; label: string }[];
  industryOpts: { value: string; label: string }[];
  roleLevelOpts: { value: string; label: string }[];
  yesLabel: string;
  noLabel: string;
};

export function getQuestionnaireLexicon(locale: AppLocale): QuestionnaireLexicon {
  if (locale === "en") {
    return {
      locale,
      spokenLevelOpts: [...SPOKEN_LEVEL_OPTIONS],
      institutionOpts: [...INSTITUTION_TYPE_OPTIONS],
      collegeStatusOpts: [...COLLEGE_STATUS_OPTIONS],
      employmentOpts: [...EMPLOYMENT_TYPE_OPTIONS],
      workArrangementOpts: [...WORK_ARRANGEMENT_OPTIONS],
      industryOpts: [...INDUSTRY_OPTIONS],
      roleLevelOpts: [...ROLE_LEVEL_OPTIONS],
      yesLabel: "Yes",
      noLabel: "No",
    };
  }

  return {
    locale,
    spokenLevelOpts: SPOKEN_LEVEL_OPTIONS.map((o) => ({
      ...o,
      label: SPOKEN_LEVEL_LABEL_ES[o.value] ?? o.label,
    })),
    institutionOpts: INSTITUTION_TYPE_OPTIONS.map((o) => ({
      ...o,
      label: INSTITUTION_TYPE_LABEL_ES[o.value] ?? o.label,
    })),
    collegeStatusOpts: COLLEGE_STATUS_OPTIONS.map((o) => ({
      ...o,
      label: COLLEGE_STATUS_LABEL_ES[o.value] ?? o.label,
    })),
    employmentOpts: EMPLOYMENT_TYPE_OPTIONS.map((o) => ({
      ...o,
      label: EMPLOYMENT_TYPE_LABEL_ES[o.value] ?? o.label,
    })),
    workArrangementOpts: WORK_ARRANGEMENT_OPTIONS.map((o) => ({
      ...o,
      label: WORK_ARRANGEMENT_LABEL_ES[o.value] ?? o.label,
    })),
    industryOpts: INDUSTRY_OPTIONS.map((o) => ({
      ...o,
      label: INDUSTRY_LABEL_ES[o.value] ?? o.label,
    })),
    roleLevelOpts: ROLE_LEVEL_OPTIONS.map((o) => ({
      ...o,
      label: ROLE_LEVEL_LABEL_ES[o.value] ?? o.label,
    })),
    yesLabel: "Sí",
    noLabel: "No",
  };
}
