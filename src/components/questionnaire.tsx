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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getVisibleOnboardingFields,
  INSTITUTION_TYPE_OPTIONS,
  SPOKEN_LEVEL_OPTIONS,
  type AnswersMap,
  type OnboardingField,
} from "@/lib/onboarding-fields";
import { getCityFieldMode } from "@/lib/city-options";
import { storage } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

type Answers = AnswersMap;

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

const COLLEGE_STATUS_OPTIONS = [
  { value: "currently-studying", label: "Currently studying" },
  { value: "finished", label: "Finished / graduated" },
] as const;

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

function isStepValid(field: OnboardingField, value: string): boolean {
  if (!field.required && field.type !== "language-rows") {
    if (field.type === "url") return optionalUrlValid(value);
    if (
      (field.type === "birth-date" || field.type === "education-level") &&
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
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [fieldBusy, setFieldBusy] = useState(false);

  const visibleFields = useMemo(
    () => getVisibleOnboardingFields(answers),
    [answers],
  );

  useEffect(() => {
    setStepIndex((idx) => {
      if (visibleFields.length === 0) return 0;
      return Math.min(idx, visibleFields.length - 1);
    });
  }, [visibleFields]);

  const totalSteps = visibleFields.length;
  const field = visibleFields[stepIndex];
  const value =
    field.type === "language-rows"
      ? (answers[field.key] ?? "[]")
      : (answers[field.key] ?? "");

  const progress = useMemo(() => {
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
    if (field.type === "birth-date" && isReasonableDateOfBirth(value)) {
      chunk = 0.5;
    }
    return ((stepIndex + chunk) / Math.max(totalSteps, 1)) * 100;
  }, [field.key, field.type, stepIndex, totalSteps, value]);

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

  const isLast = stepIndex >= totalSteps - 1;

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
    setStepIndex((i) => Math.min(i + 1, Math.max(totalSteps - 1, 0)));
  }, [
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

  const goBack = useCallback(() => {
    if (stepIndex === 0 || submitting) return;
    setDirection(-1);
    setStepIndex((i) => Math.max(i - 1, 0));
  }, [stepIndex, submitting]);

  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inTextarea = target?.tagName === "TEXTAREA";
      if (e.key === "Enter" && !e.shiftKey) {
        if (inTextarea) return;
        if (target?.closest("[data-language-rows]")) return;
        if (target?.closest("[data-birth-date]")) return;
        if (target?.closest("[data-education-level]")) return;
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
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric-violet/15 ring-1 ring-electric-violet/40">
              <Sparkles className="h-4 w-4 text-soft-lavender" />
            </span>
            <span className="font-display text-sm font-semibold tracking-tight text-off-white/90">
              Omnitest
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-soft-lavender/70">
            <span>{String(stepIndex + 1).padStart(2, "0")}</span>
            <span className="text-soft-lavender/40">/</span>
            <span className="text-soft-lavender/50">
              {String(totalSteps).padStart(2, "0")}
            </span>
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
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-soft-lavender/60">
                  Question {stepIndex + 1}
                  {field.type === "education-level"
                    ? " · skip if unsure"
                    : field.required
                      ? ""
                      : " · optional"}
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
                onChange={(v) => setValue(field.key, v)}
                onBusy={setFieldBusy}
                onEnter={() => void goNext()}
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
            disabled={stepIndex === 0 || submitting}
            className="text-soft-lavender/80 hover:text-off-white disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-soft-lavender/50">
            <span>Press</span>
            <Kbd>
              <CornerDownLeft className="h-3 w-3" /> Enter
            </Kbd>
            <span>to continue</span>
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
                Submit
              </>
            ) : (
              <>
                Next
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
  onChange: (value: string) => void;
  onBusy: (busy: boolean) => void;
  onEnter: () => void;
};

function BirthDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  const now = useMemo(() => new Date(), []);
  const maxYear = now.getFullYear() - 4;
  const minYear = now.getFullYear() - 100;

  const years = useMemo(() => {
    const ys: number[] = [];
    for (let y = maxYear; y >= minYear; y--) ys.push(y);
    return ys;
  }, [maxYear, minYear]);

  const months = useMemo(
    () =>
      [
        [1, "January"],
        [2, "February"],
        [3, "March"],
        [4, "April"],
        [5, "May"],
        [6, "June"],
        [7, "July"],
        [8, "August"],
        [9, "September"],
        [10, "October"],
        [11, "November"],
        [12, "December"],
      ] as const,
    [],
  );

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
          Month
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
              Month
            </option>
            {months.map(([num, label]) => (
              <option key={num} value={String(num)} className="bg-midnight-navy">
                {label}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-soft-lavender/60" />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-medium uppercase tracking-[0.22em] text-soft-lavender/75">
          Day
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
              Day
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
          Year
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
              Year
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
}: {
  value: string;
  onChange: (json: string) => void;
  mode: "standard" | "college";
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
          onClick={() => persist({ skipped: true, entries: [] })}
        >
          Skip this level
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
            I want to answer
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
                School {index + 1}
                {mode === "college" ? " · mark finished vs still enrolled per row" : ""}
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
                School / institution name
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
                Type of institution
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
                    Select type
                  </option>
                  {INSTITUTION_TYPE_OPTIONS.map((opt) => (
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
                    Status at this institution
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
                        Select status
                      </option>
                      {COLLEGE_STATUS_OPTIONS.map((opt) => (
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
                      Finished / graduated in
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
                          Year
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
            Add another school at this level
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function FieldRenderer({
  field,
  answers,
  value,
  userId,
  onChange,
  onBusy,
  onEnter,
}: FieldRendererProps) {
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
      field.type === "education-level"
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
      />
    );
  }

  if (field.type === "birth-date") {
    return <BirthDatePicker value={value} onChange={onChange} />;
  }

  if (field.type === "education-level") {
    return (
      <EducationLevelEditor
        value={value}
        onChange={onChange}
        mode={field.educationMode ?? "standard"}
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
            placeholder="Type your city"
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
          <p className="text-sm text-amber-200/85">
            We couldn't load cities for this state. Please type your city below.
          </p>
          <Input
            ref={inputRef as RefObject<HTMLInputElement>}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Your city"
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
}: {
  value: string;
  onChange: (json: string) => void;
  dataAttr: string;
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
          No additional languages yet. Tap add if you speak others.
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
                  Language
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
                  Spoken level
                </label>
                <div className="relative">
                  <select
                    value={row.level}
                    onChange={(e) => updateRow(index, { level: e.target.value })}
                    className={SELECT_FIELD_CLASSES_SM}
                  >
                    <option value="" className="bg-midnight-navy">
                      Select level
                    </option>
                    {SPOKEN_LEVEL_OPTIONS.map((opt) => (
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
                aria-label={`Remove language row ${index + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Button type="button" variant="outline" size="md" onClick={addRow} className="w-full sm:w-auto">
        <Plus className="h-4 w-4" />
        Add a language
      </Button>
    </div>
  );
}

function ProfilePhotoPicker({
  value,
  userId,
  onChange,
  onBusy,
}: {
  value: string;
  userId: string | null;
  onChange: (url: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFile(file: File | null) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG or PNG).");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setError("That file is too large. Try under 4 MB.");
      return;
    }

    if (!userId) {
      setError("You need to be signed in to upload a photo.");
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
      setError("Upload failed. Check Storage rules or try again.");
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
              {value ? "Replace photo" : "Upload a photo"}
            </p>
            <p className="mt-1 text-sm text-soft-lavender/65">
              JPG or PNG · optional
            </p>
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
          Remove photo
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
        <span className="gradient-text">All set.</span>
      </h1>
      <p className="mt-6 max-w-lg text-balance text-base text-soft-lavender/80 sm:text-lg">
        {email ? (
          <>
            Thanks for completing your profile,{" "}
            <span className="text-off-white">{email}</span>.
          </>
        ) : (
          "Thanks for completing your profile."
        )}{" "}
        Your responses have been recorded — your Omnitest journey begins now.
      </p>
    </motion.div>
  );
}
