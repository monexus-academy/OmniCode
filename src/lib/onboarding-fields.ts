export type OnboardingFieldType = "text" | "email" | "url" | "tel" | "number" | "textarea" | "select";

export type OnboardingField = {
  key: string;
  label: string;
  prompt: string;
  helper?: string;
  placeholder: string;
  type: OnboardingFieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "url" | "numeric";
};

export const ONBOARDING_FIELDS: OnboardingField[] = [
  {
    key: "name",
    label: "First name",
    prompt: "What's your first name?",
    helper: "We'll use this to personalize your experience.",
    placeholder: "e.g. Alex",
    type: "text",
    required: true,
    autoComplete: "given-name",
  },
  {
    key: "lastName",
    label: "Last name",
    prompt: "And your last name?",
    placeholder: "e.g. Rivera",
    type: "text",
    required: true,
    autoComplete: "family-name",
  },
  {
    key: "username",
    label: "Username",
    prompt: "Pick a username.",
    helper: "Lowercase letters, numbers, dots, dashes or underscores.",
    placeholder: "e.g. alex.rivera",
    type: "text",
    required: true,
    autoComplete: "username",
  },
  {
    key: "pronouns",
    label: "Pronouns",
    prompt: "Which pronouns do you use?",
    placeholder: "Select your pronouns",
    type: "select",
    options: [
      { value: "she/her", label: "She / Her" },
      { value: "he/him", label: "He / Him" },
      { value: "they/them", label: "They / Them" },
      { value: "she/they", label: "She / They" },
      { value: "he/they", label: "He / They" },
      { value: "other", label: "Other" },
      { value: "prefer-not-to-say", label: "Prefer not to say" },
    ],
  },
  {
    key: "age",
    label: "Age",
    prompt: "How old are you?",
    placeholder: "e.g. 28",
    type: "number",
    inputMode: "numeric",
    required: true,
  },
  {
    key: "phoneNumber",
    label: "Phone number",
    prompt: "What's the best phone number to reach you?",
    placeholder: "+1 555 123 4567",
    type: "tel",
    inputMode: "tel",
    autoComplete: "tel",
  },
  {
    key: "country",
    label: "Country",
    prompt: "Which country do you currently live in?",
    placeholder: "e.g. United States",
    type: "text",
    autoComplete: "country-name",
    required: true,
  },
  {
    key: "city",
    label: "City",
    prompt: "Which city are you based in?",
    placeholder: "e.g. San Francisco",
    type: "text",
    autoComplete: "address-level2",
    required: true,
  },
  {
    key: "placeofBirth",
    label: "Place of birth",
    prompt: "Where were you born?",
    placeholder: "City, Country",
    type: "text",
  },
  {
    key: "nationality",
    label: "Nationality",
    prompt: "What is your nationality?",
    placeholder: "e.g. Mexican",
    type: "text",
  },
  {
    key: "nativeLanguage",
    label: "Native language",
    prompt: "What is your native language?",
    placeholder: "e.g. Spanish",
    type: "text",
    required: true,
  },
  {
    key: "AdditionalLanguages",
    label: "Additional languages",
    prompt: "Which other languages do you speak?",
    helper: "Separate languages with commas.",
    placeholder: "e.g. English, Portuguese, French",
    type: "text",
  },
  {
    key: "education",
    label: "Education",
    prompt: "What's your highest level of education?",
    placeholder: "Select an option",
    type: "select",
    options: [
      { value: "high-school", label: "High School" },
      { value: "associate", label: "Associate Degree" },
      { value: "bachelor", label: "Bachelor's Degree" },
      { value: "master", label: "Master's Degree" },
      { value: "doctorate", label: "Doctorate / PhD" },
      { value: "self-taught", label: "Self-taught" },
      { value: "other", label: "Other" },
    ],
  },
  {
    key: "LinkedinUrl",
    label: "LinkedIn URL",
    prompt: "Share your LinkedIn profile.",
    placeholder: "https://linkedin.com/in/your-handle",
    type: "url",
    inputMode: "url",
    autoComplete: "url",
  },
  {
    key: "personalURL",
    label: "Personal website",
    prompt: "Have a personal site or portfolio?",
    helper: "Optional — leave blank if you'd rather skip.",
    placeholder: "https://yourdomain.com",
    type: "url",
    inputMode: "url",
  },
  {
    key: "purposeforTest",
    label: "Purpose for the test",
    prompt: "What brings you to Omnitest today?",
    helper: "A short sentence is perfect — we read every answer.",
    placeholder: "I'm here because…",
    type: "textarea",
    required: true,
  },
];
