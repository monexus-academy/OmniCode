"use client";

import { useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { AmbientBackground } from "@/components/ambient-background";
import { Questionnaire } from "@/components/questionnaire";
import { StartScreen } from "@/components/start-screen";
import { WelcomeScreen } from "@/components/welcome-screen";
import { useAuth } from "@/lib/auth-context";
import {
  PROFILE_EDUCATION_STEP_KEYS,
  canonicalAnswersForFirestore,
} from "@/lib/canonical-firestore-answers";
import type { AnswersMap } from "@/lib/onboarding-fields";
import { db } from "@/lib/firebase";

function splitLegalLastNamesForFirestore(raw: string): {
  legalLastName: string;
  additionalLegalLastNames: string[];
} {
  try {
    const p = JSON.parse(raw ?? "{}") as unknown;
    if (p && typeof p === "object") {
      const o = p as Record<string, unknown>;
      const primary =
        typeof o.primary === "string" ? o.primary.trim() : "";
      const add = o.additional;
      const additional = Array.isArray(add)
        ? add
            .filter((x): x is string => typeof x === "string")
            .map((s) => s.trim())
            .filter((s) => s.length > 0)
        : [];
      return { legalLastName: primary, additionalLegalLastNames: additional };
    }
  } catch {
    /* treat as legacy plain-text answer */
  }
  return {
    legalLastName: (raw ?? "").trim(),
    additionalLegalLastNames: [],
  };
}

type Stage = "start" | "questionnaire";

export function Experience() {
  const { user, loading } = useAuth();
  const [stage, setStage] = useState<Stage>("start");

  const handleStart = useCallback(() => setStage("questionnaire"), []);

  const handleComplete = useCallback(
    async (answers: Record<string, string>) => {
      if (!user) return;

      answers = canonicalAnswersForFirestore(
        answers as AnswersMap,
      ) as Record<string, string>;

      let additionalLanguagesParsed: { language: string; level: string }[] = [];
      try {
        const raw = answers.additionalLanguages ?? "[]";
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          additionalLanguagesParsed = parsed
            .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
            .map((item) => ({
              language:
                typeof item.language === "string" ? item.language.trim() : "",
              level: typeof item.level === "string" ? item.level : "",
            }))
            .filter((row) => row.language.length > 0 && row.level.length > 0);
        }
      } catch {
        additionalLanguagesParsed = [];
      }

      const { additionalLanguages: _drop, ...rest } = answers;

      let workHistoryParsed: Record<string, unknown> = { skipped: true, entries: [] };
      const rawWork = answers.workHistory;
      if (typeof rawWork === "string" && rawWork.trim()) {
        try {
          workHistoryParsed = JSON.parse(rawWork) as Record<string, unknown>;
        } catch {
          workHistoryParsed = { skipped: true, entries: [] };
        }
      }

      const educationSnapshot: Record<string, unknown> = {};
      const eduFirestoreKey: Record<
        (typeof PROFILE_EDUCATION_STEP_KEYS)[number],
        string
      > = {
        education_kindergarten: "kindergarten",
        education_elementary: "elementary",
        education_middleSchool: "middleSchool",
        education_highSchool: "highSchool",
        education_college: "college",
      };

      for (const key of PROFILE_EDUCATION_STEP_KEYS) {
        const raw = answers[key];
        try {
          educationSnapshot[eduFirestoreKey[key]] = JSON.parse(raw ?? "{}");
        } catch {
          educationSnapshot[eduFirestoreKey[key]] = { skipped: true };
        }
      }

      const scalars = { ...rest } as Record<string, unknown>;
      for (const key of PROFILE_EDUCATION_STEP_KEYS) {
        delete scalars[key];
      }
      delete scalars.workHistory;

      const lnSplit = splitLegalLastNamesForFirestore(
        String(scalars.legalLastName ?? ""),
      );
      scalars.legalLastName = lnSplit.legalLastName;
      scalars.additionalLegalLastNames = lnSplit.additionalLegalLastNames;

      const payload: Record<string, unknown> = {
        ...scalars,
        additionalLanguages: additionalLanguagesParsed,
        educationHistory: educationSnapshot,
        workHistory: workHistoryParsed,
        email: user.email,
        updatedAt: serverTimestamp(),
      };

      if (scalars.countryOfResidence === "ca") {
        delete payload.stateOfResidence;
      }

      try {
        await setDoc(doc(db, "OmniUsers", user.uid), payload, {
          merge: true,
        });
      } catch (err) {
        console.error("Failed to persist profile", err);
      }
    },
    [user],
  );

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AmbientBackground />

      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex min-h-screen items-center justify-center"
          >
            <Loader2 className="h-8 w-8 animate-spin text-soft-lavender" />
          </motion.div>
        ) : !user ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <WelcomeScreen />
          </motion.div>
        ) : stage === "start" ? (
          <motion.div
            key="start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <StartScreen onStart={handleStart} />
          </motion.div>
        ) : (
          <motion.div
            key="questionnaire"
            initial={{ opacity: 0, scale: 0.985 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.985 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Questionnaire onComplete={handleComplete} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
