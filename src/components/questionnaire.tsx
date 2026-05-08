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
  ONBOARDING_FIELDS,
  SPOKEN_LEVEL_OPTIONS,
  type OnboardingField,
} from "@/lib/onboarding-fields";
import { storage } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

type Answers = Record<string, string>;

type QuestionnaireProps = {
  onComplete: (answers: Answers) => Promise<void> | void;
};

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
    if (field.type === "date" && !value.trim()) return !field.required;
    return true;
  }

  switch (field.type) {
    case "language-rows":
      return languageRowsValid(value, !!field.required);
    case "date":
      return isReasonableDateOfBirth(value);
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

  const totalSteps = ONBOARDING_FIELDS.length;
  const isLast = stepIndex === totalSteps - 1;
  const field = ONBOARDING_FIELDS[stepIndex];
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
    return ((stepIndex + chunk) / totalSteps) * 100;
  }, [field.key, field.type, stepIndex, totalSteps, value]);

  const stepOk = isStepValid(field, value);

  const setValue = useCallback((key: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  }, []);

  const goNext = useCallback(async () => {
    if (!stepOk || submitting || fieldBusy) return;
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
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  }, [
    answers,
    field.key,
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
      const inSelect = target?.tagName === "SELECT";
      if (e.key === "Enter" && !e.shiftKey) {
        if (inTextarea) return;
        if (inSelect && field.type === "select") {
          e.preventDefault();
          void goNext();
          return;
        }
        if (
          target?.closest("[data-language-rows]")
        ) {
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
  }, [field.type, goBack, goNext]);

  if (done) {
    return <CompletedView email={user?.email ?? null} />;
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
                  {field.required ? "" : " · optional"}
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
  value: string;
  userId: string | null;
  onChange: (value: string) => void;
  onBusy: (busy: boolean) => void;
  onEnter: () => void;
};

function FieldRenderer({
  field,
  value,
  userId,
  onChange,
  onBusy,
  onEnter,
}: FieldRendererProps) {
  const inputRef = useRef<
    HTMLInputElement | HTMLSelectElement | null
  >(null);

  useEffect(() => {
    if (
      field.type === "language-rows" ||
      field.type === "profile-photo"
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

  if (field.type === "select" && field.options) {
    return (
      <div className="relative">
        <select
          ref={inputRef as RefObject<HTMLSelectElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-14 w-full appearance-none rounded-xl border border-soft-lavender/15 bg-off-white/[0.03] px-4 pr-12 text-lg text-off-white",
            "transition-all duration-300 hover:border-soft-lavender/30 hover:bg-off-white/[0.05]",
            "focus:border-electric-violet/70 focus:bg-off-white/[0.06] focus:outline-none focus:ring-4 focus:ring-electric-violet/15",
          )}
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
          {field.options.map((opt) => (
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
    field.type === "date"
      ? "date"
      : field.type === "tel"
        ? "tel"
        : field.type === "url"
          ? "url"
          : "text";

  return (
    <Input
      ref={inputRef as RefObject<HTMLInputElement>}
      type={inputType}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      autoComplete={field.autoComplete}
      inputMode={field.inputMode}
      max={field.type === "date" ? new Date().toISOString().slice(0, 10) : undefined}
      min={field.type === "date" ? "1900-01-01" : undefined}
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
                    className={cn(
                      "h-12 w-full appearance-none rounded-xl border border-soft-lavender/15 bg-off-white/[0.03] px-3 pr-10 text-sm text-off-white",
                      "focus:border-electric-violet/70 focus:outline-none focus:ring-4 focus:ring-electric-violet/15",
                    )}
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
      const path = `profiles/${userId}/profile-photo-${Date.now()}.${safeExt}`;
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
