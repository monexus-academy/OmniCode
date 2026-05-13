"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CornerDownLeft,
  ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AnswersMap, OnboardingField } from "@/lib/onboarding-fields";
import { getCityFieldMode } from "@/lib/city-options";
import { storage } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { getEditorUi, type EditorUiCopy } from "@/locales/editor-ui";
import {
  getLocalizedVisibleFields,
  getQuestionnaireLexicon,
  type QuestionnaireLexicon,
} from "@/locales/localize-fields";
import { useLocale } from "@/locales/locale-context";
import { getMonthChoices } from "@/locales/months";
import type { AppLocale } from "@/locales/types";
import { UI_STRINGS } from "@/locales/ui-strings";

type Answers = AnswersMap;

type QuestionnaireI18n = {
  locale: AppLocale;
  lex: QuestionnaireLexicon;
  editorUi: EditorUiCopy;
  monthChoices: { value: string; label: string }[];
};

type QuestionnaireProps = {
  onComplete: (answers: Answers) => Promise<void> | void;
};

const SELECT_FIELD_CLASSES = cn(
  "h-14 w-full appearance-none rounded-xl border border-soft-lavender/25 bg-slate-indigo/55 px-4 pr-12 text-lg font-medium text-[#F8FAFC]",
  "shadow-inner shadow-black/20 transition-all duration-300",
  "hover:border-soft-lavender/45 hover:bg-slate-indigo/65",
  "focus:border-electric-violet/80 focus:bg-slate-indigo/75 focus:outline-none focus:ring-4 focus:ring-electric-violet/25",
  "[color-scheme:dark]",
);

const SELECT_FIELD_CLASSES_SM = cn(
  "h-12 w-full appearance-none rounded-xl border border-soft-lavender/25 bg-slate-indigo/55 px-3 pr-10 text-sm font-medium text-[#F8FAFC]",
  "shadow-inner shadow-black/20 transition-all duration-300",
  "focus:border-electric-violet/80 focus:bg-slate-indigo/75 focus:outline-none focus:ring-4 focus:ring-electric-violet/25",
  "[color-scheme:dark]",
);

type LanguageRow = { language: string; level: string };

function parseLanguageRows(raw: string): LanguageRow[] {
  try {
    const parsed = JSON.parse(raw || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
      .map((item) => ({
        language: typeof item.language === "string" ? item.language : "",
        level: typeof item.level === "string" ? item.level : "",
      }));
  } catch {
    return [];
  }
}

function languageRowsValid(raw: string, required: boolean): boolean {
  const rows = parseLanguageRows(raw).filter(
    (r) => r.language.trim().length > 0 || r.level.trim().length > 0,
  );
  if (rows.length === 0) return !required;
  return rows.every((r) => r.language.trim().length > 0 && r.level.length > 0);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function composeIsoDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

type EducationEntry = {
  schoolName: string;
  institutionType: string;
  collegeStatus?: string;
  finishedYear?: string;
};

type EducationPayload = {
  skipped?: boolean;
  entries?: EducationEntry[];
  /** Legacy single-school shape */
  schoolName?: string;
  institutionType?: string;
  collegeStatus?: string;
  finishedYear?: string;
};

function emptyEducationEntry(mode: "standard" | "college"): EducationEntry {
  const base: EducationEntry = { schoolName: "", institutionType: "" };
  if (mode === "college") {
    base.collegeStatus = "";
    base.finishedYear = "";
  }
  return base;
}

function parseEducationPayload(raw: string): EducationPayload {
  try {
    const p = JSON.parse(raw || "{}") as unknown;
    if (!p || typeof p !== "object") return {};
    const o = p as Record<string, unknown>;
    const skipped = o.skipped === true;
    let entries: EducationEntry[] | undefined;
    if (Array.isArray(o.entries)) {
      entries = o.entries
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          schoolName:
            typeof item.schoolName === "string" ? item.schoolName : "",
          institutionType:
            typeof item.institutionType === "string"
              ? item.institutionType
              : "",
          collegeStatus:
            typeof item.collegeStatus === "string"
              ? item.collegeStatus
              : "",
          finishedYear:
            typeof item.finishedYear === "string" ? item.finishedYear : "",
        }));
    }
    return {
      skipped,
      entries,
      schoolName: typeof o.schoolName === "string" ? o.schoolName : "",
      institutionType:
        typeof o.institutionType === "string" ? o.institutionType : "",
      collegeStatus:
        typeof o.collegeStatus === "string" ? o.collegeStatus : "",
      finishedYear:
        typeof o.finishedYear === "string" ? o.finishedYear : "",
    };
  } catch {
    return {};
  }
}

function normalizeEducationPayload(
  parsed: EducationPayload,
  mode: "standard" | "college",
): { skipped: true; entries: EducationEntry[] } | { skipped: false; entries: EducationEntry[] } {
  if (parsed.skipped) {
    return { skipped: true, entries: [] };
  }

  let entries = parsed.entries;
  const legacyName =
    typeof parsed.schoolName === "string" ? parsed.schoolName.trim() : "";
  const legacyType =
    typeof parsed.institutionType === "string"
      ? parsed.institutionType.trim()
      : "";

  if (!Array.isArray(entries) || entries.length === 0) {
    if (legacyName.length > 0 || legacyType.length > 0) {
      entries = [
        {
          schoolName: legacyName,
          institutionType: legacyType,
          ...(mode === "college"
            ? {
                collegeStatus:
                  typeof parsed.collegeStatus === "string"
                    ? parsed.collegeStatus
                    : "",
                finishedYear:
                  typeof parsed.finishedYear === "string"
                    ? parsed.finishedYear
                    : "",
              }
            : {}),
        },
      ];
    } else {
      entries = [emptyEducationEntry(mode)];
    }
  }

  const normalized = entries.map((e) => ({
    schoolName: typeof e.schoolName === "string" ? e.schoolName : "",
    institutionType:
      typeof e.institutionType === "string" ? e.institutionType : "",
    ...(mode === "college"
      ? {
          collegeStatus:
            typeof e.collegeStatus === "string" ? e.collegeStatus : "",
          finishedYear:
            typeof e.finishedYear === "string" ? e.finishedYear : "",
        }
      : {}),
  }));

  return { skipped: false, entries: normalized };
}

function educationEntryValid(entry: EducationEntry, mode: "standard" | "college"): boolean {
  if (!entry.schoolName.trim() || !entry.institutionType.trim()) return false;
  if (mode !== "college") return true;
  const st = (entry.collegeStatus ?? "").trim();
  if (st !== "currently-studying" && st !== "finished") return false;
  if (st === "finished") {
    const y = (entry.finishedYear ?? "").trim();
    if (!/^\d{4}$/.test(y)) return false;
    const yi = Number(y);
    const now = new Date().getFullYear();
    if (yi < 1950 || yi > now + 1) return false;
  }
  return true;
}

function educationStepValid(
  raw: string,
  mode: "standard" | "college",
): boolean {
  const parsed = parseEducationPayload(raw);
  if (parsed.skipped) return true;
  const n = normalizeEducationPayload(parsed, mode);
  if (n.skipped) return true;
  if (n.entries.length === 0) return false;
  return n.entries.every((e) => educationEntryValid(e, mode));
}

function educationHasPartialProgress(
  raw: string,
  mode: "standard" | "college",
): boolean {
  const parsed = parseEducationPayload(raw);
  if (parsed.skipped) return true;
  const n = normalizeEducationPayload(parsed, mode);
  if (n.skipped) return true;
  return n.entries.some((e) => {
    if (!e.schoolName.trim() || !e.institutionType.trim()) return false;
    if (mode === "college") {
      const st = (e.collegeStatus ?? "").trim();
      if (st === "currently-studying") return true;
      if (st === "finished") {
        const y = (e.finishedYear ?? "").trim();
        return /^\d{4}$/.test(y);
      }
      return false;
    }
    return true;
  });
}

