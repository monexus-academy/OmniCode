import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

export type SchoolEntry = {
  schoolName?: string;
  institutionType?: string;
  yearStarted?: string;
  yearFinished?: string;
  hasCertificate?: "yes" | "no" | "";
};

export type UniversityEntry = SchoolEntry & {
  status?: "studying" | "graduated" | "dropped" | "";
  graduationYear?: string;
};

export type EducationData = {
  kindergarten: SchoolEntry[];
  primary: SchoolEntry[];
  secondary: SchoolEntry[];
  highSchool: SchoolEntry[];
  university: UniversityEntry[];
};

export type WorkEntry = {
  company?: string;
  position?: string;
  employmentType?: string;
  modality?: string;
  city?: string;
  state?: string;
  country?: string;
  industry?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorking?: boolean;
  responsibilities?: string;
  teamSize?: string;
  reportedTo?: string;
  managedPeople?: "yes" | "no" | "";
  managedCount?: string;
  positionLevel?: string;
};

export type LanguageEntry = {
  language?: string;
  level?: string;
};

export type OmniUserProfile = {
  email: string;

  // Step 1 — Personal
  legalFirstName?: string;
  legalLastName?: string;
  preferredDisplayName?: string;
  dateOfBirth?: string;
  gender?: string;
  countryOfResidence?: string;
  stateOfResidence?: string;
  cityOfResidence?: string;
  primarySpokenLanguage?: string;

  // Step 2 — Education (all optional)
  education?: EducationData;

  // Step 3 — Work (all optional)
  workExperience?: WorkEntry[];

  // Step 4 — Profile & contact (all optional)
  otherLanguages?: LanguageEntry[];
  phoneNumber?: string;
  pronouns?: string;
  placeOfBirthCity?: string;
  placeOfBirthCountry?: string;
  nationalityCitizenship?: string;
  secondNationality?: string;
  linkedinUrl?: string;
  websiteUrl?: string;

  // Step 5 — About OMNI
  omniPurpose?: string;
  omniPurposeOther?: string;

  // Meta
  registrationStatus?: "in_progress" | "complete";
  furthestStepReached?: number;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type OmniUserProfileUpdate = Partial<Omit<OmniUserProfile, "createdAt" | "updatedAt">>;

const COLLECTION = "OmniUsers";

export async function getUserProfile(uid: string): Promise<OmniUserProfile | null> {
  const ref = doc(db, COLLECTION, uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as OmniUserProfile;
}

export async function initUserProfile(uid: string, email: string): Promise<void> {
  const ref = doc(db, COLLECTION, uid);
  const existing = await getDoc(ref);
  if (existing.exists()) return;
  await setDoc(ref, {
    email,
    registrationStatus: "in_progress",
    furthestStepReached: 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

function pruneUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined) continue;
    out[k] = v;
  }
  return out as Partial<T>;
}

export async function saveUserProfile(
  uid: string,
  patch: OmniUserProfileUpdate,
): Promise<void> {
  const ref = doc(db, COLLECTION, uid);
  const cleaned = pruneUndefined(patch as Record<string, unknown>);
  await setDoc(
    ref,
    {
      ...cleaned,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
