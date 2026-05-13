import {
  MEXICO_STATE_OPTIONS,
  RESIDENCE_COUNTRY_OPTIONS,
  US_STATE_OPTIONS,
} from "@/lib/geo-regions";

export type AnswersMap = Record<string, string>;

export type OnboardingFieldType =
  | "text"
  | "tel"
  | "url"
  | "birth-date"
  | "select"
  | "city"
  | "language-rows"
  | "profile-photo"
  | "education-level"
  | "work-history"
  | "legal-last-names";

export type OnboardingField = {
  key: string;
  /** Shown when the section changes so users know which part of the profile they are in */
  sectionTitle?: string;
  label: string;
  prompt: string;
  helper?: string;
  placeholder: string;
  type: OnboardingFieldType;
  required?: boolean;
  /** Hide step unless this returns true for current answers. */
  showWhen?: (answers: AnswersMap) => boolean;
  /** Static select options (when not using resolveOptions). */
  options?: { value: string; label: string }[];
  /** Dynamic select options (e.g. state list depends on country). */
  resolveOptions?: (answers: AnswersMap) => { value: string; label: string }[];
  allowSkip?: boolean;
  skipOptionLabel?: string;
  autoComplete?: string;
  inputMode?: "text" | "tel" | "url" | "numeric";
  /** When `education-level`: college collects status/year per institution. */
  educationMode?: "standard" | "college";
};

/** Proficiency levels for additional spoken languages (stored per row). */
export const SPOKEN_LEVEL_OPTIONS = [
  { value: "native", label: "Native / bilingual" },
  { value: "fluent", label: "Fluent" },
  { value: "professional", label: "Professional working" },
  { value: "conversational", label: "Conversational" },
  { value: "basic", label: "Basic" },
] as const;

export const INSTITUTION_TYPE_OPTIONS = [
  { value: "public", label: "Public school" },
  { value: "private", label: "Private school" },
  { value: "charter", label: "Charter / magnet" },
  { value: "international", label: "International / bilingual" },
  { value: "religious", label: "Religious / parochial" },
  { value: "homeschool", label: "Homeschooled" },
  { value: "technical", label: "Technical / vocational" },
  { value: "other", label: "Other" },
] as const;

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "freelance", label: "Freelance" },
  { value: "internship", label: "Internship" },
  { value: "temporary", label: "Temporary" },
  { value: "volunteer", label: "Volunteer" },
  { value: "apprenticeship", label: "Apprenticeship" },
] as const;

