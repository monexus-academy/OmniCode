import type { AppLocale } from "@/locales/types";

/** Chrome copy for start, welcome, questionnaire shell (not onboarding field definitions). */
export type UIShellStrings = {
  language: { aria: string; en: string; es: string };
  start: {
    signOut: string;
    authenticated: string;
    hello: string;
    introLead: string;
    introTrail: string;
    startCta: string;
    orPress: string;
  };
  welcome: {
    badge: string;
    titleLine1: string;
    brand: string;
    subtitle: string;
    bulletEncrypted: string;
    bulletOneQ: string;
    bulletAutosave: string;
  };
  questionnaire: {
    brand: string;
    questionOrdinal: string;
    skipEducationHint: string;
    skipWorkHint: string;
    optionalHint: string;
    requiredHint: string;
    back: string;
    next: string;
    submit: string;
    pressEnter: string;
    pressEnterContinue: string;
    completedHeading: string;
    completedLine1NoEmail: string;
    completedLine1BeforeEmail: string;
    completedLine1AfterEmail: string;
    completedLine2: string;
  };
};

export const UI_STRINGS: Record<AppLocale, UIShellStrings> = {
  en: {
    language: { aria: "Language", en: "English", es: "Español" },
    start: {
      signOut: "Sign out",
      authenticated: "You're authenticated",
      hello: "Hello,",
      introLead: "When you're ready, hit ",
      introTrail:
        " or press start. We'll move into focus mode and walk through a short questionnaire — one question at a time.",
      startCta: "Start",
      orPress: "Or press",
    },
    welcome: {
      badge: "Immersive testing experience",
      titleLine1: "Welcome to the",
      brand: "Omnitest",
      subtitle:
        "A focused, distraction-free way to be assessed. Sign in or create an account to begin a session crafted around your pace.",
      bulletEncrypted: "Encrypted session",
      bulletOneQ: "One question at a time",
      bulletAutosave: "Auto-saved progress",
    },
    questionnaire: {
      brand: "Omnitest",
      questionOrdinal: "Question",
      skipEducationHint: " · skip if unsure",
      skipWorkHint: " · skip if not applicable",
      optionalHint: " · optional",
      requiredHint: "",
      back: "Back",
      next: "Next",
      submit: "Submit",
      pressEnter: "Press",
      pressEnterContinue: "to continue",
      completedHeading: "All set.",
      completedLine1NoEmail: "Thanks for completing your profile.",
      completedLine1BeforeEmail: "Thanks for completing your profile, ",
      completedLine1AfterEmail: ".",
      completedLine2:
        "Your responses have been recorded — your Omnitest journey begins now.",
    },
  },
  es: {
    language: { aria: "Idioma", en: "English", es: "Español" },
    start: {
      signOut: "Cerrar sesión",
      authenticated: "Has iniciado sesión",
      hello: "Hola,",
      introLead: "Cuando estés listo, pulsa ",
      introTrail:
        " o el botón empezar. Pasaremos al modo enfocado con un breve cuestionario, una sola pregunta a la vez.",
      startCta: "Empezar",
      orPress: "O pulsa",
    },
    welcome: {
      badge: "Experiencia de evaluación inmersiva",
      titleLine1: "Te damos la bienvenida a",
      brand: "Omnitest",
      subtitle:
        "Un modo concentrado para evaluarte sin distracciones. Inicia sesión o crea una cuenta para una sesión a tu ritmo.",
      bulletEncrypted: "Sesión protegida",
      bulletOneQ: "Una pregunta a la vez",
      bulletAutosave: "Progreso guardado solo",
    },
    questionnaire: {
      brand: "Omnitest",
      questionOrdinal: "Pregunta",
      skipEducationHint: " · omitir si no sabes",
      skipWorkHint: " · omitir si no aplica",
      optionalHint: " · opcional",
      requiredHint: "",
      back: "Atrás",
      next: "Siguiente",
      submit: "Enviar",
      pressEnter: "Pulsa",
      pressEnterContinue: "para continuar",
      completedHeading: "Listo.",
      completedLine1NoEmail: "Gracias por completar tu perfil.",
      completedLine1BeforeEmail: "Gracias por completar tu perfil, ",
      completedLine1AfterEmail: ".",
      completedLine2:
        "Tu información quedó guardada — comienza tu recorrido con Omnitest.",
    },
  },
};