type WorkHistoryEntry = {
  companyName: string;
  jobTitle: string;
  employmentType: string;
  workArrangement: string;
  locationCity: string;
  locationState: string;
  locationCountry: string;
  industry: string;
  startMonth: string;
  startYear: string;
  currentlyWorking: string;
  endMonth: string;
  endYear: string;
  mainResponsibilities: string;
  teamOrDepartment: string;
  reportsTo: string;
  managesPeople: string;
  manageCount: string;
  roleLevel: string;
};

type WorkHistoryPayload = {
  skipped?: boolean;
  entries?: WorkHistoryEntry[];
};

function emptyWorkHistoryEntry(): WorkHistoryEntry {
  return {
    companyName: "",
    jobTitle: "",
    employmentType: "",
    workArrangement: "",
    locationCity: "",
    locationState: "",
    locationCountry: "",
    industry: "",
    startMonth: "",
    startYear: "",
    currentlyWorking: "",
    endMonth: "",
    endYear: "",
    mainResponsibilities: "",
    teamOrDepartment: "",
    reportsTo: "",
    managesPeople: "",
    manageCount: "",
    roleLevel: "",
  };
}

function parseWorkHistoryPayload(raw: string): WorkHistoryPayload {
  try {
    const p = JSON.parse(raw || "{}") as unknown;
    if (!p || typeof p !== "object") return {};
    const o = p as Record<string, unknown>;
    const skipped = o.skipped === true;
    let entries: WorkHistoryEntry[] | undefined;
    if (Array.isArray(o.entries)) {
      entries = o.entries
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          companyName:
            typeof item.companyName === "string" ? item.companyName : "",
          jobTitle: typeof item.jobTitle === "string" ? item.jobTitle : "",
          employmentType:
            typeof item.employmentType === "string" ? item.employmentType : "",
          workArrangement:
            typeof item.workArrangement === "string" ? item.workArrangement : "",
          locationCity:
            typeof item.locationCity === "string" ? item.locationCity : "",
          locationState:
            typeof item.locationState === "string" ? item.locationState : "",
          locationCountry:
            typeof item.locationCountry === "string" ? item.locationCountry : "",
          industry: typeof item.industry === "string" ? item.industry : "",
          startMonth: typeof item.startMonth === "string" ? item.startMonth : "",
          startYear: typeof item.startYear === "string" ? item.startYear : "",
          currentlyWorking:
            typeof item.currentlyWorking === "string"
              ? item.currentlyWorking
              : "",
          endMonth: typeof item.endMonth === "string" ? item.endMonth : "",
          endYear: typeof item.endYear === "string" ? item.endYear : "",
          mainResponsibilities:
            typeof item.mainResponsibilities === "string"
              ? item.mainResponsibilities
              : "",
          teamOrDepartment:
            typeof item.teamOrDepartment === "string"
              ? item.teamOrDepartment
              : "",
          reportsTo: typeof item.reportsTo === "string" ? item.reportsTo : "",
          managesPeople:
            typeof item.managesPeople === "string" ? item.managesPeople : "",
          manageCount:
            typeof item.manageCount === "string" ? item.manageCount : "",
          roleLevel: typeof item.roleLevel === "string" ? item.roleLevel : "",
        }));
    }
    return { skipped, entries };
  } catch {
    return {};
  }
}

function normalizeWorkHistoryPayload(
  parsed: WorkHistoryPayload,
): { skipped: true; entries: WorkHistoryEntry[] } | { skipped: false; entries: WorkHistoryEntry[] } {
  if (parsed.skipped) {
    return { skipped: true, entries: [] };
  }
  let entries = parsed.entries;
  if (!Array.isArray(entries) || entries.length === 0) {
    entries = [emptyWorkHistoryEntry()];
  }
  return {
    skipped: false,
    entries: entries.map((e) => ({ ...emptyWorkHistoryEntry(), ...e })),
  };
}

function compareMonthYear(
  m1: number,
  y1: number,
  m2: number,
  y2: number,
): number {
  const a = y1 * 12 + m1;
  const b = y2 * 12 + m2;
  return a - b;
}

function formatDurationLabel(
  entry: WorkHistoryEntry,
  locale: AppLocale,
): string | null {
  const sm = Number(entry.startMonth);
  const sy = Number(entry.startYear);
  if (!sm || sm < 1 || sm > 12 || !sy || sy < 1950) return null;

  let em: number;
  let ey: number;
  if (entry.currentlyWorking === "yes") {
    const n = new Date();
    em = n.getMonth() + 1;
    ey = n.getFullYear();
  } else {
    em = Number(entry.endMonth);
    ey = Number(entry.endYear);
    if (!em || em < 1 || em > 12 || !ey) return null;
  }

  if (compareMonthYear(sm, sy, em, ey) > 0) return null;

  const totalMonths =
    (ey - sy) * 12 +
    (em - sm) +
    1;
  const short =
    locale === "es" ? "Menos de un mes" : "Less than a month";
  if (totalMonths <= 0) return short;
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) {
    parts.push(
      locale === "es"
        ? `${years} año${years === 1 ? "" : "s"}`
        : `${years} year${years === 1 ? "" : "s"}`,
    );
  }
  if (months > 0) {
    parts.push(
      locale === "es"
        ? `${months} mes${months === 1 ? "" : "es"}`
        : `${months} month${months === 1 ? "" : "s"}`,
    );
  }
  return parts.length > 0 ? parts.join(locale === "es" ? ", " : ", ") : short;
}

function workHistoryEntryValid(entry: WorkHistoryEntry): boolean {
  if (!entry.companyName.trim() || !entry.jobTitle.trim()) return false;
  if (
    !entry.employmentType.trim() ||
    !entry.workArrangement.trim() ||
    !entry.industry.trim()
  ) {
    return false;
  }
  if (!entry.locationCity.trim() || !entry.locationCountry.trim())
    return false;

  const sm = Number(entry.startMonth);
  const sy = Number(entry.startYear);
  const nowY = new Date().getFullYear();
  if (!sm || sm < 1 || sm > 12 || !sy || sy < 1950 || sy > nowY + 1) {
    return false;
  }

  const cw = entry.currentlyWorking;
  if (cw !== "yes" && cw !== "no") return false;

  if (cw === "no") {
    const em = Number(entry.endMonth);
    const ey = Number(entry.endYear);
    if (!em || em < 1 || em > 12 || !ey || ey < 1950 || ey > nowY + 1) {
      return false;
    }
    if (compareMonthYear(em, ey, sm, sy) < 0) return false;
  }

  return true;
}

function workHistoryStepValid(raw: string): boolean {
  const parsed = parseWorkHistoryPayload(raw);
  if (parsed.skipped) return true;
  const n = normalizeWorkHistoryPayload(parsed);
  if (n.skipped) return true;
  if (n.entries.length === 0) return false;
  return n.entries.every((e) => workHistoryEntryValid(e));
}

function workHistoryHasPartialProgress(raw: string): boolean {
  const parsed = parseWorkHistoryPayload(raw);
  if (parsed.skipped) return true;
  const n = normalizeWorkHistoryPayload(parsed);
  if (n.skipped) return true;
  return n.entries.some(
    (e) =>
      e.companyName.trim().length > 0 ||
      e.jobTitle.trim().length > 0 ||
      workHistoryEntryValid(e),
  );
}

