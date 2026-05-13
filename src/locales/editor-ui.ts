import type { AppLocale } from "@/locales/types";

export type EditorUiCopy = {
  city: {
    typeYourCity: string;
    loadFail: string;
    yourCityPlaceholder: string;
  };
  legalLastNames: {
    primaryLabel: string;
    primaryPlaceholder: string;
    additionalLabelPrefix: string;
    addAnother: string;
    removeAria: string;
  };
  education: {
    skipLevel: string;
    wantToAnswer: string;
    addSchool: string;
    schoolN: string;
    collegeRowHint: string;
    schoolName: string;
    institutionType: string;
    selectType: string;
    collegeStatus: string;
    selectStatus: string;
    finishedYear: string;
    year: string;
  };
  work: {
    skipSection: string;
    wantRoles: string;
    addRole: string;
    roleN: string;
    basicEmployment: string;
    company: string;
    jobTitle: string;
    employmentType: string;
    selectType: string;
    workArrangement: string;
    selectArrangement: string;
    city: string;
    stateProvince: string;
    stateOptionalPlaceholder: string;
    country: string;
    industry: string;
    selectIndustry: string;
    datesTitle: string;
    startMonth: string;
    startYear: string;
    currentlyHere: string;
    selectOption: string;
    endMonth: string;
    endYear: string;
    yearShort: string;
    totalDuration: string;
    roleDescTitle: string;
    responsibilities: string;
    responsibilitiesHint: string;
    responsibilitiesPh: string;
    teamDept: string;
    reportsTo: string;
    managePeople: string;
    preferNotAnswer: string;
    howManyManaged: string;
    roleLevel: string;
    selectLevel: string;
  };
  languageRows: {
    empty: string;
    addLanguage: string;
    language: string;
    spokenLevel: string;
    selectLevel: string;
    removeRow: string;
  };
  photo: {
    replace: string;
    upload: string;
    sub: string;
    remove: string;
    errType: string;
    errSize: string;
    errAuth: string;
    errUpload: string;
  };
  birthDate: {
    day: string;
    month: string;
    year: string;
  };
};

const en: EditorUiCopy = {
  city: {
    typeYourCity: "Type your city",
    loadFail:
      "We couldn't load cities for this state. Please type your city below.",
    yourCityPlaceholder: "Your city",
  },
  legalLastNames: {
    primaryLabel: "Primary legal last name",
    primaryPlaceholder: "e.g. Vasquez",
    additionalLabelPrefix: "Additional last name",
    addAnother: "Add another last name",
    removeAria: "Remove additional last name",
  },
  education: {
    skipLevel: "Skip this level",
    wantToAnswer: "I want to answer",
    addSchool: "Add another school at this level",
    schoolN: "School",
    collegeRowHint: " · mark finished vs still enrolled per row",
    schoolName: "School / institution name",
    institutionType: "Type of institution",
    selectType: "Select type",
    collegeStatus: "Status at this institution",
    selectStatus: "Select status",
    finishedYear: "Finished / graduated in",
    year: "Year",
  },
  work: {
    skipSection: "Skip work history",
    wantRoles: "I want to add roles",
    addRole: "Add another role",
    roleN: "Role",
    basicEmployment: "Basic employment",
    company: "Company name",
    jobTitle: "Job title / position",
    employmentType: "Employment type",
    selectType: "Select type",
    workArrangement: "Work arrangement",
    selectArrangement: "Select arrangement",
    city: "City",
    stateProvince: "State / province",
    stateOptionalPlaceholder: "Optional",
    country: "Country",
    industry: "Industry",
    selectIndustry: "Select industry",
    datesTitle: "Dates & duration",
    startMonth: "Start — month",
    startYear: "Start — year",
    currentlyHere: "Are you currently working here?",
    selectOption: "Select",
    endMonth: "End — month",
    endYear: "End — year",
    yearShort: "Year",
    totalDuration: "Total duration (approx.):",
    roleDescTitle: "Role description (optional)",
    responsibilities: "What were your main responsibilities? (optional)",
    responsibilitiesHint: "If you add details, aim for 2–4 sentences.",
    responsibilitiesPh: "Describe your role…",
    teamDept: "What team or department did you belong to? (optional)",
    reportsTo: "Who did you report to? (optional)",
    managePeople: "Did you manage people? (optional)",
    preferNotAnswer: "Prefer not to answer",
    howManyManaged: "How many people did you manage? (optional)",
    roleLevel: "What level was the role? (optional)",
    selectLevel: "Select level",
  },
  languageRows: {
    empty: "No additional languages yet. Tap add if you speak others.",
    addLanguage: "Add a language",
    language: "Language",
    spokenLevel: "Spoken level",
    selectLevel: "Select level",
    removeRow: "Remove language row",
  },
  photo: {
    replace: "Replace photo",
    upload: "Upload a photo",
    sub: "JPG or PNG · optional",
    remove: "Remove photo",
    errType: "Please choose an image file (JPG or PNG).",
    errSize: "That file is too large. Try under 4 MB.",
    errAuth: "You need to be signed in to upload a photo.",
    errUpload: "Upload failed. Check Storage rules or try again.",
  },
  birthDate: {
    day: "Day",
    month: "Month",
    year: "Year",
  },
};