export const WORK_ARRANGEMENT_OPTIONS = [
  { value: "on-site", label: "On-site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
] as const;

export const INDUSTRY_OPTIONS = [
  { value: "technology", label: "Technology" },
  { value: "finance", label: "Finance" },
  { value: "education", label: "Education" },
  { value: "healthcare", label: "Healthcare" },
  { value: "retail", label: "Retail" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "government", label: "Government" },
  { value: "other", label: "Other" },
] as const;

export const ROLE_LEVEL_OPTIONS = [
  { value: "entry-level", label: "Entry-level" },
  { value: "associate", label: "Associate" },
  { value: "mid-level", label: "Mid-level" },
  { value: "senior", label: "Senior" },
  { value: "lead", label: "Lead" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
  { value: "executive", label: "Executive" },
  { value: "founder", label: "Founder" },
] as const;

/** Single-select purpose values surfaced to tailor OMNI insights. */
export const OMNI_PURPOSE_OPTIONS = [
  {
    value: "exploring-careers",
    label: "I'm exploring careers and want guidance",
  },
  {
    value: "job-application",
    label: "I'm preparing for a job application",
  },
  {
    value: "employer-requested",
    label: "My employer asked me to take this",
  },
  {
    value: "employer-evaluating",
    label: "I'm an employer evaluating a candidate",
  },
  {
    value: "curious",
    label: "I'm just curious about myself",
  },
] as const;

function needsUsMexicoState(answers: AnswersMap): boolean {
  const c = answers.countryOfResidence;
  return c === "mx" || c === "us";
}

/**
 * Full ordered definition list. Steps may be hidden per `showWhen`.
 */
export const ONBOARDING_FIELD_SEQUENCE: OnboardingField[] = [
  {
    key: "legalFirstName",
    sectionTitle: "Personal details",
    label: "Legal first name",
    prompt: "What's your legal first name?",
    helper: "We collect legal first, middle, and last name for identification.",
    placeholder: "e.g. Maria",
    type: "text",
    required: true,
    autoComplete: "given-name",
  },
  {
    key: "legalMiddleName",
    sectionTitle: "Personal details",
    label: "Legal middle name(s)",
    prompt: "Legal middle name(s), if any?",
    helper: "Leave blank if you don't use a middle name.",
    placeholder: "Optional — leave blank if none",
    type: "text",
    required: false,
    autoComplete: "additional-name",
  },
  {
    key: "legalLastName",
    sectionTitle: "Personal details",
    label: "Legal last name(s)",
    prompt: "What are your legal last name(s)?",
    helper:
      "If you use more than one surname on documents (for example maternal plus paternal), add each one. Your first surname goes in the primary field.",
    placeholder: "Primary legal last name",
    type: "legal-last-names",
    required: true,
    autoComplete: "family-name",
  },
  {
    key: "preferredDisplayName",
    sectionTitle: "Personal details",
    label: "Preferred / display name",
    prompt: "What should we call you day to day?",
    helper: "This is how your name will appear in your report.",
    placeholder: "e.g. Mari",
    type: "text",
    required: true,
    autoComplete: "nickname",
  },
  {
    key: "dateOfBirth",
    sectionTitle: "Personal details",
    label: "Date of birth",
    prompt: "What's your date of birth?",
    helper: "Pick month, day, and year — used for age-normed scoring.",
    placeholder: "",
    type: "birth-date",
    required: true,
  },
  {
    key: "gender",
    sectionTitle: "Personal details",
    label: "Gender",
    prompt: "How would you describe your gender?",
    helper: "Optional — choose what feels right, or skip.",
    placeholder: "Optional",
    type: "select",
    required: false,
    allowSkip: true,
    skipOptionLabel: "Prefer not to say / skip",
    options: [
      { value: "woman", label: "Woman" },
      { value: "man", label: "Man" },
      { value: "non-binary", label: "Non-binary" },
      { value: "prefer-not-to-say", label: "Prefer not to say" },
    ],
  },
  {
    key: "countryOfResidence",
    sectionTitle: "Personal details",
    label: "Country of residence",
    prompt: "Which country do you currently live in?",
    placeholder: "Choose a country",
    type: "select",
    required: true,
    options: [...RESIDENCE_COUNTRY_OPTIONS],
  },
  {
    key: "stateOfResidence",
    sectionTitle: "Personal details",
    label: "State / province",
    prompt: "Which state or province do you live in?",
    helper: "Shown for Mexico and the United States.",
    placeholder: "Select your state",
    type: "select",
    required: true,
    showWhen: needsUsMexicoState,
    resolveOptions: (a) =>
      a.countryOfResidence === "mx" ? MEXICO_STATE_OPTIONS : US_STATE_OPTIONS,
  },
  {
    key: "cityOfResidence",
    sectionTitle: "Personal details",
    label: "City of residence",
    prompt: "Which city do you live in?",
    helper:
      "Mexico & US: choose from cities in your selected state. Canada: type your city.",
    placeholder: "Select your city",
    type: "city",
    required: true,
    autoComplete: "address-level2",
  },
  {
    key: "primarySpokenLanguage",
    sectionTitle: "Personal details",
    label: "Primary spoken language",
    prompt: "What's your primary spoken language?",
    placeholder: "e.g. Spanish",
    type: "text",
    required: true,
    autoComplete: "language",
  },
  {
    key: "education_kindergarten",
    sectionTitle: "Education",
    label: "Kindergarten",
    prompt: "Kindergarten — where did you go, and what type of school was it?",
    helper:
      'Use \"Add another school\" if you attended more than one. Skip this entire step if you prefer.',
    placeholder: "",
    type: "education-level",
    required: true,
  },
  {
    key: "education_elementary",
    sectionTitle: "Education",
    label: "Elementary school",
    prompt: "Elementary school — school name and type?",
    helper:
      "Attended more than one elementary? Add each school. Skip if you don't remember.",
    placeholder: "",
    type: "education-level",
    required: true,
  },
  {
    key: "education_middleSchool",
    sectionTitle: "Education",
    label: "Middle / junior high",
    prompt: "Middle or junior high — school name and type?",
    helper:
      "Multiple schools at this level? Add each one. Skip if not applicable or you don't remember.",
    placeholder: "",
    type: "education-level",
    required: true,
  },
  {
    key: "education_highSchool",
    sectionTitle: "Education",
    label: "High school",
    prompt: "High school — school name and type?",
    helper:
      "Transferred schools? Add another row for each. Skip if you don't remember.",
    placeholder: "",
    type: "education-level",
    required: true,
  },
  {
    key: "education_college",
    sectionTitle: "Education",
    label: "College / university",
    prompt: "College or university — tell us about each institution.",
    helper:
      "Add each college separately. For every row: say if you're currently studying or finished (with graduation year when finished).",
    placeholder: "",
    type: "education-level",
    required: true,
    educationMode: "college",
  },
  {
    key: "workHistory",
    sectionTitle: "Work history",
    label: "Work experience",
    prompt: "Tell us about your work experience.",
    helper:
      "Add each role separately. You can skip this step if you have no paid or volunteer work history yet.",
    placeholder: "",
    type: "work-history",
    required: true,
  },
  {
    key: "additionalLanguages",
    sectionTitle: "Profile & contact",
    label: "Additional spoken languages",
    prompt: "Any other languages you speak?",
    helper:
      "Add each language with its spoken level. Leave empty if this doesn't apply — that's OK.",
    placeholder: "",
    type: "language-rows",
    required: false,
  },
  {
    key: "phoneNumber",
    sectionTitle: "Profile & contact",
    label: "Phone number",
    prompt: "What's your phone number?",
    helper: "Optional — we rarely reach out by phone.",
    placeholder: "+52 55 1234 5678",
    type: "tel",
    required: false,
    inputMode: "tel",
    autoComplete: "tel",
  },
  {
    key: "placeOfBirthCity",
    sectionTitle: "Profile & contact",
    label: "Place of birth — city",
    prompt: "What city were you born in?",
    helper: "Optional demographic context.",
    placeholder: "e.g. Monterrey",
    type: "text",
    required: false,
  },
  {
    key: "placeOfBirthCountry",
    sectionTitle: "Profile & contact",
    label: "Place of birth — country",
    prompt: "What country were you born in?",
    placeholder: "e.g. Mexico",
    type: "text",
    required: false,
    autoComplete: "country-name",
  },
  {
    key: "nationalityCitizenship",
    sectionTitle: "Profile & contact",
    label: "Nationality / citizenship",
    prompt: "What's your nationality or citizenship?",
    placeholder: "e.g. Mexican",
    type: "text",
    required: false,
  },
  {
    key: "secondaryNationality",
    sectionTitle: "Profile & contact",
    label: "Secondary nationality",
    prompt: "Do you hold another nationality?",
    helper: "Optional — if you're dual national, add the other one here.",
    placeholder: "e.g. United States",
    type: "text",
    required: false,
  },
  {
    key: "pronouns",
    sectionTitle: "Profile & contact",
    label: "Pronouns",
    prompt: "Which pronouns should we use?",
    placeholder: "Optional",
    type: "select",
    required: false,
    allowSkip: true,
    skipOptionLabel: "Skip",
    options: [
      { value: "she/her", label: "She / her" },
      { value: "he/him", label: "He / him" },
      { value: "they/them", label: "They / them" },
      { value: "she/they", label: "She / they" },
      { value: "he/they", label: "He / they" },
      { value: "other", label: "Other / ask me" },
      { value: "prefer-not-to-say", label: "Prefer not to say" },
    ],
  },
  {
    key: "linkedinUrl",
    sectionTitle: "Profile & contact",
    label: "LinkedIn URL",
    prompt: "Want to share your LinkedIn profile?",
    placeholder: "https://linkedin.com/in/you",
    type: "url",
    required: false,
    inputMode: "url",
    autoComplete: "url",
  },
  {
    key: "personalWebsiteUrl",
    sectionTitle: "Profile & contact",
    label: "Personal website / portfolio",
    prompt: "Personal site or portfolio URL?",
    placeholder: "https://…",
    type: "url",
    required: false,
    inputMode: "url",
    autoComplete: "url",
  },
  {
    key: "profilePhotoUrl",
    sectionTitle: "Profile & contact",
    label: "Profile photo",
    prompt: "Add a profile photo?",
    helper: "Optional — JPG or PNG, up to ~4 MB. You can skip.",
    placeholder: "",
    type: "profile-photo",
    required: false,
  },
  {
    key: "omniPurpose",
    sectionTitle: "About OMNI",
    label: "Purpose of taking OMNI",
    prompt: "What's your main reason for taking OMNI?",
    helper: "This affects which insights we surface for you.",
    placeholder: "Choose one",
    type: "select",
    required: true,
    options: [...OMNI_PURPOSE_OPTIONS],
  },
];

export function getVisibleOnboardingFields(answers: AnswersMap): OnboardingField[] {
  return ONBOARDING_FIELD_SEQUENCE.filter(
    (f) => !f.showWhen || f.showWhen(answers),
  );
}

/** @deprecated Use ONBOARDING_FIELD_SEQUENCE + getVisibleOnboardingFields */
export const ONBOARDING_FIELDS = ONBOARDING_FIELD_SEQUENCE;