function isReasonableDateOfBirth(iso: string): boolean {
  if (!iso) return false;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  if (d > now) return false;
  if (d.getFullYear() < 1900) return false;
  const ageYears =
    (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return ageYears >= 4 && ageYears <= 120;
}

function optionalUrlValid(raw: string): boolean {
  const v = raw.trim();
  if (!v) return true;
  try {
    const withProto =
      v.startsWith("http://") || v.startsWith("https://") ? v : `https://${v}`;
    new URL(withProto);
    return true;
  } catch {
    return false;
  }
}

type LegalLastNamesPayload = { primary: string; additional: string[] };

function parseLegalLastNamesObject(raw: string): LegalLastNamesPayload | null {
  try {
    const p = JSON.parse(raw || "{}") as unknown;
    if (!p || typeof p !== "object") return null;
    const o = p as Record<string, unknown>;
    const primary = typeof o.primary === "string" ? o.primary : "";
    const add = o.additional;
    const additional = Array.isArray(add)
      ? add.filter((x): x is string => typeof x === "string")
      : [];
    return { primary, additional };
  } catch {
    return null;
  }
}

function normalizeLegalLastNames(raw: string): LegalLastNamesPayload {
  const parsed = parseLegalLastNamesObject(raw);
  if (parsed) {
    return { primary: parsed.primary, additional: [...parsed.additional] };
  }
  return { primary: raw, additional: [] };
}

function serializeLegalLastNames(payload: LegalLastNamesPayload): string {
  return JSON.stringify({
    primary: payload.primary,
    additional: payload.additional,
  });
}

function legalLastNamesStepValid(raw: string, required: boolean): boolean {
  const n = normalizeLegalLastNames(raw);
  if (!required) return true;
  return n.primary.trim().length > 0;
}

function legalLastNamesHasPartialProgress(raw: string): boolean {
  const n = normalizeLegalLastNames(raw);
  if (n.primary.trim().length > 0) return true;
  return n.additional.some((s) => s.trim().length > 0);
}

function isStepValid(field: OnboardingField, value: string): boolean {
  if (!field.required && field.type !== "language-rows") {
    if (field.type === "url") return optionalUrlValid(value);
    if (
      (field.type === "birth-date" ||
        field.type === "education-level" ||
        field.type === "work-history" ||
        field.type === "legal-last-names") &&
      !value.trim()
    ) {
      return !field.required;
    }
    return true;
  }

  switch (field.type) {
    case "language-rows":
      return languageRowsValid(value, !!field.required);
    case "birth-date":
      return isReasonableDateOfBirth(value);
    case "education-level":
      return educationStepValid(value, field.educationMode ?? "standard");
    case "work-history":
      return workHistoryStepValid(value);
    case "legal-last-names":
      return legalLastNamesStepValid(value, !!field.required);
    case "url":
      if (!field.required) return optionalUrlValid(value);
      return optionalUrlValid(value) && value.trim().length > 0;
    case "profile-photo":
      return true;
    case "select":
      return field.required ? value.trim().length > 0 : true;
    default:
      return value.trim().length > 0;
  }
}

export function Questionnaire({ onComplete }: QuestionnaireProps) {
  const { user } = useAuth();
  const { locale } = useLocale();
  const qs = UI_STRINGS[locale].questionnaire;

  const i18n = useMemo(
    (): QuestionnaireI18n => ({
      locale,
      lex: getQuestionnaireLexicon(locale),
      editorUi: getEditorUi(locale),
      monthChoices: getMonthChoices(locale),
    }),
    [locale],
  );

  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [fieldBusy, setFieldBusy] = useState(false);

  const visibleFields = useMemo(
    () => getLocalizedVisibleFields(answers, locale),
    [answers, locale],
  );

  const totalSteps = visibleFields.length;
  const activeStepIndex =
    totalSteps === 0 ? 0 : Math.min(Math.max(stepIndex, 0), totalSteps - 1);

  const field = visibleFields[activeStepIndex];
  const showSectionBanner = Boolean(
    field?.sectionTitle &&
      (activeStepIndex === 0 ||
        visibleFields[activeStepIndex - 1]?.sectionTitle !== field.sectionTitle),
  );
  const value = !field
    ? ""
    : field.type === "language-rows"
      ? (answers[field.key] ?? "[]")
      : (answers[field.key] ?? "");

  const progress = useMemo(() => {
    if (!field || totalSteps === 0) return 0;
    let chunk = value.trim().length > 0 ? 0.5 : 0;
    if (field.type === "language-rows") {
      const rows = parseLanguageRows(value).filter((r) =>
        [r.language, r.level].some((x) => x.trim().length > 0),
      );
      chunk = rows.length > 0 ? 0.5 : 0;
    }
    if (field.type === "profile-photo" && value.trim()) chunk = 0.5;
    if (field.type === "city" && value.trim()) chunk = 0.5;
    if (field.type === "education-level") {
      chunk = educationHasPartialProgress(
        value,
        field.educationMode ?? "standard",
      )
        ? 0.5
        : 0;
    }
    if (field.type === "work-history") {
      chunk = workHistoryHasPartialProgress(value) ? 0.5 : 0;
    }
    if (field.type === "legal-last-names") {
      chunk = legalLastNamesHasPartialProgress(value) ? 0.5 : 0;
    }
    if (field.type === "birth-date" && isReasonableDateOfBirth(value)) {
      chunk = 0.5;
    }
    return ((activeStepIndex + chunk) / totalSteps) * 100;
  }, [activeStepIndex, field, totalSteps, value]);

  const stepOk = field ? isStepValid(field, value) : false;

  const setValue = useCallback((key: string, val: string) => {
    setAnswers((prev) => {
      const next = { ...prev, [key]: val };
      if (key === "countryOfResidence") {
        if (val !== "mx" && val !== "us") {
          next.stateOfResidence = "";
        } else if (prev.countryOfResidence !== val) {
          next.stateOfResidence = "";
        }
        next.cityOfResidence = "";
      }
      if (key === "stateOfResidence" && prev.stateOfResidence !== val) {
        next.cityOfResidence = "";
      }
      return next;
    });
  }, []);

  const isLast =
    totalSteps > 0 && activeStepIndex >= totalSteps - 1;

  const goNext = useCallback(async () => {
    if (!field || !stepOk || submitting || fieldBusy) return;
    if (isLast) {
      setSubmitting(true);
      try {
        await onComplete({ ...answers, [field.key]: value });
        setDone(true);
      } catch {
        setSubmitting(false);
      }
      return;
    }
    setDirection(1);
    setStepIndex(
      Math.min(activeStepIndex + 1, Math.max(totalSteps - 1, 0)),
    );
  }, [
    activeStepIndex,
    answers,
    field,
    fieldBusy,
    isLast,
    onComplete,
    stepOk,
    submitting,
    totalSteps,
    value,
  ]);

  /** Invoked after child saves skip-state; timeout lets React flush answers before validating goNext(). */
  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;
  const scheduleAdvanceAfterCompositeSkip = useCallback(() => {
    if (submitting || fieldBusy) return;
    window.setTimeout(() => {
      void goNextRef.current?.();
    }, 0);
  }, [fieldBusy, submitting]);

  const goBack = useCallback(() => {
    if (activeStepIndex === 0 || submitting) return;
    setDirection(-1);
    setStepIndex(Math.max(activeStepIndex - 1, 0));
  }, [activeStepIndex, submitting]);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inTextarea = target?.tagName === "TEXTAREA";
      if (e.key === "Enter" && !e.shiftKey) {
        if (inTextarea) return;
        if (target?.closest("[data-language-rows]")) return;
        if (target?.closest("[data-birth-date]")) return;
        if (target?.closest("[data-education-level]")) return;
        if (target?.closest("[data-work-history]")) return;
        if (target?.closest("[data-legal-last-names]")) return;
        const inSelect = target?.tagName === "SELECT";
        if (inSelect && field?.type === "select") {
          e.preventDefault();
          void goNext();
          return;
        }
        e.preventDefault();
        void goNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        goBack();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [field?.type, goBack, goNext]);

  if (done) {
    return <CompletedView email={user?.email ?? null} />;
  }

  if (!field) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-soft-lavender" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 px-6 py-5">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric-violet/15 ring-1 ring-electric-violet/40">
              <Sparkles className="h-4 w-4 text-soft-lavender" />
            </span>
            <span className="font-display text-sm font-semibold tracking-tight text-off-white/90">
              {qs.brand}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <LanguageSwitcher className="shrink-0" />
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-soft-lavender/70">
              <span>{String(activeStepIndex + 1).padStart(2, "0")}</span>
              <span className="text-soft-lavender/40">/</span>
              <span className="text-soft-lavender/50">
                {String(totalSteps).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-4 h-[2px] w-full max-w-4xl overflow-hidden rounded-full bg-off-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-electric-violet via-soft-lavender to-electric-violet"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 pb-20">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.section
              key={field.key}
              custom={direction}
              variants={{
                enter: (d: number) => ({ opacity: 0, y: d > 0 ? 24 : -24 }),
                center: { opacity: 1, y: 0 },
                exit: (d: number) => ({ opacity: 0, y: d > 0 ? -24 : 24 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              {showSectionBanner && field.sectionTitle ? (
                <div className="rounded-xl border border-electric-violet/25 bg-electric-violet/10 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.26em] text-electric-violet/95">
                    {field.sectionTitle}
                  </p>
                </div>
              ) : null}
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-soft-lavender/60">
                  {qs.questionOrdinal} {activeStepIndex + 1}
                  {field.type === "education-level"
                    ? qs.skipEducationHint
                    : field.type === "work-history"
                      ? qs.skipWorkHint
                      : field.required
                        ? qs.requiredHint
                        : qs.optionalHint}
                </p>
                <h2 className="font-display text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-off-white sm:text-5xl">
                  {field.prompt}
                </h2>
                {field.helper && (
                  <p className="max-w-xl text-base text-soft-lavender/70">
                    {field.helper}
                  </p>
                )}
              </div>

              <FieldRenderer
                field={field}
                answers={answers}
                value={value}
                userId={user?.uid ?? null}
                i18n={i18n}
                onChange={(v) => setValue(field.key, v)}
                onBusy={setFieldBusy}
                onEnter={() => void goNext()}
                afterCompositeSkipped={scheduleAdvanceAfterCompositeSkip}
              />
            </motion.section>
          </AnimatePresence>
        </div>
      </main>

      <footer className="sticky bottom-0 z-20 px-6 pb-8">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={goBack}
            disabled={activeStepIndex === 0 || submitting}
            className="text-soft-lavender/80 hover:text-off-white disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
            {qs.back}
          </Button>

          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-soft-lavender/50">
            <span>{qs.pressEnter}</span>
            <Kbd>
              <CornerDownLeft className="h-3 w-3" /> Enter
            </Kbd>
            <span>{qs.pressEnterContinue}</span>
          </div>

          <Button
            type="button"
            size="lg"
            onClick={() => void goNext()}
            disabled={!stepOk || submitting || fieldBusy}
            className="min-w-[160px]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLast ? (
              <>
                <Check className="h-4 w-4" />
                {qs.submit}
              </>
            ) : (
              <>
                {qs.next}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}

type FieldRendererProps = {
  field: OnboardingField;
  answers: AnswersMap;
  value: string;
  userId: string | null;
  i18n: QuestionnaireI18n;
  onChange: (value: string) => void;
  onBusy: (busy: boolean) => void;
  onEnter: () => void;
  afterCompositeSkipped?: () => void;
};

function BirthDatePicker({
  value,
  onChange,
  monthChoices,
  labels,
}: {
  value: string;
  onChange: (iso: string) => void;
  monthChoices: { value: string; label: string }[];
  labels: EditorUiCopy["birthDate"];
}) {
  const now = useMemo(() => new Date(), []);
  const maxYear = now.getFullYear() - 4;
  const minYear = now.getFullYear() - 100;

  const years = useMemo(() => {
    const ys: number[] = [];
    for (let y = maxYear; y >= minYear; y--) ys.push(y);
    return ys;
  }, [maxYear, minYear]);

  const py =
    value && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? Number(value.slice(0, 4))
      : "";
  const pm =
    value && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? Number(value.slice(5, 7))
      : "";
  const pd =
    value && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? Number(value.slice(8, 10))
      : "";

  const safeYear = typeof py === "number" && py > 0 ? py : maxYear;
  const safeMonth = typeof pm === "number" && pm > 0 ? pm : 1;
  const effectiveYear = typeof py === "number" && py > 0 ? py : safeYear;
  const effectiveMonth = typeof pm === "number" && pm > 0 ? pm : safeMonth;
  const dim = daysInMonth(effectiveYear, effectiveMonth);

  const days = useMemo(() => {
    const list: number[] = [];
    for (let d = 1; d <= dim; d++) list.push(d);
    return list;
  }, [dim]);

  function emit(nextY: number | "", nextM: number | "", nextD: number | "") {
    if (!nextY || !nextM || !nextD) {
      onChange("");
      return;
    }
    const maxD = daysInMonth(nextY, nextM);
    const clampedD = Math.min(nextD, maxD);
    const iso = composeIsoDate(nextY, nextM, clampedD);
    if (isReasonableDateOfBirth(iso)) onChange(iso);
    else onChange("");
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3" data-birth-date="">
      <div>
        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
          {labels.month}
        </label>
        <div className="relative">
          <select
            className={SELECT_FIELD_CLASSES}
            value={pm === "" ? "" : String(pm)}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return emit("", "", "");
              const m = Number(v);
              emit(py === "" ? safeYear : py, m, pd === "" ? 1 : pd);
            }}
          >
            <option value="" disabled className="bg-midnight-navy">
              {labels.month}
            </option>
            {monthChoices.map((choice) => (
              <option
                key={choice.value}
                value={choice.value}
                className="bg-midnight-navy"
              >
                {choice.label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
          {labels.day}
        </label>
        <div className="relative">
          <select
            className={SELECT_FIELD_CLASSES}
            value={pd === "" ? "" : String(pd)}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return emit("", "", "");
              const d = Number(v);
              const baseY = py === "" ? safeYear : py;
              const baseM = pm === "" ? safeMonth : pm;
              emit(baseY, baseM, d);
            }}
          >
            <option value="" disabled className="bg-midnight-navy">
              {labels.day}
            </option>
            {days.map((d) => (
              <option key={d} value={String(d)} className="bg-midnight-navy">
                {String(d).padStart(2, "0")}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
          {labels.year}
        </label>
        <div className="relative">
          <select
            className={SELECT_FIELD_CLASSES}
            value={py === "" ? "" : String(py)}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return emit("", "", "");
              const y = Number(v);
              emit(y, pm === "" ? 1 : pm, pd === "" ? 1 : pd);
            }}
          >
            <option value="" disabled className="bg-midnight-navy">
              {labels.year}
            </option>
            {years.map((y) => (
              <option key={y} value={String(y)} className="bg-midnight-navy">
                {y}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
        </div>
      </div>
    </div>
  );
}

function EducationLevelEditor({
  value,
  onChange,
  mode,
  afterSkipMarked,
  lex,
  ui,
}: {
  value: string;
  onChange: (json: string) => void;
  mode: "standard" | "college";
  afterSkipMarked?: () => void;
  lex: QuestionnaireLexicon;
  ui: EditorUiCopy["education"];
}) {
  const normalized = useMemo(
    () => normalizeEducationPayload(parseEducationPayload(value), mode),
    [value, mode],
  );

  const skipped = normalized.skipped === true;
  const entries = normalized.entries ?? [];

  const persist = useCallback(
    (payload: { skipped: boolean; entries: EducationEntry[] }) => {
      if (payload.skipped) {
        onChange(JSON.stringify({ skipped: true, entries: [] }));
      } else {
        onChange(JSON.stringify({ skipped: false, entries: payload.entries }));
      }
    },
    [onChange],
  );

  const updateEntries = useCallback(
    (nextEntries: EducationEntry[]) => {
      persist({ skipped: false, entries: nextEntries });
    },
    [persist],
  );

  const updateEntry = useCallback(
    (index: number, patch: Partial<EducationEntry>) => {
      updateEntries(
        entries.map((e, i) => (i === index ? { ...e, ...patch } : e)),
      );
    },
    [entries, updateEntries],
  );

  const addEntry = useCallback(() => {
    updateEntries([...entries, emptyEducationEntry(mode)]);
  }, [entries, mode, updateEntries]);

  const removeEntry = useCallback(
    (index: number) => {
      if (entries.length <= 1) return;
      updateEntries(entries.filter((_, i) => i !== index));
    },
    [entries, updateEntries],
  );

  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    const ys: number[] = [];
    for (let y = cy + 1; y >= 1950; y--) ys.push(y);
    return ys;
  }, []);

  return (
    <div className="space-y-6" data-education-level="">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant={skipped ? "primary" : "outline"}
          size="md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            persist({ skipped: true, entries: [] });
            afterSkipMarked?.();
          }}
        >
          {ui.skipLevel}
        </Button>
        {skipped ? (
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="text-soft-lavender"
            onClick={() =>
              persist({
                skipped: false,
                entries: [emptyEducationEntry(mode)],
              })
            }
          >
            {ui.wantToAnswer}
          </Button>
        ) : null}
      </div>

      <div
        className={cn(
          "space-y-6",
          skipped && "pointer-events-none opacity-40",
        )}
      >
        {entries.map((entry, index) => (
          <div
            key={index}
            className="space-y-4 rounded-2xl border border-soft-lavender/15 bg-off-white/[0.03] p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/65">
                {ui.schoolN} {index + 1}
                {mode === "college" ? ui.collegeRowHint : ""}
              </span>
              {entries.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-soft-lavender hover:text-red-300"
                  onClick={() => removeEntry(index)}
                  aria-label={`Remove school ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                {ui.schoolName}
              </label>
              <Input
                value={entry.schoolName}
                disabled={skipped}
                placeholder="e.g. Lincoln Elementary"
                className="h-14 text-lg"
                onChange={(e) =>
                  updateEntry(index, {
                    schoolName: e.target.value,
                  })
                }
              />
            </div>

            <div className="relative space-y-2">
              <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                {ui.institutionType}
              </label>
              <div className="relative">
                <select
                  disabled={skipped}
                  value={entry.institutionType}
                  onChange={(e) =>
                    updateEntry(index, { institutionType: e.target.value })
                  }
                  className={SELECT_FIELD_CLASSES}
                >
                  <option value="" disabled className="bg-midnight-navy">
                    {ui.selectType}
                  </option>
                  {lex.institutionOpts.map((opt) => (
                    <option
                      key={opt.value}
                      value={opt.value}
                      className="bg-midnight-navy"
                    >
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
              </div>
            </div>

            {mode === "college" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative space-y-2">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                    {ui.collegeStatus}
                  </label>
                  <div className="relative">
                    <select
                      disabled={skipped}
                      value={entry.collegeStatus ?? ""}
                      onChange={(e) =>
                        updateEntry(index, {
                          collegeStatus: e.target.value,
                          finishedYear:
                            e.target.value === "finished"
                              ? (entry.finishedYear ?? "")
                              : "",
                        })
                      }
                      className={SELECT_FIELD_CLASSES}
                    >
                      <option value="" disabled className="bg-midnight-navy">
                        {ui.selectStatus}
                      </option>
                      {lex.collegeStatusOpts.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-midnight-navy"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
                  </div>
                </div>

                {(entry.collegeStatus ?? "") === "finished" ? (
                  <div className="relative space-y-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                      {ui.finishedYear}
                    </label>
                    <div className="relative">
                      <select
                        disabled={skipped}
                        value={entry.finishedYear ?? ""}
                        onChange={(e) =>
                          updateEntry(index, {
                            finishedYear: e.target.value,
                          })
                        }
                        className={SELECT_FIELD_CLASSES}
                      >
                        <option value="" disabled className="bg-midnight-navy">
                          {ui.year}
                        </option>
                        {yearOptions.map((y) => (
                          <option
                            key={y}
                            value={String(y)}
                            className="bg-midnight-navy"
                          >
                            {y}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ))}

        {!skipped ? (
          <Button type="button" variant="outline" size="md" onClick={addEntry}>
            <Plus className="h-4 w-4" />
            {ui.addSchool}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function WorkHistoryEditor({
  value,
  onChange,
  afterSkipMarked,
  lex,
  ui,
  monthChoices,
  monthPlaceholder,
  locale,
}: {
  value: string;
  onChange: (json: string) => void;
  afterSkipMarked?: () => void;
  lex: QuestionnaireLexicon;
  ui: EditorUiCopy["work"];
  monthChoices: { value: string; label: string }[];
  monthPlaceholder: string;
  locale: AppLocale;
}) {
  const yesNoChoices = useMemo(
    () => [
      { value: "yes", label: lex.yesLabel },
      { value: "no", label: lex.noLabel },
    ],
    [lex.noLabel, lex.yesLabel],
  );

  const normalized = useMemo(
    () => normalizeWorkHistoryPayload(parseWorkHistoryPayload(value)),
    [value],
  );

  const skipped = normalized.skipped === true;
  const entries = normalized.entries ?? [];

  const persist = useCallback(
    (payload: { skipped: boolean; entries: WorkHistoryEntry[] }) => {
      if (payload.skipped) {
        onChange(JSON.stringify({ skipped: true, entries: [] }));
      } else {
        onChange(JSON.stringify({ skipped: false, entries: payload.entries }));
      }
    },
    [onChange],
  );

  const updateEntries = useCallback(
    (nextEntries: WorkHistoryEntry[]) => {
      persist({ skipped: false, entries: nextEntries });
    },
    [persist],
  );

  const updateEntry = useCallback(
    (index: number, patch: Partial<WorkHistoryEntry>) => {
      updateEntries(
        entries.map((e, i) => (i === index ? { ...e, ...patch } : e)),
      );
    },
    [entries, updateEntries],
  );

  const addEntry = useCallback(() => {
    updateEntries([...entries, emptyWorkHistoryEntry()]);
  }, [entries, updateEntries]);

  const removeEntry = useCallback(
    (index: number) => {
      if (entries.length <= 1) return;
      updateEntries(entries.filter((_, i) => i !== index));
    },
    [entries, updateEntries],
  );

  const yearOptions = useMemo(() => {
    const cy = new Date().getFullYear();
    const ys: number[] = [];
    for (let y = cy + 1; y >= 1950; y--) ys.push(y);
    return ys;
  }, []);

  return (
    <div className="space-y-8" data-work-history="">
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant={skipped ? "primary" : "outline"}
          size="md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            persist({ skipped: true, entries: [] });
            afterSkipMarked?.();
          }}
        >
          {ui.skipSection}
        </Button>
        {skipped ? (
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="text-soft-lavender"
            onClick={() =>
              persist({
                skipped: false,
                entries: [emptyWorkHistoryEntry()],
              })
            }
          >
            {ui.wantRoles}
          </Button>
        ) : null}
      </div>

      <div
        className={cn(
          "space-y-8",
          skipped && "pointer-events-none opacity-40",
        )}
      >
        {entries.map((entry, index) => {
          const durationLabel = formatDurationLabel(entry, locale);
          return (
            <div
              key={index}
              className="space-y-8 rounded-2xl border border-soft-lavender/15 bg-off-white/[0.03] p-5 sm:p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/65">
                  {ui.roleN} {index + 1}
                </span>
                {entries.length > 1 ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-soft-lavender hover:text-red-300"
                    onClick={() => removeEntry(index)}
                    aria-label={`Remove role ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-electric-violet/80">
                  {ui.basicEmployment}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                      {ui.company}
                    </label>
                    <Input
                      value={entry.companyName}
                      disabled={skipped}
                      placeholder="e.g. Acme Corp"
                      className="h-14 text-lg"
                      onChange={(e) =>
                        updateEntry(index, { companyName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                      {ui.jobTitle}
                    </label>
                    <Input
                      value={entry.jobTitle}
                      disabled={skipped}
                      placeholder="e.g. Software engineer"
                      className="h-14 text-lg"
                      onChange={(e) =>
                        updateEntry(index, { jobTitle: e.target.value })
                      }
                    />
                  </div>
                  <div className="relative space-y-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                      {ui.employmentType}
                    </label>
                    <select
                      disabled={skipped}
                      value={entry.employmentType}
                      onChange={(e) =>
                        updateEntry(index, { employmentType: e.target.value })
                      }
                      className={SELECT_FIELD_CLASSES}
                    >
                      <option value="" disabled className="bg-midnight-navy">
                        {ui.selectType}
                      </option>
                      {lex.employmentOpts.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-midnight-navy"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
                  </div>
                  <div className="relative space-y-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                      {ui.workArrangement}
                    </label>
                    <select
                      disabled={skipped}
                      value={entry.workArrangement}
                      onChange={(e) =>
                        updateEntry(index, { workArrangement: e.target.value })
                      }
                      className={SELECT_FIELD_CLASSES}
                    >
                      <option value="" disabled className="bg-midnight-navy">
                        {ui.selectArrangement}
                      </option>
                      {lex.workArrangementOpts.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-midnight-navy"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                      {ui.city}
                    </label>
                    <Input
                      value={entry.locationCity}
                      disabled={skipped}
                      placeholder={ui.city}
                      className="h-14 text-lg"
                      onChange={(e) =>
                        updateEntry(index, { locationCity: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                      {ui.stateProvince}
                    </label>
                    <Input
                      value={entry.locationState}
                      disabled={skipped}
                      placeholder={ui.stateOptionalPlaceholder}
                      className="h-14 text-lg"
                      onChange={(e) =>
                        updateEntry(index, { locationState: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                      {ui.country}
                    </label>
                    <Input
                      value={entry.locationCountry}
                      disabled={skipped}
                      placeholder="e.g. Mexico"
                      className="h-14 text-lg"
                      autoComplete="country-name"
                      onChange={(e) =>
                        updateEntry(index, { locationCountry: e.target.value })
                      }
                    />
                  </div>
                  <div className="relative space-y-2 sm:col-span-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                      {ui.industry}
                    </label>
                    <select
                      disabled={skipped}
                      value={entry.industry}
                      onChange={(e) =>
                        updateEntry(index, { industry: e.target.value })
                      }
                      className={SELECT_FIELD_CLASSES}
                    >
                      <option value="" disabled className="bg-midnight-navy">
                        {ui.selectIndustry}
                      </option>
                      {lex.industryOpts.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-midnight-navy"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-soft-lavender/10 pt-6">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-electric-violet/80">
                  {ui.datesTitle}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="relative space-y-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                      {ui.startMonth}
                    </label>
                    <select
                      disabled={skipped}
                      value={entry.startMonth}
                      onChange={(e) =>
                        updateEntry(index, { startMonth: e.target.value })
                      }
                      className={SELECT_FIELD_CLASSES}
                    >
                      <option value="" disabled className="bg-midnight-navy">
                        {monthPlaceholder}
                      </option>
                      {monthChoices.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-midnight-navy"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
                  </div>
                  <div className="relative space-y-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                      {ui.startYear}
                    </label>
                    <select
                      disabled={skipped}
                      value={entry.startYear}
                      onChange={(e) =>
                        updateEntry(index, { startYear: e.target.value })
                      }
                      className={SELECT_FIELD_CLASSES}
                    >
                      <option value="" disabled className="bg-midnight-navy">
                        {ui.yearShort}
                      </option>
                      {yearOptions.map((y) => (
                        <option
                          key={y}
                          value={String(y)}
                          className="bg-midnight-navy"
                        >
                          {y}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
                  </div>
                </div>

                <div className="relative max-w-md space-y-2">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                    {ui.currentlyHere}
                  </label>
                  <select
                    disabled={skipped}
                    value={entry.currentlyWorking}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateEntry(index, {
                        currentlyWorking: v,
                        ...(v === "yes"
                          ? { endMonth: "", endYear: "" }
                          : {}),
                      });
                    }}
                    className={SELECT_FIELD_CLASSES}
                  >
                    <option value="" disabled className="bg-midnight-navy">
                      {ui.selectOption}
                    </option>
                    {yesNoChoices.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-midnight-navy"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
                </div>

                {entry.currentlyWorking === "no" ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="relative space-y-2">
                      <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                        {ui.endMonth}
                      </label>
                      <select
                        disabled={skipped}
                        value={entry.endMonth}
                        onChange={(e) =>
                          updateEntry(index, { endMonth: e.target.value })
                        }
                        className={SELECT_FIELD_CLASSES}
                      >
                        <option value="" disabled className="bg-midnight-navy">
                          {monthPlaceholder}
                        </option>
                        {monthChoices.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            className="bg-midnight-navy"
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
                    </div>
                    <div className="relative space-y-2">
                      <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                        {ui.endYear}
                      </label>
                      <select
                        disabled={skipped}
                        value={entry.endYear}
                        onChange={(e) =>
                          updateEntry(index, { endYear: e.target.value })
                        }
                        className={SELECT_FIELD_CLASSES}
                      >
                        <option value="" disabled className="bg-midnight-navy">
                          {ui.yearShort}
                        </option>
                        {yearOptions.map((y) => (
                          <option
                            key={y}
                            value={String(y)}
                            className="bg-midnight-navy"
                          >
                            {y}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
                    </div>
                  </div>
                ) : null}

                {durationLabel ? (
                  <p className="text-sm text-soft-lavender/75">
                    <span className="font-medium text-off-white/90">
                      {ui.totalDuration}
                    </span>{" "}
                    {durationLabel}
                  </p>
                ) : null}
              </div>

              <div className="space-y-4 border-t border-soft-lavender/10 pt-6">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-electric-violet/80">
                  {ui.roleDescTitle}
                </h3>
                <div className="space-y-2">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                    {ui.responsibilities}
                  </label>
                  <p className="text-xs text-soft-lavender/55">
                    {ui.responsibilitiesHint}
                  </p>
                  <Textarea
                    disabled={skipped}
                    value={entry.mainResponsibilities}
                    onChange={(e) =>
                      updateEntry(index, {
                        mainResponsibilities: e.target.value,
                      })
                    }
                    placeholder={ui.responsibilitiesPh}
                    rows={4}
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                    {ui.teamDept}
                  </label>
                  <Input
                    value={entry.teamOrDepartment}
                    disabled={skipped}
                    placeholder="e.g. Product design"
                    className="h-14 text-lg"
                    onChange={(e) =>
                      updateEntry(index, { teamOrDepartment: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                    {ui.reportsTo}
                  </label>
                  <Input
                    value={entry.reportsTo}
                    disabled={skipped}
                    placeholder="e.g. Director of Engineering"
                    className="h-14 text-lg"
                    onChange={(e) =>
                      updateEntry(index, { reportsTo: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="relative space-y-2">
                    <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                      {ui.managePeople}
                    </label>
                    <select
                      disabled={skipped}
                      value={entry.managesPeople}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateEntry(index, {
                          managesPeople: v,
                          manageCount:
                            v === "yes" ? entry.manageCount : "",
                        });
                      }}
                      className={SELECT_FIELD_CLASSES}
                    >
                      <option value="" className="bg-midnight-navy">
                        {ui.preferNotAnswer}
                      </option>
                      {yesNoChoices.map((opt) => (
                        <option
                          key={opt.value}
                          value={opt.value}
                          className="bg-midnight-navy"
                        >
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
                  </div>
                  {entry.managesPeople === "yes" ? (
                    <div className="space-y-2">
                      <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                        {ui.howManyManaged}
                      </label>
                      <Input
                        value={entry.manageCount}
                        disabled={skipped}
                        placeholder="e.g. 4"
                        inputMode="numeric"
                        className="h-14 text-lg"
                        onChange={(e) =>
                          updateEntry(index, { manageCount: e.target.value })
                        }
                      />
                    </div>
                  ) : null}
                </div>

                <div className="relative space-y-2">
                  <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
                    {ui.roleLevel}
                  </label>
                  <select
                    disabled={skipped}
                    value={entry.roleLevel}
                    onChange={(e) =>
                      updateEntry(index, { roleLevel: e.target.value })
                    }
                    className={SELECT_FIELD_CLASSES}
                  >
                    <option value="" className="bg-midnight-navy">
                      {ui.preferNotAnswer}
                    </option>
                    {lex.roleLevelOpts.map((opt) => (
                      <option
                        key={opt.value}
                        value={opt.value}
                        className="bg-midnight-navy"
                      >
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
                </div>
              </div>
            </div>
          );
        })}

        {!skipped ? (
          <Button type="button" variant="outline" size="md" onClick={addEntry}>
            <Plus className="h-4 w-4" />
            {ui.addRole}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function LegalLastNamesEditor({
  value,
  onChange,
  ui,
}: {
  value: string;
  onChange: (json: string) => void;
  ui: EditorUiCopy["legalLastNames"];
}) {
  const { primary, additional } = useMemo(
    () => normalizeLegalLastNames(value),
    [value],
  );

  const persist = useCallback(
    (next: LegalLastNamesPayload) => {
      onChange(serializeLegalLastNames(next));
    },
    [onChange],
  );

  const setPrimary = useCallback(
    (v: string) => {
      persist({ primary: v, additional });
    },
    [additional, persist],
  );

  const setAdditional = useCallback(
    (index: number, v: string) => {
      persist({
        primary,
        additional: additional.map((s, i) => (i === index ? v : s)),
      });
    },
    [additional, persist, primary],
  );

  const addAdditional = useCallback(() => {
    persist({ primary, additional: [...additional, ""] });
  }, [additional, persist, primary]);

  const removeAdditional = useCallback(
    (index: number) => {
      persist({
        primary,
        additional: additional.filter((_, i) => i !== index),
      });
    },
    [additional, persist, primary],
  );

  return (
    <div className="space-y-6" data-legal-last-names="">
      <div className="space-y-2">
        <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
          {ui.primaryLabel}
        </label>
        <Input
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          placeholder={ui.primaryPlaceholder}
          autoComplete="family-name"
          className="h-14 text-lg"
        />
      </div>

      {additional.map((s, index) => (
        <div
          key={index}
          className="flex flex-col gap-3 rounded-xl border border-soft-lavender/15 bg-off-white/[0.03] p-4 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <label className="block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
              {ui.additionalLabelPrefix} {index + 1}
            </label>
            <Input
              value={s}
              onChange={(e) => setAdditional(index, e.target.value)}
              placeholder="e.g. López"
              autoComplete="off"
              className="h-14 text-lg"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 self-end text-soft-lavender hover:text-red-300 sm:self-auto"
            onClick={() => removeAdditional(index)}
            aria-label={`${ui.removeAria} ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button type="button" variant="outline" size="md" onClick={addAdditional}>
        <Plus className="h-4 w-4" />
        {ui.addAnother}
      </Button>
    </div>
  );
}

function FieldRenderer({
  field,
  answers,
  value,
  userId,
  i18n,
  onChange,
  onBusy,
  onEnter,
  afterCompositeSkipped,
}: FieldRendererProps) {
  const { locale, lex, editorUi, monthChoices } = i18n;
  const cityMode = useMemo(() => {
    if (field.type !== "city") return null;
    return getCityFieldMode(answers);
  }, [field.type, answers.countryOfResidence, answers.stateOfResidence]);

  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | null>(null);

  useEffect(() => {
    if (
      field.type === "language-rows" ||
      field.type === "profile-photo" ||
      field.type === "birth-date" ||
      field.type === "education-level" ||
      field.type === "work-history" ||
      field.type === "legal-last-names"
    ) {
      return;
    }
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 320);
    return () => window.clearTimeout(id);
  }, [field.key, field.type]);

  if (field.type === "language-rows") {
    return (
      <LanguageRowsEditor
        value={value}
        onChange={onChange}
        dataAttr="language-rows"
        levelOptions={lex.spokenLevelOpts}
        lr={editorUi.languageRows}
      />
    );
  }

  if (field.type === "profile-photo") {
    return (
      <ProfilePhotoPicker
        value={value}
        userId={userId}
        onChange={onChange}
        onBusy={onBusy}
        copy={editorUi.photo}
      />
    );
  }

  if (field.type === "birth-date") {
    return (
      <BirthDatePicker
        value={value}
        onChange={onChange}
        monthChoices={monthChoices}
        labels={editorUi.birthDate}
      />
    );
  }

  if (field.type === "education-level") {
    return (
      <EducationLevelEditor
        value={value}
        onChange={onChange}
        mode={field.educationMode ?? "standard"}
        afterSkipMarked={afterCompositeSkipped}
        lex={lex}
        ui={editorUi.education}
      />
    );
  }

  if (field.type === "work-history") {
    return (
      <WorkHistoryEditor
        value={value}
        onChange={onChange}
        afterSkipMarked={afterCompositeSkipped}
        lex={lex}
        ui={editorUi.work}
        monthChoices={monthChoices}
        monthPlaceholder={editorUi.birthDate.month}
        locale={locale}
      />
    );
  }

  if (field.type === "legal-last-names") {
    return (
      <LegalLastNamesEditor
        value={value}
        onChange={onChange}
        ui={editorUi.legalLastNames}
      />
    );
  }

  if (field.type === "city" && cityMode) {
    if (cityMode.kind === "text") {
      return (
        <div className="space-y-3">
          {cityMode.helper ? (
            <p className="text-sm text-soft-lavender/70">{cityMode.helper}</p>
          ) : null}
          <Input
            ref={inputRef as RefObject<HTMLInputElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={editorUi.city.typeYourCity}
            autoComplete={field.autoComplete}
            className="h-14 text-lg"
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onEnter();
              }
            }}
          />
        </div>
      );
    }

    if (cityMode.options.length === 0) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-amber-200/85">{editorUi.city.loadFail}</p>
          <Input
            ref={inputRef as RefObject<HTMLInputElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={editorUi.city.yourCityPlaceholder}
            className="h-14 text-lg"
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onEnter();
              }
            }}
          />
        </div>
      );
    }

    return (
      <div className="relative">
        <select
          ref={inputRef as RefObject<HTMLSelectElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={SELECT_FIELD_CLASSES}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter();
            }
          }}
        >
          <option value="" disabled className="bg-midnight-navy text-soft-lavender/60">
            {field.placeholder}
          </option>
          {cityMode.options.map((opt, i) => (
            <option
              key={`${opt.value}-${i}`}
              value={opt.value}
              className="bg-midnight-navy text-off-white"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
      </div>
    );
  }

  if (field.type === "select") {
    const opts = field.resolveOptions
      ? field.resolveOptions(answers)
      : field.options ?? [];
    return (
      <div className="relative">
        <select
          ref={inputRef as RefObject<HTMLSelectElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={SELECT_FIELD_CLASSES}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEnter();
            }
          }}
        >
          {field.required ? (
            <option value="" disabled className="bg-midnight-navy text-soft-lavender/60">
              {field.placeholder}
            </option>
          ) : field.allowSkip ? (
            <option value="" className="bg-midnight-navy text-off-white">
              {field.skipOptionLabel ?? "Skip"}
            </option>
          ) : null}
          {opts.map((opt) => (
            <option
              key={opt.value}
              value={opt.value}
              className="bg-midnight-navy text-off-white"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
      </div>
    );
  }

  const inputType =
    field.type === "tel" ? "tel" : field.type === "url" ? "url" : "text";

  return (
    <Input
      ref={inputRef as RefObject<HTMLInputElement>}
      type={inputType}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      autoComplete={field.autoComplete}
      inputMode={field.inputMode}
      className="h-14 text-lg"
      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
      }}
    />
  );
}

function LanguageRowsEditor({
  value,
  onChange,
  dataAttr,
  levelOptions,
  lr,
}: {
  value: string;
  onChange: (json: string) => void;
  dataAttr: string;
  levelOptions: { value: string; label: string }[];
  lr: EditorUiCopy["languageRows"];
}) {
  const rows = parseLanguageRows(value);

  const sync = useCallback(
    (next: LanguageRow[]) => {
      onChange(JSON.stringify(next));
    },
    [onChange],
  );

  const updateRow = (index: number, patch: Partial<LanguageRow>) => {
    const next = rows.map((r, i) => (i === index ? { ...r, ...patch } : r));
    sync(next);
  };

  const addRow = () => {
    sync([...rows, { language: "", level: "" }]);
  };

  const removeRow = (index: number) => {
    sync(rows.filter((_, i) => i !== index));
  };

  const displayRows = rows.length > 0 ? rows : [];

  return (
    <div className="space-y-4" data-language-rows={dataAttr}>
      {displayRows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-soft-lavender/20 bg-off-white/[0.02] px-4 py-6 text-center text-sm text-soft-lavender/75">
          {lr.empty}
        </p>
      ) : (
        <ul className="space-y-4">
          {displayRows.map((row, index) => (
            <li
              key={index}
              className="flex flex-col gap-3 rounded-xl border border-soft-lavender/15 bg-off-white/[0.03] p-4 sm:flex-row sm:items-end"
            >
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-medium uppercase tracking-[0.2em] text-soft-lavender/70">
                  {lr.language}
                </label>
                <Input
                  value={row.language}
                  onChange={(e) => updateRow(index, { language: e.target.value })}
                  placeholder="e.g. English"
                  className="h-12"
                />
              </div>
              <div className="sm:w-52">
                <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-soft-lavender/70">
                  {lr.spokenLevel}
                </label>
                <div className="relative">
                  <select
                    value={row.level}
                    onChange={(e) => updateRow(index, { level: e.target.value })}
                    className={SELECT_FIELD_CLASSES_SM}
                  >
                    <option value="" className="bg-midnight-navy">
                      {lr.selectLevel}
                    </option>
                    {levelOptions.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-midnight-navy">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-soft-lavender/60" />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-soft-lavender hover:text-red-300"
                onClick={() => removeRow(index)}
                aria-label={`${lr.removeRow} ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="outline" size="md" onClick={addRow} className="w-full sm:w-auto">
        <Plus className="h-4 w-4" />
        {lr.addLanguage}
      </Button>
    </div>
  );
}

function ProfilePhotoPicker({
  value,
  userId,
  onChange,
  onBusy,
  copy,
}: {
  value: string;
  userId: string | null;
  onChange: (url: string) => void;
  onBusy: (busy: boolean) => void;
  copy: EditorUiCopy["photo"];
}) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | null) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(copy.errType);
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError(copy.errSize);
      return;
    }

    if (!userId) {
      setError(copy.errAuth);
      return;
    }

    onBusy(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const safeExt =
        ext && ["jpg", "jpeg", "png", "webp", "gif"].includes(ext)
          ? ext
          : "jpg";
      const path = `OmniUsers/${userId}/profile-photo-${Date.now()}.${safeExt}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file, { contentType: file.type });
      const url = await getDownloadURL(storageRef);
      onChange(url);
    } catch {
      setError(copy.errUpload);
      onChange("");
    } finally {
      onBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-1 items-center justify-center gap-3 rounded-xl border border-dashed border-soft-lavender/25 bg-off-white/[0.03] px-6 py-10",
            "transition-all hover:border-soft-lavender/45 hover:bg-off-white/[0.06]",
          )}
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-electric-violet/15 ring-1 ring-electric-violet/35">
            {value ? (
              <img src={value} alt="" className="h-14 w-14 rounded-full object-cover" />
            ) : (
              <ImageIcon className="h-7 w-7 text-soft-lavender" />
            )}
          </div>
          <div className="text-left">
            <p className="flex items-center gap-2 font-medium text-off-white">
              <Upload className="h-4 w-4 text-soft-lavender" />
              {value ? copy.replace : copy.upload}
            </p>
            <p className="mt-1 text-sm text-soft-lavender/65">{copy.sub}</p>
          </div>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
        />
      </div>

      {value ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
          {copy.remove}
        </Button>
      ) : null}

      {error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : null}
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center gap-1 rounded-md border border-soft-lavender/25 bg-off-white/[0.05] px-2 py-0.5 font-sans text-[11px] font-medium tracking-wider text-soft-lavender">
      {children}
    </kbd>
  );
}

function CompletedView({ email }: { email: string | null }) {
  const { locale } = useLocale();
  const qs = UI_STRINGS[locale].questionnaire;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center"
    >
      <motion.div
        initial={{ scale: 0, rotate: -10 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.15, duration: 0.7, type: "spring", bounce: 0.4 }}
        className="relative mb-10"
      >
        <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-electric-violet/40 blur-3xl" />
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-electric-violet to-soft-lavender shadow-[0_25px_60px_-15px_rgba(124,58,237,0.7)]">
          <Check className="h-12 w-12 text-off-white" strokeWidth={2.5} />
        </div>
      </motion.div>

      <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-off-white sm:text-6xl">
        <span className="gradient-text">{qs.completedHeading}</span>
      </h1>
      <p className="mt-6 max-w-lg text-balance text-base text-soft-lavender/80 sm:text-lg">
        {email ? (
          <>
            {qs.completedLine1BeforeEmail}
            <span className="text-off-white">{email}</span>
            {qs.completedLine1AfterEmail}{" "}
          </>
        ) : (
          <>{qs.completedLine1NoEmail}{" "}</>
        )}
        {qs.completedLine2}
      </p>
    </motion.div>
  );
}