const es: EditorUiCopy = {
  city: {
    typeYourCity: "Escribe tu ciudad",
    loadFail:
      "No pudimos cargar ciudades para este estado. Escribe tu ciudad abajo.",
    yourCityPlaceholder: "Tu ciudad",
  },
  legalLastNames: {
    primaryLabel: "Primer apellido legal",
    primaryPlaceholder: "p. ej. Vásquez",
    additionalLabelPrefix: "Apellido adicional",
    addAnother: "Agregar otro apellido",
    removeAria: "Quitar apellido adicional",
  },
  education: {
    skipLevel: "Omitir este nivel",
    wantToAnswer: "Quiero responder",
    addSchool: "Agregar otra escuela en este nivel",
    schoolN: "Escuela",
    collegeRowHint: " · indica si sigues estudiando o ya terminaste",
    schoolName: "Nombre de la escuela / institución",
    institutionType: "Tipo de institución",
    selectType: "Selecciona el tipo",
    collegeStatus: "Situación en esta institución",
    selectStatus: "Selecciona situación",
    finishedYear: "Terminé / me gradué en",
    year: "Año",
  },
  work: {
    skipSection: "Omitir experiencia laboral",
    wantRoles: "Quiero agregar empleos",
    addRole: "Agregar otro empleo",
    roleN: "Empleo",
    basicEmployment: "Datos básicos del empleo",
    company: "Nombre de la empresa",
    jobTitle: "Puesto / título",
    employmentType: "Tipo de empleo",
    selectType: "Selecciona el tipo",
    workArrangement: "Modalidad de trabajo",
    selectArrangement: "Selecciona la modalidad",
    city: "Ciudad",
    stateProvince: "Estado / provincia",
    stateOptionalPlaceholder: "Opcional",
    country: "País",
    industry: "Industria",
    selectIndustry: "Selecciona la industria",
    datesTitle: "Fechas y duración",
    startMonth: "Inicio — mes",
    startYear: "Inicio — año",
    currentlyHere: "¿Sigues trabajando aquí?",
    selectOption: "Selecciona",
    endMonth: "Fin — mes",
    endYear: "Fin — año",
    yearShort: "Año",
    totalDuration: "Duración total (aprox.):",
    roleDescTitle: "Descripción del puesto (opcional)",
    responsibilities: "¿Cuáles eran tus responsabilidades principales? (opcional)",
    responsibilitiesHint: "Si escribes algo, orienta a 2–4 oraciones.",
    responsibilitiesPh: "Describe tu rol…",
    teamDept: "¿A qué equipo o área pertenecías? (opcional)",
    reportsTo: "¿A quién reportabas? (opcional)",
    managePeople: "¿Dirigías a otras personas? (opcional)",
    preferNotAnswer: "Prefiero no responder",
    howManyManaged: "¿Cuántas personas dirigías? (opcional)",
    roleLevel: "¿Qué nivel tenía el puesto? (opcional)",
    selectLevel: "Selecciona el nivel",
  },
  languageRows: {
    empty: "Aún no hay otros idiomas. Pulsa agregar si hablas más.",
    addLanguage: "Agregar idioma",
    language: "Idioma",
    spokenLevel: "Nivel oral",
    selectLevel: "Selecciona el nivel",
    removeRow: "Quitar idioma",
  },
  photo: {
    replace: "Cambiar foto",
    upload: "Subir una foto",
    sub: "JPG o PNG · opcional",
    remove: "Quitar foto",
    errType: "Elige un archivo de imagen (JPG o PNG).",
    errSize: "El archivo es demasiado grande. Intenta con menos de 4 MB.",
    errAuth: "Debes iniciar sesión para subir una foto.",
    errUpload: "No se pudo subir. Revisa las reglas de Storage o reintenta.",
  },
  birthDate: {
    day: "Día",
    month: "Mes",
    year: "Año",
  },
};

export const EDITOR_UI: Record<AppLocale, EditorUiCopy> = { en, es };

export function getEditorUi(locale: AppLocale): EditorUiCopy {
  return EDITOR_UI[locale];
}
