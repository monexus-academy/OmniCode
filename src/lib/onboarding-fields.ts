export type OnboardingFieldType =
  | "text"
  | "tel"
  | "url"
  | "date"
  | "select"
  | "language-rows"
  | "profile-photo";

export type OnboardingField = {
  key: string;
  label: string;
  prompt: string;
  helper?: string;
  placeholder: string;
  type: OnboardingFieldType;
  required?: boolean;
  /** For selects: include an explicit empty option (optional fields). */
  allowSkip?: boolean;
  skipOptionLabel?: string;
  options?: { value: string; label: string }[];
  autoComplete?: string;
  inputMode?: "text" | "tel" | "url" | "numeric";
};

/** Proficiency levels for additional spoken languages (stored per row). */
export const SPOKEN_LEVEL_OPTIONS = [
  { value: "native", label: "Native / bilingual" },
  { value: "fluent", label: "Fluent" },
  { value: "professional", label: "Professional working" },
  { value: "conversational", label: "Conversational" },
  { value: "basic", label: "Basic" },
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

/**
 * Ordered flow: required demographic/context first (excluding email — captured at registration),
 * then optional contact/links/photo, then purpose-of-test (single-select).
 */
export const ONBOARDING_FIELDS: OnboardingField[] = [
  {
    key: "legalFirstName",
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
    label: "Legal last name",
    prompt: "What's your legal last name?",
    placeholder: "e.g. Vasquez",
    type: "text",
    required: true,
    autoComplete: "family-name",
  },
  {
    key: "preferredDisplayName",
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
    label: "Date of birth",
    prompt: "What's your date of birth?",
    helper: "Used for age-normed scoring. Stored securely.",
    placeholder: "",
    type: "date",
    required: true,
  },
  {
    key: "gender",
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
    label: "Country of residence",
    prompt: "Which country do you currently live in?",
    placeholder: "e.g. Mexico",
    type: "text",
    required: true,
    autoComplete: "country-name",
  },
  {
    key: "cityOfResidence",
    label: "City of residence",
    prompt: "Which city do you live in?",
    placeholder: "e.g. Guadalajara",
    type: "text",
    required: true,
    autoComplete: "address-level2",
  },
  {
    key: "primarySpokenLanguage",
    label: "Primary spoken language",
    prompt: "What's your primary spoken language?",
    placeholder: "e.g. Spanish",
    type: "text",
    required: true,
    autoComplete: "language",
  },
  {
    key: "additionalLanguages",
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
    label: "Place of birth — city",
    prompt: "What city were you born in?",
    helper: "Optional demographic context.",
    placeholder: "e.g. Monterrey",
    type: "text",
    required: false,
  },
  {
    key: "placeOfBirthCountry",
    label: "Place of birth — country",
    prompt: "What country were you born in?",
    placeholder: "e.g. Mexico",
    type: "text",
    required: false,
    autoComplete: "country-name",
  },
  {
    key: "nationalityCitizenship",
    label: "Nationality / citizenship",
    prompt: "What's your nationality or citizenship?",
    placeholder: "e.g. Mexican",
    type: "text",
    required: false,
  },
  {
    key: "secondaryNationality",
    label: "Secondary nationality",
    prompt: "Do you hold another nationality?",
    helper: "Optional — if you're dual national, add the other one here.",
    placeholder: "e.g. United States",
    type: "text",
    required: false,
  },
  {
    key: "pronouns",
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
    label: "Profile photo",
    prompt: "Add a profile photo?",
    helper: "Optional — JPG or PNG, up to ~4 MB. You can skip.",
    placeholder: "",
    type: "profile-photo",
    required: false,
  },
  {
    key: "omniPurpose",
    label: "Purpose of taking OMNI",
    prompt: "What's your main reason for taking OMNI?",
    helper: "This affects which insights we surface for you.",
    placeholder: "Choose one",
    type: "select",
    required: true,
    options: [...OMNI_PURPOSE_OPTIONS],
  },
];
