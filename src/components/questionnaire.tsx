"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CornerDownLeft,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ONBOARDING_FIELDS, type OnboardingField } from "@/lib/onboarding-fields";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

type Answers = Record<string, string>;

type QuestionnaireProps = {
  onComplete: (answers: Answers) => Promise<void> | void;
};

export function Questionnaire({ onComplete }: QuestionnaireProps) {
  const { user } = useAuth();
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [direction, setDirection] = useState<1 | -1>(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const totalSteps = ONBOARDING_FIELDS.length;
  const isLast = stepIndex === totalSteps - 1;
  const field = ONBOARDING_FIELDS[stepIndex];
  const value = answers[field.key] ?? "";

  const progress = useMemo(
    () => ((stepIndex + (value ? 0.5 : 0)) / totalSteps) * 100,
    [stepIndex, totalSteps, value],
  );

  const isAnswerValid = useCallback(
    (f: OnboardingField, v: string) => {
      if (!f.required) return true;
      return v.trim().length > 0;
    },
    [],
  );

  const setValue = useCallback((key: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [key]: val }));
  }, []);

  const goNext = useCallback(async () => {
    if (!isAnswerValid(field, value) || submitting) return;
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
  }, [answers, field, isAnswerValid, isLast, onComplete, submitting, totalSteps, value]);

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
        e.preventDefault();
        void goNext();
      } else if (e.key === "Escape") {
        e.preventDefault();
        goBack();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goNext, goBack]);

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
                onChange={(v) => setValue(field.key, v)}
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
            disabled={!isAnswerValid(field, value) || submitting}
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
  onChange: (value: string) => void;
  onEnter: () => void;
};

function FieldRenderer({ field, value, onChange, onEnter }: FieldRendererProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 320);
    return () => window.clearTimeout(id);
  }, [field.key]);

  if (field.type === "textarea") {
    return (
      <Textarea
        ref={inputRef as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={5}
        onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            onEnter();
          }
        }}
        className="text-lg"
      />
    );
  }

  if (field.type === "select" && field.options) {
    return (
      <div className="relative">
        <select
          ref={inputRef as React.RefObject<HTMLSelectElement>}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-14 w-full appearance-none rounded-xl border border-soft-lavender/15 bg-off-white/[0.03] px-4 pr-12 text-lg text-off-white",
            "transition-all duration-300 hover:border-soft-lavender/30 hover:bg-off-white/[0.05]",
            "focus:border-electric-violet/70 focus:bg-off-white/[0.06] focus:outline-none focus:ring-4 focus:ring-electric-violet/15",
          )}
        >
          <option value="" disabled className="bg-midnight-navy text-soft-lavender/60">
            {field.placeholder}
          </option>
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

  return (
    <Input
      ref={inputRef as React.RefObject<HTMLInputElement>}
      type={field.type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      autoComplete={field.autoComplete}
      inputMode={field.inputMode}
      className="h-14 text-lg"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
      }}
    />
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
          <>Thanks for completing your profile, <span className="text-off-white">{email}</span>.</>
        ) : (
          "Thanks for completing your profile."
        )}{" "}
        Your responses have been recorded — your Omnitest journey begins now.
      </p>
    </motion.div>
  );
}
