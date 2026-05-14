"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";

import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { describeAuthError } from "@/lib/auth-errors";
import { initUserProfile } from "@/lib/user-profile";

const MONEXUS_LOGO =
  "data:image/jpeg;base64,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";

type ModalView = "login" | "recovery" | "sent";

export default function HomePage() {
  const router = useRouter();
  const { signIn, signUp, user, loading } = useAuth();

  const [showIntro, setShowIntro] = useState(true);
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupShowPw, setSignupShowPw] = useState(false);
  const [signupAgree, setSignupAgree] = useState(false);
  const [signupBusy, setSignupBusy] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalView, setModalView] = useState<ModalView>("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginShowPw, setLoginShowPw] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryBusy, setRecoveryBusy] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 3600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/register");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && modalOpen) setModalOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

  function openLogin() {
    setLoginError(null);
    setModalView("login");
    setModalOpen(true);
  }

  async function handleSignup(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (signupBusy) return;
    setSignupError(null);
    if (!signupAgree) {
      setSignupError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }
    setSignupBusy(true);
    try {
      await signUp(signupEmail.trim(), signupPassword);
      const current = auth.currentUser;
      if (current) {
        await initUserProfile(current.uid, current.email ?? signupEmail.trim());
      }
      router.push("/register");
    } catch (err) {
      setSignupError(describeAuthError(err));
    } finally {
      setSignupBusy(false);
    }
  }

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loginBusy) return;
    setLoginError(null);
    setLoginBusy(true);
    try {
      await signIn(loginEmail.trim(), loginPassword);
      setModalOpen(false);
      router.push("/register");
    } catch (err) {
      setLoginError(describeAuthError(err));
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleRecovery(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (recoveryBusy) return;
    setRecoveryError(null);
    setRecoveryBusy(true);
    try {
      await sendPasswordResetEmail(auth, recoveryEmail.trim());
      setModalView("sent");
    } catch (err) {
      setRecoveryError(describeAuthError(err));
    } finally {
      setRecoveryBusy(false);
    }
  }

  return (
    <>
      {showIntro && <IntroSplash />}

      <div
        className={`page ${showIntro ? "page-hidden" : "page-shown"}`}
        style={{ animation: showIntro ? undefined : "pageIn 0.9s ease forwards" }}
      >
        <header className="omni-header">
          <div className="brand" onClick={() => setShowIntro(true)}>
            <img src={MONEXUS_LOGO} alt="Monexus" className="brand-mark" />
            <span className="brand-context">OMNI TEST</span>
          </div>
          <div className="header-right">
            <button type="button" className="omni-btn primary" onClick={openLogin}>
              LOG IN
            </button>
          </div>
        </header>

        <main className="entry">
          <div className="entry-info">
            <div className="entry-eyebrow">Welcome</div>
            <h1 className="entry-title">Create your OMNI account.</h1>
            <p className="entry-sub" style={{ marginBottom: 36, color: "#000", lineHeight: 1.55, fontSize: 17, maxWidth: 460 }}>
              The power of connection to unlock languages. Build your profile and take OMNI when you&rsquo;re ready.
            </p>
          </div>

          <div>
            <div className="form-card">
              <h3>Sign up</h3>
              <p className="subtitle">It takes less than a minute.</p>

              <form onSubmit={handleSignup}>
                <div className="field">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="omni-input omni-input-pill"
                  />
                </div>

                <div className="field">
                  <label>Password</label>
                  <div className="password-wrap">
                    <input
                      type={signupShowPw ? "text" : "password"}
                      required
                      minLength={8}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="omni-input omni-input-pill"
                      style={{ paddingRight: 50 }}
                    />
                    <button
                      type="button"
                      className="pw-toggle"
                      onClick={() => setSignupShowPw((v) => !v)}
                      aria-label={signupShowPw ? "Hide password" : "Show password"}
                    >
                      {signupShowPw ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>

                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={signupAgree}
                    onChange={(e) => setSignupAgree(e.target.checked)}
                  />
                  <span>I agree to the Terms of Service and Privacy Policy of Monexus International Academy.</span>
                </label>

                {signupError && (
                  <div className="error-banner">{signupError}</div>
                )}

                <button type="submit" className="form-submit" disabled={signupBusy}>
                  {signupBusy ? "CREATING…" : "CREATE ACCOUNT →"}
                </button>
              </form>

              <p className="login-link">
                Already have an account?{" "}
                <button type="button" onClick={openLogin}>Log in</button>
              </p>
            </div>
          </div>
        </main>

        <footer className="footer-mini">
          <div>© 2026 Monexus International Academy</div>
          <div className="footer-links">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
          </div>
        </footer>
      </div>

      {modalOpen && (
        <div className="modal-overlay overlay-in" onClick={(e) => {
          if (e.target === e.currentTarget) setModalOpen(false);
        }}>
          <div className="modal modal-in">
            <button className="modal-close" onClick={() => setModalOpen(false)} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>

            {modalView === "login" && (
              <div className="modal-view">
                <h2 className="modal-title">Welcome back.</h2>
                <p className="modal-sub">Sign in to your OMNI account to continue.</p>
                <form onSubmit={handleLogin}>
                  <div className="field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="omni-input omni-input-pill"
                    />
                  </div>
                  <div className="field">
                    <label>Password</label>
                    <div className="password-wrap">
                      <input
                        type={loginShowPw ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="omni-input omni-input-pill"
                        style={{ paddingRight: 50 }}
                      />
                      <button
                        type="button"
                        className="pw-toggle"
                        onClick={() => setLoginShowPw((v) => !v)}
                        aria-label={loginShowPw ? "Hide password" : "Show password"}
                      >
                        {loginShowPw ? <EyeOff /> : <Eye />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => {
                      setRecoveryEmail(loginEmail);
                      setRecoveryError(null);
                      setModalView("recovery");
                    }}
                  >
                    Forgot your password?
                  </button>
                  {loginError && <div className="error-banner">{loginError}</div>}
                  <button type="submit" className="form-submit" disabled={loginBusy}>
                    {loginBusy ? "SIGNING IN…" : "LOG IN →"}
                  </button>
                </form>
                <p className="modal-bottom">
                  Don&apos;t have an account?{" "}
                  <button type="button" onClick={() => setModalOpen(false)} className="link-button">Sign up</button>
                </p>
              </div>
            )}

            {modalView === "recovery" && (
              <div className="modal-view">
                <button type="button" className="back-link" onClick={() => setModalView("login")}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                    <path d="M7 1L2.5 5.5L7 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>Back to login</span>
                </button>
                <h2 className="modal-title">Recover your password.</h2>
                <p className="modal-sub">
                  Enter the email associated with your account and we&apos;ll send you a link to reset your password.
                </p>
                <form onSubmit={handleRecovery}>
                  <div className="field">
                    <label>Email Address</label>
                    <input
                      type="email"
                      required
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="omni-input omni-input-pill"
                    />
                  </div>
                  {recoveryError && <div className="error-banner">{recoveryError}</div>}
                  <button type="submit" className="form-submit" disabled={recoveryBusy}>
                    {recoveryBusy ? "SENDING…" : "SEND RECOVERY EMAIL →"}
                  </button>
                </form>
              </div>
            )}

            {modalView === "sent" && (
              <div className="modal-view" style={{ textAlign: "center" }}>
                <svg className="sent-icon" viewBox="0 0 64 64" fill="none">
                  <rect x="8" y="14" width="48" height="36" rx="3" stroke="#000" strokeWidth="2.5" />
                  <path d="M8 18 L32 36 L56 18" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h2 className="modal-title" style={{ fontSize: 28 }}>Check your inbox.</h2>
                <p className="modal-sub">
                  We&apos;ve sent a password recovery link to your email. The link expires in 1 hour.
                </p>
                <button type="button" className="form-submit" onClick={() => setModalOpen(false)}>
                  GOT IT →
                </button>
                <p className="modal-bottom">
                  Didn&apos;t get the email?{" "}
                  <button type="button" className="link-button" onClick={() => setModalView("recovery")}>
                    Try again
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .page-hidden { opacity: 0; }
        .page-shown { opacity: 1; }

        .omni-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 22px 56px; position: sticky; top: 0;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          z-index: 100; border-bottom: 1px solid #e5e5e5; gap: 24px;
        }
        .brand { display: flex; align-items: center; gap: 10px; cursor: pointer; }
        .brand-mark { width: 28px; height: 28px; object-fit: contain; border-radius: 4px; }
        .brand-context {
          font-family: var(--font-questrial), sans-serif; font-size: 11px;
          letter-spacing: 0.3em; text-transform: uppercase; color: #6b6b6b;
          margin-left: 14px; padding-left: 14px; border-left: 1px solid #e5e5e5;
        }
        .header-right { display: flex; align-items: center; gap: 12px; }
        .omni-btn {
          padding: 13px 28px; border-radius: 50px; border: 1px solid #000;
          background: transparent; color: #000;
          font-family: var(--font-questrial), sans-serif; font-size: 12px;
          letter-spacing: 0.25em; cursor: pointer; transition: all 0.3s;
          text-transform: uppercase; white-space: nowrap;
        }
        .omni-btn.primary { background: #000; color: #fff; }
        .omni-btn:hover { transform: translateY(-2px); }
        .omni-btn.primary:hover { background: #222; }

        .entry {
          display: grid; grid-template-columns: 1fr 1fr; gap: 80px;
          align-items: center; padding: 80px 56px;
          max-width: 1300px; margin: 0 auto; min-height: calc(100vh - 90px);
        }
        .entry-info { padding-right: 20px; }
        .entry-eyebrow {
          display: inline-flex; align-items: center; gap: 10px;
          font-size: 12px; letter-spacing: 0.3em; text-transform: uppercase;
          margin-bottom: 28px;
        }
        .entry-eyebrow::before { content: ''; width: 30px; height: 1px; background: #000; }
        .entry-title {
          font-family: var(--font-archivo-black), sans-serif;
          font-size: clamp(48px, 7vw, 96px); line-height: 0.92;
          letter-spacing: -0.04em; margin-bottom: 28px;
        }

        .form-card {
          background: #fff; border-radius: 24px; padding: 40px;
          border: 1px solid #e5e5e5; box-shadow: 0 4px 30px rgba(0,0,0,0.04);
        }
        .form-card h3 {
          font-family: var(--font-archivo-black), sans-serif; font-size: 26px;
          margin-bottom: 8px; letter-spacing: -0.02em;
        }
        .form-card .subtitle { font-size: 13px; color: #6b6b6b; margin-bottom: 28px; }
        .field { margin-bottom: 18px; }
        .field label {
          display: block; font-size: 11px; letter-spacing: 0.2em;
          text-transform: uppercase; margin-bottom: 8px; color: #000;
        }
        .password-wrap { position: relative; }
        .pw-toggle {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: transparent; border: none; cursor: pointer;
          padding: 6px; color: #999; display: flex; align-items: center;
          justify-content: center; transition: color 0.2s;
        }
        .pw-toggle:hover { color: #000; }
        .checkbox-row {
          display: flex; align-items: flex-start; gap: 10px; margin: 20px 0 26px;
          font-size: 13px; color: #6b6b6b; line-height: 1.45; cursor: pointer;
        }
        .checkbox-row input { accent-color: #000; margin-top: 3px; flex-shrink: 0; }
        .form-submit {
          width: 100%; padding: 16px; background: #000; color: #fff;
          border: none; border-radius: 50px;
          font-family: var(--font-questrial), sans-serif; font-size: 13px;
          letter-spacing: 0.3em; text-transform: uppercase; cursor: pointer;
          transition: all 0.3s;
        }
        .form-submit:hover:not(:disabled) { background: #2a2a2a; }
        .form-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .login-link { text-align: center; font-size: 13px; color: #6b6b6b; margin-top: 22px; }
        .login-link button {
          color: #000; text-decoration: underline; text-underline-offset: 3px;
          background: transparent; border: none; cursor: pointer;
          font-family: var(--font-questrial), sans-serif; font-size: 13px; padding: 0;
        }
        .error-banner {
          background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;
          padding: 12px 16px; border-radius: 12px; font-size: 13px; margin-bottom: 16px;
        }

        .footer-mini {
          border-top: 1px solid #e5e5e5; padding: 22px 56px;
          display: flex; justify-content: space-between; align-items: center;
          font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #6b6b6b;
        }
        .footer-mini .footer-links { display: flex; gap: 24px; }
        .footer-mini a { color: #6b6b6b; text-decoration: none; }
        .footer-mini a:hover { color: #000; }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.55);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;
        }
        .modal {
          background: #fff; border-radius: 24px; padding: 44px 40px;
          max-width: 440px; width: 100%; position: relative;
          max-height: 90vh; overflow-y: auto;
        }
        .modal-close {
          position: absolute; top: 18px; right: 18px;
          background: transparent; border: none; cursor: pointer; padding: 8px;
          color: #999; border-radius: 50%; display: flex;
          align-items: center; justify-content: center; transition: all 0.2s;
        }
        .modal-close:hover { color: #000; background: rgba(0,0,0,0.04); }
        .modal-title {
          font-family: var(--font-archivo-black), sans-serif; font-size: 32px;
          letter-spacing: -0.03em; line-height: 1.05; margin-bottom: 10px;
        }
        .modal-sub { font-size: 14px; line-height: 1.5; color: #6b6b6b; margin-bottom: 28px; }
        .forgot-link {
          display: inline-block; margin-top: 10px; margin-bottom: 24px;
          font-size: 13px; color: #6b6b6b; text-decoration: underline;
          text-underline-offset: 3px; background: transparent; border: none;
          padding: 0; font-family: var(--font-questrial), sans-serif; cursor: pointer;
        }
        .forgot-link:hover { color: #000; }
        .modal-bottom { text-align: center; font-size: 13px; color: #6b6b6b; margin-top: 22px; }
        .link-button {
          background: transparent; border: none; padding: 0;
          color: #000; text-decoration: underline; text-underline-offset: 3px;
          cursor: pointer; font-family: var(--font-questrial), sans-serif; font-size: 13px;
        }
        .back-link {
          display: inline-flex; align-items: center; gap: 6px;
          background: transparent; border: none;
          font-family: var(--font-questrial), sans-serif; font-size: 12px;
          letter-spacing: 0.15em; text-transform: uppercase; color: #6b6b6b;
          cursor: pointer; padding: 0; margin-bottom: 24px; transition: color 0.2s;
        }
        .back-link:hover { color: #000; }
        .sent-icon { width: 64px; height: 64px; margin: 0 auto 22px; display: block; }

        @keyframes pageIn {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 900px) {
          .omni-header { padding: 16px 24px; }
          .brand-context { display: none; }
          .entry { grid-template-columns: 1fr; gap: 50px; padding: 50px 24px; }
          .entry-info { padding-right: 0; }
          .footer-mini { padding: 18px 24px; flex-direction: column; gap: 12px; }
        }
      `}</style>
    </>
  );
}

function IntroSplash() {
  return (
    <div className="intro">
      <svg className="logo-mark" viewBox="0 0 100 100" fill="none">
        <g stroke="#000" strokeWidth="3" strokeLinecap="round">
          <line x1="50" y1="6" x2="50" y2="26" />
          <line x1="50" y1="74" x2="50" y2="94" />
          <line x1="6" y1="50" x2="26" y2="50" />
          <line x1="74" y1="50" x2="94" y2="50" />
          <line x1="18.9" y1="18.9" x2="32.9" y2="32.9" />
          <line x1="67.1" y1="67.1" x2="81.1" y2="81.1" />
          <line x1="18.9" y1="81.1" x2="32.9" y2="67.1" />
          <line x1="67.1" y1="32.9" x2="81.1" y2="18.9" />
        </g>
        <circle cx="50" cy="50" r="14" fill="#000" />
      </svg>
      <div className="logo-text">OMNI TEST</div>
      <div className="logo-sub">— TEST YOUR FUTURE —</div>
      <div className="logo-academy">BY MONEXUS INTERNATIONAL ACADEMY</div>

      <style jsx>{`
        .intro {
          position: fixed; inset: 0; background: #fff; z-index: 9999;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          animation: hideIntro 0.8s 2.8s forwards;
        }
        @keyframes hideIntro {
          0% { opacity: 1; visibility: visible; }
          100% { opacity: 0; visibility: hidden; pointer-events: none; }
        }
        .logo-mark { width: 70px; height: 70px; opacity: 0; animation: logoStep 0.6s 0.2s forwards; }
        .logo-text {
          font-family: var(--font-archivo-black), sans-serif;
          font-size: clamp(60px, 11vw, 180px);
          letter-spacing: -0.06em; color: #000;
          margin-top: 20px; opacity: 0; line-height: 0.9;
          animation: logoStep 0.6s 0.55s forwards;
        }
        .logo-sub {
          font-family: var(--font-questrial), sans-serif; font-size: 12px;
          letter-spacing: 0.5em; color: #000; margin-top: 18px;
          opacity: 0; animation: logoStep 0.6s 0.9s forwards;
        }
        .logo-academy {
          font-family: var(--font-questrial), sans-serif; font-size: 10px;
          letter-spacing: 0.4em; color: #999; margin-top: 50px;
          opacity: 0; animation: logoStep 0.6s 1.25s forwards;
        }
        @keyframes logoStep {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function Eye() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
