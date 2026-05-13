import type { OnboardingField } from "@/lib/onboarding-fields";

type FieldCopyPatch = Partial<
  Pick<
    OnboardingField,
    "label" | "prompt" | "helper" | "placeholder" | "skipOptionLabel" | "sectionTitle"
  >
>;

export const FIELD_COPY_ES: Record<string, FieldCopyPatch> = {
  legalFirstName: {
    sectionTitle: "Datos personales",
    label: "Nombre legal de pila",
    prompt: "¿Cuál es tu nombre legal de pila?",
    helper: "Recogemos nombre de pila, segundo nombre y apellidos para identificación.",
    placeholder: "ej. María",
  },
  legalMiddleName: {
    sectionTitle: "Datos personales",
    label: "Segundo nombre(s) legal(es)",
    prompt: "¿Tienes segundo(s) nombre(s) legal(es)?",
    helper: "Déjalo en blanco si no usas segundo nombre.",
    placeholder: "Opcional — en blanco si no aplica",
  },
  legalLastName: {
    sectionTitle: "Datos personales",
    label: "Apellidos legales",
    prompt: "¿Cuáles son tus apellidos legales?",
    helper:
      "Si en documentos aparece más de un apellido (por ejemplo materno y paterno), agrégalos todos. El primario va en el campo principal.",
    placeholder: "Primer apellido legal",
  },
  preferredDisplayName: {
    sectionTitle: "Datos personales",
    label: "Nombre preferido / público",
    prompt: "¿Cómo debemos llamarte día a día?",
    helper: "Así aparecerá tu nombre en tu informe.",
    placeholder: "ej. Mari",
  },
  dateOfBirth: {
    sectionTitle: "Datos personales",
    label: "Fecha de nacimiento",
    prompt: "¿Cuál es tu fecha de nacimiento?",
    helper: "Elige mes, día y año — se usa para puntajes ajustados por edad.",
    placeholder: "",
  },
  gender: {
    sectionTitle: "Datos personales",
    label: "Género",
    prompt: "¿Cómo describes tu género?",
    helper: "Opcional — elige lo que te represente u omite.",
    placeholder: "Opcional",
    skipOptionLabel: "Prefiero no decirlo / omitir",
  },
  countryOfResidence: {
    sectionTitle: "Datos personales",
    label: "País de residencia",
    prompt: "¿En qué país vives actualmente?",
    placeholder: "Elige un país",
  },
  stateOfResidence: {
    sectionTitle: "Datos personales",
    label: "Estado / provincia",
    prompt: "¿En qué estado o provincia vives?",
    helper: "Mostrado para México y Estados Unidos.",
    placeholder: "Selecciona tu estado",
  },
  cityOfResidence: {
    sectionTitle: "Datos personales",
    label: "Ciudad de residencia",
    prompt: "¿En qué ciudad vives?",
    helper:
      "México y EE. UU.: elige de la lista según tu estado. Canadá: escribe tu ciudad.",
    placeholder: "Selecciona o escribe ciudad",
  },
  primarySpokenLanguage: {
    sectionTitle: "Datos personales",
    label: "Idioma principal hablado",
    prompt: "¿Cuál es tu idioma principal hablado?",
    placeholder: "ej. español",
  },
  education_kindergarten: {
    sectionTitle: "Educación",
    label: "Kindergarten / preescolar",
    prompt: "Kindergarten / preescolar — ¿dónde estudiaste y qué tipo de escuela fue?",
    helper:
      "Usa «Agregar otra escuela» si asististe a más de una. Omite este paso si lo prefieres.",
    placeholder: "",
  },
  education_elementary: {
    sectionTitle: "Educación",
    label: "Primaria",
    prompt: "Educación primaria — ¿nombre de la escuela y tipo?",
    helper:
      "¿Más de una escuela primaria? Agrega cada una. Omite si no recuerdas.",
    placeholder: "",
  },
  education_middleSchool: {
    sectionTitle: "Educación",
    label: "Secundaria",
    prompt: "Secundaria — ¿nombre de la escuela y tipo?",
    helper:
      "¿Varias escuelas en este nivel? Agrega cada una. Omite si no aplica o no recuerdas.",
    placeholder: "",
  },
  education_highSchool: {
    sectionTitle: "Educación",
    label: "Preparatoria / bachillerato",
    prompt: "Preparatoria / bachillerato — ¿nombre de la escuela y tipo?",
    helper:
      "¿Cambiaste de escuela? Agrega una fila por cada una. Omite si no recuerdas.",
    placeholder: "",
  },
  education_college: {
    sectionTitle: "Educación",
    label: "Universidad / posgrado",
    prompt: "Universidad u otra institución — cuéntanos cada una.",
    helper:
      "Agrega cada institución por separado. En cada fila indica si estudias ahora o ya terminaste (con año de egreso si terminaste).",
    placeholder: "",
  },
  workHistory: {
    sectionTitle: "Experiencia laboral",
    label: "Experiencia laboral",
    prompt: "Cuéntanos tu experiencia laboral.",
    helper:
      "Agrega cada rol por separado. Puedes omitir este paso si aún no tienes historial laboral o de voluntariado.",
    placeholder: "",
  },
  additionalLanguages: {
    sectionTitle: "Perfil y contacto",
    label: "Otros idiomas hablados",
    prompt: "¿Hablas otros idiomas?",
    helper:
      "Agrega cada idioma con su nivel. Déjalo vacío si no aplica — está bien.",
    placeholder: "",
  },
  phoneNumber: {
    sectionTitle: "Perfil y contacto",
    label: "Teléfono",
    prompt: "¿Cuál es tu número de teléfono?",
    helper: "Opcional — pocas veces te contactaremos por teléfono.",
    placeholder: "+52 55 1234 5678",
  },
  placeOfBirthCity: {
    sectionTitle: "Perfil y contacto",
    label: "Lugar de nacimiento — ciudad",
    prompt: "¿En qué ciudad naciste?",
    helper: "Contexto demográfico opcional.",
    placeholder: "ej. Monterrey",
  },
  placeOfBirthCountry: {
    sectionTitle: "Perfil y contacto",
    label: "Lugar de nacimiento — país",
    prompt: "¿En qué país naciste?",
    placeholder: "ej. México",
  },
  nationalityCitizenship: {
    sectionTitle: "Perfil y contacto",
    label: "Nacionalidad / ciudadanía",
    prompt: "¿Cuál es tu nacionalidad o ciudadanía?",
    placeholder: "ej. mexicana",
  },
  secondaryNationality: {
    sectionTitle: "Perfil y contacto",
    label: "Segunda nacionalidad",
    prompt: "¿Tienes otra nacionalidad?",
    helper: "Opcional — si eres binacional, pon la otra aquí.",
    placeholder: "ej. Estados Unidos",
  },
  pronouns: {
    sectionTitle: "Perfil y contacto",
    label: "Pronombres",
    prompt: "¿Qué pronombres debemos usar?",
    placeholder: "Opcional",
    skipOptionLabel: "Omitir",
  },
  linkedinUrl: {
    sectionTitle: "Perfil y contacto",
    label: "URL de LinkedIn",
    prompt: "¿Quieres compartir tu perfil de LinkedIn?",
    placeholder: "https://linkedin.com/in/tu-usuario",
  },
  personalWebsiteUrl: {
    sectionTitle: "Perfil y contacto",
    label: "Sitio web personal / portafolio",
    prompt: "¿URL de tu sitio o portafolio?",
    placeholder: "https://…",
  },
  profilePhotoUrl: {
    sectionTitle: "Perfil y contacto",
    label: "Foto de perfil",
    prompt: "¿Agregar foto de perfil?",
    helper: "Opcional — JPG o PNG, hasta ~4 MB. Puedes omitir.",
    placeholder: "",
  },
  omniPurpose: {
    sectionTitle: "Acerca de OMNI",
    label: "Motivo principal",
    prompt: "¿Cuál es tu motivo principal para usar OMNI?",
    helper: "Esto cambia los insights que te mostramos.",
    placeholder: "Elige una opción",
  },
};
