"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import {
  type EducationData,
  type LanguageEntry,
  type OmniUserProfile,
  type OmniUserProfileUpdate,
  type SchoolEntry,
  type UniversityEntry,
  type WorkEntry,
  getUserProfile,
  saveUserProfile,
} from "@/lib/user-profile";

const TOTAL_STEPS = 5;

type EduLevelKey = "kindergarten" | "primary" | "secondary" | "highSchool" | "university";

const EMPTY_EDU: EducationData = {
  kindergarten: [],
  primary: [],
  secondary: [],
  highSchool: [],
  university: [],
};

function emptySchool(): SchoolEntry {
  return { schoolName: "", institutionType: "", yearStarted: "", yearFinished: "", hasCertificate: "" };
}
function emptyUniversity(): UniversityEntry {
  return { ...emptySchool(), status: "", graduationYear: "" };
}
function emptyWork(): WorkEntry {
  return {
    company: "",
    position: "",
    employmentType: "",
    modality: "",
    city: "",
    state: "",
    country: "",
    industry: "",
    startDate: "",
    endDate: "",
    currentlyWorking: false,
    responsibilities: "",
    teamSize: "",
    reportedTo: "",
    managedPeople: "",
    managedCount: "",
    positionLevel: "",
  };
}
function emptyLang(): LanguageEntry { return { language: "", level: "" }; }

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [hydrating, setHydrating] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  // Step 1
  const [legalFirstName, setLegalFirstName] = useState("");
  const [legalLastName, setLegalLastName] = useState("");
  const [preferredDisplayName, setPreferredDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [countryOfResidence, setCountryOfResidence] = useState("");
  const [stateOfResidence, setStateOfResidence] = useState("");
  const [cityOfResidence, setCityOfResidence] = useState("");
  const [primarySpokenLanguage, setPrimarySpokenLanguage] = useState("");

  // Step 2
  const [education, setEducation] = useState<EducationData>(EMPTY_EDU);
  const [expandedLevels, setExpandedLevels] = useState<Record<EduLevelKey, boolean>>({
    kindergarten: false, primary: false, secondary: false, highSchool: false, university: false,
  });

  // Step 3
  const [workExperience, setWorkExperience] = useState<WorkEntry[]>([]);
  const [expandedWorkDetails, setExpandedWorkDetails] = useState<Record<number, boolean>>({});

  // Step 4
  const [otherLanguages, setOtherLanguages] = useState<LanguageEntry[]>([]);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [pronouns, setPronouns] = useState("");
  const [placeOfBirthCity, setPlaceOfBirthCity] = useState("");
  const [placeOfBirthCountry, setPlaceOfBirthCountry] = useState("");
  const [nationalityCitizenship, setNationalityCitizenship] = useState("");
  const [secondNationality, setSecondNationality] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");

  // Step 5
  const [omniPurpose, setOmniPurpose] = useState("");
  const [omniPurposeOther, setOmniPurposeOther] = useState("");

  const [submitDone, setSubmitDone] = useState(false);

  // Auth gate
  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [loading, user, router]);

  // Hydrate from Firestore
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await getUserProfile(user.uid);
        if (cancelled || !data) {
          setHydrating(false);
          return;
        }
        applyProfileToState(data);
        if (data.registrationStatus === "complete") {
          setSubmitDone(true);
        }
      } finally {
        if (!cancelled) setHydrating(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function applyProfileToState(data: OmniUserProfile) {
    setLegalFirstName(data.legalFirstName ?? "");
    setLegalLastName(data.legalLastName ?? "");
    setPreferredDisplayName(data.preferredDisplayName ?? "");
    setDateOfBirth(data.dateOfBirth ?? "");
    setGender(data.gender ?? "");
    setCountryOfResidence(data.countryOfResidence ?? "");
    setStateOfResidence(data.stateOfResidence ?? "");
    setCityOfResidence(data.cityOfResidence ?? "");
    setPrimarySpokenLanguage(data.primarySpokenLanguage ?? "");

    if (data.education) {
      setEducation({
        kindergarten: data.education.kindergarten ?? [],
        primary: data.education.primary ?? [],
        secondary: data.education.secondary ?? [],
        highSchool: data.education.highSchool ?? [],
        university: data.education.university ?? [],
      });
    }
    if (data.workExperience) setWorkExperience(data.workExperience);
    if (data.otherLanguages) setOtherLanguages(data.otherLanguages);

    setPhoneNumber(data.phoneNumber ?? "");
    setPronouns(data.pronouns ?? "");
    setPlaceOfBirthCity(data.placeOfBirthCity ?? "");
    setPlaceOfBirthCountry(data.placeOfBirthCountry ?? "");
    setNationalityCitizenship(data.nationalityCitizenship ?? "");
    setSecondNationality(data.secondNationality ?? "");
    setLinkedinUrl(data.linkedinUrl ?? "");
    setWebsiteUrl(data.websiteUrl ?? "");

    setOmniPurpose(data.omniPurpose ?? "");
    setOmniPurposeOther(data.omniPurposeOther ?? "");

    setFurthestStep(data.furthestStepReached ?? 1);
  }

  function buildPatchForStep(step: number): OmniUserProfileUpdate {
    switch (step) {
      case 1:
        return {
          legalFirstName: legalFirstName.trim() || undefined,
          legalLastName: legalLastName.trim() || undefined,
          preferredDisplayName: preferredDisplayName.trim() || undefined,
          dateOfBirth: dateOfBirth || undefined,
          gender: gender || undefined,
          countryOfResidence: countryOfResidence || undefined,
          stateOfResidence: stateOfResidence || undefined,
          cityOfResidence: cityOfResidence.trim() || undefined,
          primarySpokenLanguage: primarySpokenLanguage || undefined,
        };
      case 2:
        return { education };
      case 3:
        return { workExperience };
      case 4:
        return {
          otherLanguages,
          phoneNumber: phoneNumber.trim() || undefined,
          pronouns: pronouns || undefined,
          placeOfBirthCity: placeOfBirthCity.trim() || undefined,
          placeOfBirthCountry: placeOfBirthCountry.trim() || undefined,
          nationalityCitizenship: nationalityCitizenship.trim() || undefined,
          secondNationality: secondNationality.trim() || undefined,
          linkedinUrl: linkedinUrl.trim() || undefined,
          websiteUrl: websiteUrl.trim() || undefined,
        };
      case 5:
        return {
          omniPurpose: omniPurpose || undefined,
          omniPurposeOther: omniPurpose === "other" ? (omniPurposeOther.trim() || undefined) : undefined,
        };
      default:
        return {};
    }
  }

  function validateStep(step: number): string | null {
    if (step === 1) {
      if (!legalFirstName.trim()) return "Please enter your legal first name.";
      if (!legalLastName.trim()) return "Please enter your legal last name.";
      if (!dateOfBirth) return "Please enter your date of birth.";
      if (!countryOfResidence) return "Please select your country of residence.";
      if (!cityOfResidence.trim()) return "Please enter your city of residence.";
      if (!primarySpokenLanguage) return "Please select your primary language.";
    }
    if (step === 5) {
      if (!omniPurpose) return "Please select your main reason for taking OMNI.";
      if (omniPurpose === "other" && !omniPurposeOther.trim()) {
        return "Please describe your reason.";
      }
    }
    return null;
  }

  async function persistStep(step: number, extra?: OmniUserProfileUpdate) {
    if (!user) return;
    const patch = { ...buildPatchForStep(step), ...(extra ?? {}) };
    setSaving(true);
    try {
      await saveUserProfile(user.uid, patch);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1600);
    } finally {
      setSaving(false);
    }
  }

  async function nextStep() {
    setStepError(null);
    const err = validateStep(currentStep);
    if (err) { setStepError(err); return; }

    const isFinal = currentStep === TOTAL_STEPS;
    const newFurthest = Math.max(furthestStep, currentStep + (isFinal ? 0 : 1));

    try {
      await persistStep(currentStep, {
        furthestStepReached: newFurthest,
        registrationStatus: isFinal ? "complete" : "in_progress",
      });
    } catch (e) {
      setStepError(e instanceof Error ? e.message : "Could not save. Try again.");
      return;
    }

    setFurthestStep(newFurthest);

    if (isFinal) {
      setSubmitDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function prevStep() {
    setStepError(null);
    if (currentStep > 1) {
      // Save silently on the way back too, so revisions persist
      try { await persistStep(currentStep); } catch { /* ignore */ }
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function skipStep() {
    setStepError(null);
    if (currentStep >= 2 && currentStep <= 4) {
      const newFurthest = Math.max(furthestStep, currentStep + 1);
      try {
        await persistStep(currentStep, { furthestStepReached: newFurthest });
      } catch { /* ignore */ }
      setFurthestStep(newFurthest);
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function jumpToStep(n: number) {
    if (n === currentStep) return;
    if (n < 1 || n > TOTAL_STEPS) return;
    if (n > furthestStep && n > currentStep + 1) return;
    setStepError(null);
    try { await persistStep(currentStep); } catch { /* ignore */ }
    setCurrentStep(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleExit() {
    setStepError(null);
    try { await persistStep(currentStep); } catch { /* ignore */ }
    router.push("/");
  }

  // ---------- Render ----------
  if (loading || hydrating) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <style jsx>{`
          .loading-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #fff; }
          .spinner {
            width: 32px; height: 32px; border: 2px solid #e5e5e5;
            border-top-color: #000; border-radius: 50%; animation: spin 0.9s linear infinite;
          }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (submitDone) return <SuccessScreen onBack={() => router.push("/")} />;

  const showStateMx = countryOfResidence === "MX";
  const showStateUs = countryOfResidence === "US";

  return (
    <div className="reg-shell">
      <header className="omni-header">
        <div className="brand-block">
          <div className="brand">
            <span className="brand-name">MONEXUS</span>
          </div>
          <div className="brand-divider" />
          <div className="context-label">OMNI Registration</div>
        </div>
        <div className="header-right">
          <button type="button" className="exit-btn" onClick={handleExit}>
            <span>{savedFlash ? "Saved ✓" : "Save & exit"}</span>
            <svg width="11" height="11" viewBox="0 0 11 11"><path d="M1 1l9 9M10 1l-9 9" stroke="currentColor" strokeWidth="1.4" /></svg>
          </button>
        </div>
      </header>

      <div className="progress-section">
        <div className="stepper">
          {["Personal", "Education", "Work", "Profile", "About OMNI"].map((label, i) => {
            const n = i + 1;
            const status =
              n < currentStep ? "done" :
              n === currentStep ? "active" : "";
            const clickable = n <= furthestStep || n === currentStep + 1;
            return (
              <div
                key={label}
                className={`stepper-item ${status} ${clickable ? "clickable" : ""}`}
                onClick={() => clickable && jumpToStep(n)}
              >
                <div className="stepper-bar"><div className="stepper-bar-fill" /></div>
                <div className="stepper-label">
                  <span className="stepper-num">{String(n).padStart(2, "0")}</span>
                  <span>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <main className="step-wrap">
        {currentStep === 1 && (
          <section className="step step-in">
            <StepHead n={1} title="Personal information." sub="Your legal identity as it will appear on your OMNI TEST certification. Fields marked optional can be left blank." />
            <div className="form-grid">
              <Field label="Legal first name" required>
                <input className="omni-input" value={legalFirstName} onChange={(e) => setLegalFirstName(e.target.value)} placeholder="Sofía" />
              </Field>
              <Field label="Legal last name(s)" required>
                <input className="omni-input" value={legalLastName} onChange={(e) => setLegalLastName(e.target.value)} placeholder="Hernández Pérez" />
              </Field>
              <Field label="Preferred / display name" optional fullWidth help="How we'll greet you on the platform.">
                <input className="omni-input" value={preferredDisplayName} onChange={(e) => setPreferredDisplayName(e.target.value)} placeholder="Sofi" />
              </Field>
              <Field label="Date of birth" required>
                <input type="date" className="omni-input" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
              </Field>
              <Field label="Gender" optional>
                <select className="omni-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="self-describe">Self-describe</option>
                  <option value="prefer-not-say">Prefer not to say</option>
                </select>
              </Field>
              <Field label="Country of residence" required>
                <select className="omni-select" value={countryOfResidence} onChange={(e) => setCountryOfResidence(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="MX">Mexico</option>
                  <option value="US">United States</option>
                  <option value="ES">Spain</option>
                  <option value="AR">Argentina</option>
                  <option value="CO">Colombia</option>
                  <option value="CL">Chile</option>
                  <option value="PE">Peru</option>
                  <option value="BR">Brazil</option>
                  <option value="CA">Canada</option>
                  <option value="UK">United Kingdom</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              {showStateMx && (
                <Field label="State (Mexico)">
                  <select className="omni-select" value={stateOfResidence} onChange={(e) => setStateOfResidence(e.target.value)}>
                    <option value="">Select...</option>
                    {MX_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              )}
              {showStateUs && (
                <Field label="State (USA)">
                  <select className="omni-select" value={stateOfResidence} onChange={(e) => setStateOfResidence(e.target.value)}>
                    <option value="">Select...</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
              )}
              <Field label="City of residence" required>
                <input className="omni-input" value={cityOfResidence} onChange={(e) => setCityOfResidence(e.target.value)} placeholder="Mazatlán" />
              </Field>
              <Field label="Primary language spoken" required>
                <select className="omni-select" value={primarySpokenLanguage} onChange={(e) => setPrimarySpokenLanguage(e.target.value)}>
                  <option value="">Select...</option>
                  {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </Field>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className="step step-in">
            <StepHead n={2} title="Education." sub="Click each level to expand and add schools. Any level — or this whole section — can be skipped." />
            <div className="edu-list">
              {EDU_LEVELS.map(({ key, icon, name, isUni }) => (
                <EduLevelCard
                  key={key}
                  expanded={expandedLevels[key]}
                  onToggle={() => setExpandedLevels((p) => ({ ...p, [key]: !p[key] }))}
                  icon={icon}
                  name={name}
                  count={education[key].length}
                  isUni={isUni}
                  schools={education[key]}
                  onAdd={() => setEducation((p) => ({ ...p, [key]: [...p[key], isUni ? emptyUniversity() : emptySchool()] }))}
                  onRemove={(idx) => setEducation((p) => ({ ...p, [key]: p[key].filter((_, i) => i !== idx) }))}
                  onChange={(idx, patch) => setEducation((p) => ({
                    ...p,
                    [key]: p[key].map((s, i) => i === idx ? { ...s, ...patch } : s),
                  }))}
                />
              ))}
            </div>
          </section>
        )}

        {currentStep === 3 && (
          <section className="step step-in">
            <StepHead n={3} title="Work experience." sub="Add any previous or current jobs, internships or freelance work. Add as many as you want, or skip this entirely." />
            {workExperience.map((work, idx) => (
              <WorkCard
                key={idx}
                idx={idx}
                work={work}
                expanded={!!expandedWorkDetails[idx]}
                onToggleDetails={() => setExpandedWorkDetails((p) => ({ ...p, [idx]: !p[idx] }))}
                onChange={(patch) => setWorkExperience((p) => p.map((w, i) => i === idx ? { ...w, ...patch } : w))}
                onRemove={() => setWorkExperience((p) => p.filter((_, i) => i !== idx))}
              />
            ))}
            <button type="button" className="add-btn" onClick={() => setWorkExperience((p) => [...p, emptyWork()])}>
              <span>+</span> <span>Add work experience</span>
            </button>
          </section>
        )}

        {currentStep === 4 && (
          <section className="step step-in">
            <StepHead n={4} title="Profile & contact." sub="All fields here are optional. Share whatever helps universities and employers know you better." />

            <h3 className="subhead">Other languages</h3>
            {otherLanguages.map((lang, idx) => (
              <LanguageCard
                key={idx}
                idx={idx}
                lang={lang}
                onChange={(patch) => setOtherLanguages((p) => p.map((l, i) => i === idx ? { ...l, ...patch } : l))}
                onRemove={() => setOtherLanguages((p) => p.filter((_, i) => i !== idx))}
              />
            ))}
            <button type="button" className="add-btn" onClick={() => setOtherLanguages((p) => [...p, emptyLang()])}>
              <span>+</span> <span>Add language</span>
            </button>

            <h3 className="subhead" style={{ marginTop: 48 }}>Contact &amp; identity</h3>
            <div className="form-grid">
              <Field label="Phone" optional>
                <input type="tel" className="omni-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+52 669 123 4567" />
              </Field>
              <Field label="Pronouns" optional>
                <select className="omni-select" value={pronouns} onChange={(e) => setPronouns(e.target.value)}>
                  <option value="">Select...</option>
                  <option value="she/her">She / her</option>
                  <option value="he/him">He / him</option>
                  <option value="they/them">They / them</option>
                  <option value="self-describe">Self-describe</option>
                </select>
              </Field>
              <Field label="Birth city" optional>
                <input className="omni-input" value={placeOfBirthCity} onChange={(e) => setPlaceOfBirthCity(e.target.value)} placeholder="Mazatlán" />
              </Field>
              <Field label="Birth country" optional>
                <input className="omni-input" value={placeOfBirthCountry} onChange={(e) => setPlaceOfBirthCountry(e.target.value)} placeholder="Mexico" />
              </Field>
              <Field label="Nationality / citizenship" optional>
                <input className="omni-input" value={nationalityCitizenship} onChange={(e) => setNationalityCitizenship(e.target.value)} placeholder="Mexican" />
              </Field>
              <Field label="Second nationality" optional>
                <input className="omni-input" value={secondNationality} onChange={(e) => setSecondNationality(e.target.value)} placeholder="—" />
              </Field>
              <Field label="LinkedIn" optional>
                <input type="url" className="omni-input" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} placeholder="linkedin.com/in/..." />
              </Field>
              <Field label="Personal website / portfolio" optional>
                <input type="url" className="omni-input" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="yoursite.com" />
              </Field>
            </div>
          </section>
        )}

        {currentStep === 5 && (
          <section className="step step-in">
            <StepHead n={5} title="Why OMNI?" sub="One quick question that helps us tailor your prep journey and recommend the right resources." />
            <h3 className="subhead">Main reason for taking OMNI</h3>
            <div className="radio-group">
              {OMNI_REASONS.map((r) => (
                <label key={r.value} className="radio-option">
                  <input type="radio" name="omni-reason" value={r.value} checked={omniPurpose === r.value} onChange={() => setOmniPurpose(r.value)} />
                  <span className="radio-text">{r.label}</span>
                </label>
              ))}
            </div>
            {omniPurpose === "other" && (
              <div style={{ marginTop: 18 }}>
                <Field label="Please specify">
                  <input className="omni-input" value={omniPurposeOther} onChange={(e) => setOmniPurposeOther(e.target.value)} placeholder="..." />
                </Field>
              </div>
            )}
          </section>
        )}

        {stepError && <div className="error-banner">{stepError}</div>}
      </main>

      <nav className="nav-bar">
        <div className="nav-info">
          {saving ? "Saving…" : savedFlash ? "Progress saved ✓" : "Progress saves automatically"}
        </div>
        <div className="nav-buttons">
          <button type="button" className="nav-btn ghost" onClick={prevStep} disabled={currentStep === 1 || saving}>
            ← Back
          </button>
          {currentStep >= 2 && currentStep <= 4 && (
            <button type="button" className="nav-btn" onClick={skipStep} disabled={saving}>Skip</button>
          )}
          <button type="button" className="nav-btn primary" onClick={nextStep} disabled={saving}>
            {saving ? "Saving…" : currentStep === TOTAL_STEPS ? "Submit profile →" : "Continue →"}
          </button>
        </div>
      </nav>

      <PageStyles />
    </div>
  );
}

// ============ HELPER COMPONENTS ============

function StepHead({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="step-head">
      <div className="step-eyebrow">Step {n} of {TOTAL_STEPS}</div>
      <h1 className="step-title">{title}</h1>
      <p className="step-sub">{sub}</p>
    </div>
  );
}

function Field({
  label, children, optional, required, fullWidth, help,
}: {
  label: string;
  children: React.ReactNode;
  optional?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  help?: string;
}) {
  return (
    <div className={`field ${fullWidth ? "full-width" : ""}`}>
      <label>
        <span>{label}</span>
        {optional && <span className="opt">(optional)</span>}
        {required && <span className="req" aria-hidden>*</span>}
      </label>
      {children}
      {help && <div className="field-help">{help}</div>}
    </div>
  );
}

function EduLevelCard(props: {
  expanded: boolean;
  onToggle: () => void;
  icon: string;
  name: string;
  count: number;
  isUni?: boolean;
  schools: SchoolEntry[] | UniversityEntry[];
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onChange: (idx: number, patch: Partial<UniversityEntry>) => void;
}) {
  const { expanded, onToggle, icon, name, count, isUni, schools, onAdd, onRemove, onChange } = props;
  return (
    <div className={`edu-level ${expanded ? "expanded" : ""}`}>
      <div className="edu-level-head" onClick={onToggle}>
        <div className="edu-level-info">
          <div className="edu-level-icon">{icon}</div>
          <div>
            <div className="edu-level-name">{name}</div>
            <div className="edu-level-status">
              {count > 0 ? `${count} school(s) added` : "Not added · click to add"}
            </div>
          </div>
        </div>
        <div className="edu-level-toggle">{expanded ? "Close" : "Add"}</div>
      </div>
      {expanded && (
        <div className="edu-level-body">
          {schools.map((s, idx) => (
            <div key={idx} className="entry-card">
              <h4>
                <span>{name} #{idx + 1}</span>
                <button type="button" className="entry-remove" onClick={() => onRemove(idx)}>Remove</button>
              </h4>
              <div className="form-grid">
                <Field label="School name" fullWidth>
                  <input className="omni-input" value={s.schoolName ?? ""} onChange={(e) => onChange(idx, { schoolName: e.target.value })} />
                </Field>
                <Field label="Institution type">
                  <select className="omni-select" value={s.institutionType ?? ""} onChange={(e) => onChange(idx, { institutionType: e.target.value })}>
                    <option value="">Select...</option>
                    <option>Public</option><option>Private</option>
                    <option>Religious</option><option>International</option>
                    <option>Bilingual</option><option>Other</option>
                  </select>
                </Field>
                <Field label="Year started">
                  <input type="number" min={1950} max={2040} className="omni-input" value={s.yearStarted ?? ""} onChange={(e) => onChange(idx, { yearStarted: e.target.value })} placeholder="2015" />
                </Field>
                <Field label="Year finished">
                  <input type="number" min={1950} max={2040} className="omni-input" value={s.yearFinished ?? ""} onChange={(e) => onChange(idx, { yearFinished: e.target.value })} placeholder="2019" />
                </Field>
                {isUni && (
                  <>
                    <Field label="Status">
                      <select className="omni-select" value={(s as UniversityEntry).status ?? ""} onChange={(e) => onChange(idx, { status: e.target.value as UniversityEntry["status"] })}>
                        <option value="">Select...</option>
                        <option value="studying">Currently studying</option>
                        <option value="graduated">Graduated</option>
                        <option value="dropped">Did not finish</option>
                      </select>
                    </Field>
                    {(s as UniversityEntry).status === "graduated" && (
                      <Field label="Graduation year">
                        <input type="number" min={1950} max={2040} className="omni-input" value={(s as UniversityEntry).graduationYear ?? ""} onChange={(e) => onChange(idx, { graduationYear: e.target.value })} placeholder="2024" />
                      </Field>
                    )}
                  </>
                )}
                <Field label="Do you have a diploma / certificate?" fullWidth>
                  <select className="omni-select" value={s.hasCertificate ?? ""} onChange={(e) => onChange(idx, { hasCertificate: e.target.value as SchoolEntry["hasCertificate"] })}>
                    <option value="">Select...</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </Field>
              </div>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={onAdd}>
            <span>+</span> <span>{isUni ? "Add university" : "Add school"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function WorkCard({
  idx, work, expanded, onToggleDetails, onChange, onRemove,
}: {
  idx: number;
  work: WorkEntry;
  expanded: boolean;
  onToggleDetails: () => void;
  onChange: (patch: Partial<WorkEntry>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="entry-card">
      <h4>
        <span>Work experience #{idx + 1}</span>
        <button type="button" className="entry-remove" onClick={onRemove}>Remove</button>
      </h4>
      <div className="form-grid">
        <Field label="Company"><input className="omni-input" value={work.company ?? ""} onChange={(e) => onChange({ company: e.target.value })} /></Field>
        <Field label="Position / job title"><input className="omni-input" value={work.position ?? ""} onChange={(e) => onChange({ position: e.target.value })} /></Field>
        <Field label="Employment type">
          <select className="omni-select" value={work.employmentType ?? ""} onChange={(e) => onChange({ employmentType: e.target.value })}>
            <option value="">Select...</option>
            <option>Full-time</option><option>Part-time</option><option>Contract</option>
            <option>Internship</option><option>Freelance</option><option>Self-employed</option>
          </select>
        </Field>
        <Field label="Work modality">
          <select className="omni-select" value={work.modality ?? ""} onChange={(e) => onChange({ modality: e.target.value })}>
            <option value="">Select...</option>
            <option>On-site</option><option>Hybrid</option><option>Remote</option>
          </select>
        </Field>
        <Field label="City"><input className="omni-input" value={work.city ?? ""} onChange={(e) => onChange({ city: e.target.value })} /></Field>
        <Field label="State / province"><input className="omni-input" value={work.state ?? ""} onChange={(e) => onChange({ state: e.target.value })} /></Field>
        <Field label="Country"><input className="omni-input" value={work.country ?? ""} onChange={(e) => onChange({ country: e.target.value })} /></Field>
        <Field label="Industry">
          <select className="omni-select" value={work.industry ?? ""} onChange={(e) => onChange({ industry: e.target.value })}>
            <option value="">Select...</option>
            <option>Technology</option><option>Finance</option><option>Healthcare</option>
            <option>Education</option><option>Retail</option><option>Manufacturing</option>
            <option>Media &amp; communications</option><option>Consulting</option>
            <option>Government</option><option>Other</option>
          </select>
        </Field>
        <Field label="Start date"><input type="month" className="omni-input" value={work.startDate ?? ""} onChange={(e) => onChange({ startDate: e.target.value })} /></Field>
        <Field label="End date">
          <input
            type="month" className="omni-input"
            value={work.endDate ?? ""}
            disabled={!!work.currentlyWorking}
            onChange={(e) => onChange({ endDate: e.target.value })}
          />
        </Field>
        <div className="field full-width">
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={!!work.currentlyWorking} onChange={(e) => onChange({ currentlyWorking: e.target.checked })} />
            <span>I currently work here</span>
          </label>
        </div>
      </div>
      <button type="button" className="opt-toggle" onClick={onToggleDetails}>
        {expanded ? "− Hide details" : "+ Show optional details"}
      </button>
      {expanded && (
        <div className="opt-details">
          <div className="form-grid">
            <Field label="Key responsibilities" fullWidth>
              <textarea className="omni-textarea" value={work.responsibilities ?? ""} onChange={(e) => onChange({ responsibilities: e.target.value })} />
            </Field>
            <Field label="Team size">
              <input type="number" min={1} className="omni-input" value={work.teamSize ?? ""} onChange={(e) => onChange({ teamSize: e.target.value })} />
            </Field>
            <Field label="Reported to (title)">
              <input className="omni-input" value={work.reportedTo ?? ""} onChange={(e) => onChange({ reportedTo: e.target.value })} />
            </Field>
            <Field label="Did you manage people?">
              <select className="omni-select" value={work.managedPeople ?? ""} onChange={(e) => onChange({ managedPeople: e.target.value as WorkEntry["managedPeople"] })}>
                <option value="">Select...</option>
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </Field>
            {work.managedPeople === "yes" && (
              <Field label="How many people did you manage?">
                <input type="number" min={1} className="omni-input" value={work.managedCount ?? ""} onChange={(e) => onChange({ managedCount: e.target.value })} />
              </Field>
            )}
            <Field label="Position level">
              <select className="omni-select" value={work.positionLevel ?? ""} onChange={(e) => onChange({ positionLevel: e.target.value })}>
                <option value="">Select...</option>
                <option>Entry</option><option>Mid</option><option>Senior</option>
                <option>Lead</option><option>Manager</option><option>Director</option>
                <option>Executive</option>
              </select>
            </Field>
          </div>
        </div>
      )}
    </div>
  );
}

function LanguageCard({
  idx, lang, onChange, onRemove,
}: {
  idx: number;
  lang: LanguageEntry;
  onChange: (patch: Partial<LanguageEntry>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="entry-card">
      <h4>
        <span>Language #{idx + 1}</span>
        <button type="button" className="entry-remove" onClick={onRemove}>Remove</button>
      </h4>
      <div className="form-grid">
        <Field label="Language">
          <input className="omni-input" value={lang.language ?? ""} onChange={(e) => onChange({ language: e.target.value })} placeholder="French" />
        </Field>
        <Field label="Proficiency level">
          <select className="omni-select" value={lang.level ?? ""} onChange={(e) => onChange({ level: e.target.value })}>
            <option value="">Select...</option>
            <option>Beginner</option><option>Intermediate</option>
            <option>Advanced</option><option>Native</option>
          </select>
        </Field>
      </div>
    </div>
  );
}

function SuccessScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="success-shell">
      <svg className="success-icon" viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="46" stroke="#000" strokeWidth="3" />
        <path d="M28 52 L44 66 L72 36" stroke="#000" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h2>You&apos;re all set.</h2>
      <p>
        Your OMNI TEST profile is complete. We&apos;ve saved your information and we&apos;ll send you a confirmation email
        with your candidate ID and next steps.
      </p>
      <button type="button" className="form-submit" onClick={onBack}>Back to home →</button>

      <style jsx>{`
        .success-shell {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; min-height: 100vh; padding: 80px 24px; background: #fff;
          font-family: var(--font-questrial), sans-serif;
        }
        .success-icon { width: 80px; height: 80px; margin-bottom: 24px; }
        h2 {
          font-family: var(--font-archivo-black), sans-serif;
          font-size: clamp(48px, 7vw, 90px);
          letter-spacing: -0.04em; line-height: 0.95; margin-bottom: 18px;
        }
        p { font-size: 16px; line-height: 1.6; max-width: 520px; color: #6b6b6b; margin-bottom: 36px; }
        .form-submit {
          padding: 14px 30px; background: #000; color: #fff; border: none; border-radius: 50px;
          font-family: var(--font-questrial), sans-serif; font-size: 12px; letter-spacing: 0.25em;
          text-transform: uppercase; cursor: pointer;
        }
      `}</style>
    </div>
  );
}

// ============ STATIC DATA ============

const EDU_LEVELS: { key: EduLevelKey; icon: string; name: string; isUni?: boolean }[] = [
  { key: "kindergarten", icon: "K", name: "Kindergarten" },
  { key: "primary", icon: "1", name: "Primary school" },
  { key: "secondary", icon: "2", name: "Secondary / middle school" },
  { key: "highSchool", icon: "3", name: "High school / Preparatoria" },
  { key: "university", icon: "U", name: "University", isUni: true },
];

const MX_STATES = [
  "Aguascalientes","Baja California","Baja California Sur","Campeche","CDMX","Chiapas","Chihuahua","Coahuila","Colima","Durango","Estado de México","Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacán","Morelos","Nayarit","Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí","Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas",
];
const US_STATES = [
  "Alabama","Alaska","Arizona","California","Colorado","Florida","Georgia","Illinois","Massachusetts","Michigan","New Jersey","New Mexico","New York","North Carolina","Ohio","Oregon","Pennsylvania","Texas","Virginia","Washington","Other US state",
];
const LANGUAGES = [
  { value: "spanish", label: "Spanish" },
  { value: "english", label: "English" },
  { value: "portuguese", label: "Portuguese" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "italian", label: "Italian" },
  { value: "mandarin", label: "Mandarin" },
  { value: "other", label: "Other" },
];
const OMNI_REASONS = [
  { value: "university", label: "Apply to a university abroad" },
  { value: "graduate", label: "Apply to graduate school (Master's / PhD)" },
  { value: "job", label: "Get a job abroad or with an international employer" },
  { value: "cert", label: "Professional certification" },
  { value: "immigration", label: "Immigration / visa requirements" },
  { value: "personal", label: "Personal development goal" },
  { value: "exploring-careers", label: "Exploring careers / opportunities" },
  { value: "other", label: "Other" },
];

// ============ STYLES ============

function PageStyles() {
  return (
    <style jsx global>{`
      .reg-shell { background: #fff; min-height: 100vh; color: #000; }

      .omni-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 22px 56px; position: sticky; top: 0;
        background: rgba(255,255,255,0.92); backdrop-filter: blur(20px);
        border-bottom: 1px solid #e5e5e5; z-index: 50; gap: 24px;
      }
      .brand-block { display: flex; align-items: center; gap: 18px; }
      .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: #000; }
      .brand-name { font-family: var(--font-archivo-black), sans-serif; font-size: 14px; letter-spacing: 0.05em; }
      .brand-divider { width: 1px; height: 22px; background: #e5e5e5; }
      .context-label {
        font-family: var(--font-archivo-black), sans-serif; font-size: 11px;
        letter-spacing: 0.3em; color: #000; text-transform: uppercase;
      }
      .header-right { display: flex; align-items: center; gap: 12px; }
      .exit-btn {
        padding: 9px 18px; border: 1px solid #e5e5e5; background: transparent;
        border-radius: 50px; font-family: var(--font-questrial), sans-serif; font-size: 11px;
        letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer;
        color: #6b6b6b; display: inline-flex; align-items: center; gap: 8px; transition: all 0.2s;
      }
      .exit-btn:hover { color: #000; border-color: #000; }

      .progress-section { padding: 36px 56px 0; max-width: 1200px; margin: 0 auto; }
      .stepper { display: flex; align-items: center; gap: 8px; margin-bottom: 36px; }
      .stepper-item {
        flex: 1; display: flex; flex-direction: column; align-items: flex-start;
        gap: 10px; cursor: default;
      }
      .stepper-item.clickable { cursor: pointer; }
      .stepper-bar {
        width: 100%; height: 3px; background: #e5e5e5; border-radius: 2px;
        position: relative; overflow: hidden;
      }
      .stepper-bar-fill {
        position: absolute; top: 0; left: 0; height: 100%; width: 0;
        background: #000; transition: width 0.5s ease;
      }
      .stepper-item.done .stepper-bar-fill { width: 100%; }
      .stepper-item.active .stepper-bar-fill { width: 50%; }
      .stepper-label {
        display: flex; align-items: center; gap: 8px; font-size: 11px;
        letter-spacing: 0.2em; text-transform: uppercase; color: #6b6b6b; transition: color 0.3s;
      }
      .stepper-item.active .stepper-label, .stepper-item.done .stepper-label { color: #000; }
      .stepper-num { font-family: var(--font-archivo-black), sans-serif; font-size: 13px; }

      .step-wrap { max-width: 1200px; margin: 0 auto; padding: 0 56px 160px; min-height: 60vh; }

      .step-head { margin-bottom: 48px; }
      .step-eyebrow {
        font-size: 11px; letter-spacing: 0.3em; text-transform: uppercase;
        color: #6b6b6b; margin-bottom: 14px;
      }
      .step-title {
        font-family: var(--font-archivo-black), sans-serif;
        font-size: clamp(42px, 6vw, 80px); line-height: 0.95;
        letter-spacing: -0.04em; margin-bottom: 16px;
      }
      .step-sub { font-size: 16px; line-height: 1.55; color: #6b6b6b; max-width: 640px; }

      .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px 20px; margin-bottom: 14px; }
      .field { display: flex; flex-direction: column; }
      .field.full-width { grid-column: 1 / -1; }
      .field label {
        font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
        margin-bottom: 8px; color: #000; display: flex; align-items: center; gap: 8px;
      }
      .field label .opt { color: #6b6b6b; font-size: 10px; letter-spacing: 0.15em; }
      .field label .req { color: #000; font-size: 12px; }
      .field-help { font-size: 12px; color: #6b6b6b; margin-top: 6px; }

      .radio-group { display: flex; flex-direction: column; gap: 10px; }
      .radio-option {
        display: flex; align-items: center; gap: 14px; padding: 16px 20px;
        border: 1px solid #e5e5e5; border-radius: 14px; cursor: pointer; transition: all 0.2s;
      }
      .radio-option:hover { border-color: #000; }
      .radio-option input { accent-color: #000; cursor: pointer; }
      .radio-option:has(input:checked) { border-color: #000; background: #f7f7f7; }
      .radio-text { font-size: 15px; flex: 1; }

      .entry-card {
        background: #fafafa; border: 1px solid #e5e5e5;
        border-radius: 18px; padding: 24px; margin-bottom: 16px;
      }
      .entry-card h4 {
        font-family: var(--font-archivo-black), sans-serif; font-size: 14px;
        letter-spacing: 0.04em; margin-bottom: 18px;
        display: flex; justify-content: space-between; align-items: center;
        text-transform: uppercase;
      }
      .entry-remove {
        background: transparent; border: none; color: #6b6b6b;
        font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase;
        cursor: pointer; padding: 4px 8px; transition: color 0.2s;
      }
      .entry-remove:hover { color: #000; }

      .add-btn {
        display: inline-flex; align-items: center; gap: 10px;
        padding: 12px 22px; border: 1px dashed #000; background: transparent;
        border-radius: 50px; font-family: var(--font-questrial), sans-serif; font-size: 12px;
        letter-spacing: 0.2em; text-transform: uppercase; cursor: pointer;
        color: #000; margin-top: 6px; transition: all 0.2s;
      }
      .add-btn:hover { background: #000; color: #fff; }

      .edu-level {
        border: 1px solid #e5e5e5; border-radius: 18px;
        margin-bottom: 14px; overflow: hidden; transition: border 0.2s;
      }
      .edu-level.expanded { border-color: #000; }
      .edu-level-head {
        display: flex; justify-content: space-between; align-items: center;
        padding: 20px 24px; cursor: pointer; background: #fff;
      }
      .edu-level-info { display: flex; align-items: center; gap: 16px; }
      .edu-level-icon {
        width: 36px; height: 36px; border-radius: 50%;
        background: #f7f7f7; display: flex; align-items: center;
        justify-content: center; font-family: var(--font-archivo-black), sans-serif; font-size: 13px;
      }
      .edu-level-name { font-family: var(--font-archivo), sans-serif; font-weight: 600; font-size: 16px; }
      .edu-level-status { font-size: 12px; color: #6b6b6b; margin-top: 2px; }
      .edu-level-toggle {
        font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #6b6b6b;
      }
      .edu-level.expanded .edu-level-toggle { color: #000; }
      .edu-level-body { padding: 4px 24px 24px; border-top: 1px solid #efefef; }

      .opt-toggle {
        display: inline-flex; align-items: center; gap: 8px;
        background: transparent; border: none; color: #6b6b6b;
        font-family: var(--font-questrial), sans-serif; font-size: 12px;
        letter-spacing: 0.15em; text-transform: uppercase;
        cursor: pointer; padding: 6px 0; margin: 6px 0 12px;
      }
      .opt-toggle:hover { color: #000; }
      .opt-details { padding-top: 12px; border-top: 1px solid #efefef; margin-top: 10px; }

      .subhead {
        font-family: var(--font-archivo-black), sans-serif; font-size: 14px;
        letter-spacing: 0.25em; text-transform: uppercase; margin-bottom: 18px;
      }

      .nav-bar {
        position: fixed; bottom: 0; left: 0; right: 0;
        background: rgba(255,255,255,0.96); backdrop-filter: blur(20px);
        border-top: 1px solid #e5e5e5; padding: 18px 56px;
        display: flex; justify-content: space-between; align-items: center; z-index: 60;
      }
      .nav-info { font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: #6b6b6b; }
      .nav-buttons { display: flex; gap: 10px; }
      .nav-btn {
        padding: 14px 30px; border-radius: 50px;
        font-family: var(--font-questrial), sans-serif; font-size: 12px;
        letter-spacing: 0.25em; text-transform: uppercase; cursor: pointer;
        transition: all 0.3s; border: 1px solid #000; background: transparent;
        color: #000; display: inline-flex; align-items: center; gap: 8px;
      }
      .nav-btn:hover:not(:disabled) { transform: translateY(-2px); }
      .nav-btn.primary { background: #000; color: #fff; }
      .nav-btn.primary:hover:not(:disabled) { background: #222; }
      .nav-btn.ghost { border-color: transparent; color: #6b6b6b; }
      .nav-btn.ghost:hover:not(:disabled) { color: #000; transform: none; }
      .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; transform: none; }

      .error-banner {
        background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;
        padding: 14px 18px; border-radius: 14px; font-size: 14px; margin-top: 16px;
      }

      @media (max-width: 900px) {
        .omni-header { padding: 16px 24px; flex-wrap: wrap; }
        .brand-divider, .context-label { display: none; }
        .progress-section, .step-wrap { padding-left: 24px; padding-right: 24px; }
        .nav-bar { padding: 14px 24px; flex-wrap: wrap; gap: 12px; }
        .nav-info { display: none; }
        .form-grid { grid-template-columns: 1fr; }
        .stepper-label { font-size: 9px; letter-spacing: 0.1em; }
        .stepper-num { font-size: 11px; }
        .step-wrap { padding-bottom: 200px; }
      }
      @media (max-width: 520px) {
        .stepper-label span:not(.stepper-num) { display: none; }
        .stepper { gap: 4px; }
        .nav-btn { padding: 12px 18px; font-size: 11px; letter-spacing: 0.15em; }
      }
    `}</style>
  );
}
