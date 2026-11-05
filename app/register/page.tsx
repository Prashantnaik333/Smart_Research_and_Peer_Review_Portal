
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowUpRight,
  Check,
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("Password must be between 8 and 72 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Registration failed");
        return;
      }

      router.replace("/submit");
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const passwordMatches =
    confirmPassword.length > 0 && password === confirmPassword;

  return (
    <main className="register-page">
      <style jsx global>{`
        .register-page {
          position: relative;
          isolation: isolate;
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 85px 24px 50px;
          overflow: hidden;
          color: #ffffff !important;
          font-family: Arial, Helvetica, sans-serif;
        }

        .register-page *,
        .register-page *::before,
        .register-page *::after {
          box-sizing: border-box;
        }

        /* PAGE LAYOUT */

        .register-layout {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 1080px;
          display: grid;
          grid-template-columns: 1fr 460px;
          gap: 75px;
          align-items: center;
        }

        /* LEFT INTRODUCTION */

        .register-intro {
          max-width: 520px;
        }

        .register-kicker {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #e0e7ff !important;
          font-family: monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.4);
        }

        .register-kicker::before {
          content: "";
          height: 1px;
          width: 32px;
          background: #c3d0ff;
        }

        .register-heading {
          margin-top: 28px;
          color: #ffffff !important;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(48px, 6vw, 76px);
          font-weight: 400;
          letter-spacing: -0.065em;
          line-height: 0.98;
          text-shadow: 0 2px 20px rgba(0, 0, 0, 0.35);
        }

        .register-heading em {
          color: #c3d0ff !important;
          font-weight: 400;
        }

        .register-description {
          max-width: 390px;
          margin-top: 25px;
          color: #f0f2f8 !important;
          font-family: monospace;
          font-size: 12px;
          line-height: 2;
          text-shadow: 0 1px 9px rgba(0, 0, 0, 0.5);
        }

        /* REGISTRATION STEPS */

        .register-steps {
          margin-top: 55px;
          display: grid;
          gap: 0;
          max-width: 390px;
        }

        .register-step {
          display: grid;
          grid-template-columns: 35px 1fr;
          gap: 14px;
          padding: 16px 0;
          border-top: 1px solid rgba(255, 255, 255, 0.3);
        }

        .register-step-number {
          color: #c4d0ff !important;
          font-family: monospace;
          font-size: 11px;
          font-weight: 700;
        }

        .register-step strong {
          display: block;
          color: #ffffff !important;
          font-family: Georgia, serif;
          font-size: 19px;
          font-weight: 400;
        }

        .register-step span {
          display: block;
          margin-top: 5px;
          color: #e0e5f0 !important;
          font-family: monospace;
          font-size: 10px;
          line-height: 1.8;
        }

        /* REGISTRATION PANEL */

        .register-panel {
          position: relative;
          z-index: 3;
          padding: 36px 34px;
          border: 1px solid rgba(255, 255, 255, 0.95);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.3);
          color: #171b2a !important;
        }

        .register-panel::before {
          content: "";
          position: absolute;
          top: 0;
          left: 30px;
          width: 55px;
          height: 3px;
          border-radius: 0 0 3px 3px;
          background: #5269ad;
        }

        .register-logo {
          display: inline-block;
          color: #171b2a !important;
          font-family: Georgia, serif;
          font-size: 25px;
          font-weight: 600;
          letter-spacing: -0.06em;
          text-decoration: none;
        }

        .register-logo span {
          color: #405ba7 !important;
        }

        .register-subtitle {
          margin-top: 7px;
          color: #596783 !important;
          font-family: monospace;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
        }

        .register-title {
          margin-top: 30px;
          color: #171b2a !important;
          font-family: Georgia, serif;
          font-size: 34px;
          font-weight: 400;
          letter-spacing: -0.045em;
        }

        .register-hint {
          margin-top: 8px;
          color: #515c72 !important;
          font-family: monospace;
          font-size: 11px;
          line-height: 1.8;
        }

        /* FORM FIELDS */

        .register-form {
          margin-top: 25px;
        }

        .register-field {
          margin-bottom: 17px;
        }

        .register-label {
          display: block;
          margin-bottom: 8px;
          color: #293651 !important;
          font-family: monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .register-input-wrap {
          position: relative;
        }

        .register-input {
          display: block;
          width: 100%;
          height: 47px;
          padding: 0 14px;
          border: 1px solid #bdc6d6;
          border-radius: 5px;
          background: #ffffff !important;
          color: #171b2a !important;
          font-family: monospace;
          font-size: 12px;
          opacity: 1;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .register-input::placeholder {
          color: #727d92 !important;
          opacity: 1;
        }

        .register-input:focus {
          border-color: #5269ad;
          box-shadow: 0 0 0 3px rgba(82, 105, 173, 0.15);
        }

        .register-password {
          padding-right: 48px;
        }

        .register-eye {
          position: absolute;
          top: 50%;
          right: 13px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
          border: 0;
          background: transparent;
          color: #40516f !important;
          cursor: pointer;
        }

        .register-eye:hover {
          color: #405ba7 !important;
        }

        /* PASSWORD MATCH */

        .register-match {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 7px;
          color: #17623d !important;
          font-family: monospace;
          font-size: 10px;
          font-weight: 700;
        }

        /* ERROR */

        .register-error {
          margin-bottom: 16px;
          padding: 12px;
          border: 1px solid #e8bfc4;
          border-radius: 5px;
          background: #fff0f1;
          color: #a32f42 !important;
          font-family: monospace;
          font-size: 11px;
          line-height: 1.6;
        }

        /* BUTTON */

        .register-submit {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 51px;
          margin-top: 25px;
          padding: 0 17px;
          border: 1px solid #222b43;
          border-radius: 5px;
          background: #222b43;
          color: #ffffff !important;
          font-family: monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .register-submit:hover:not(:disabled) {
          background: #405ba7;
          border-color: #405ba7;
        }

        .register-submit:active:not(:disabled) {
          transform: translateY(1px);
        }

        .register-submit:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* LOGIN LINK */

        .register-login {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid #d4dae5;
          color: #46536c !important;
          font-family: monospace;
          font-size: 10px;
          font-weight: 600;
          line-height: 2;
          text-align: center;
        }

        .register-login a {
          color: #354f9d !important;
          font-weight: 700;
          text-decoration: none;
        }

        .register-login a:hover {
          text-decoration: underline;
        }

        .register-back {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          margin-top: 18px;
          color: #596783 !important;
          font-family: monospace;
          font-size: 10px;
          font-weight: 600;
          text-decoration: none;
        }

        .register-back:hover {
          color: #354f9d !important;
        }

        .register-corner {
          position: absolute;
          right: 25px;
          bottom: 22px;
          color: #ffffff !important;
          font-family: monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-shadow: 0 1px 5px rgba(0, 0, 0, 0.5);
        }

        /* RESPONSIVE */

        @media (max-width: 850px) {
          .register-layout {
            grid-template-columns: 1fr;
            max-width: 480px;
            gap: 35px;
          }

          .register-intro {
            text-align: center;
            margin: auto;
          }

          .register-kicker {
            justify-content: center;
          }

          .register-description {
            margin-left: auto;
            margin-right: auto;
          }

          .register-steps {
            display: none;
          }

          .register-heading {
            font-size: 54px;
          }
        }

        @media (max-width: 480px) {
          .register-page {
            padding: 65px 16px 35px;
          }

          .register-panel {
            padding: 28px 21px;
            border-radius: 14px;
          }

          .register-heading {
            font-size: 45px;
          }

          .register-title {
            font-size: 30px;
          }
        }
      `}</style>

      {/* LEFT INTRODUCTION */}

      <div className="register-layout">
        <section className="register-intro">
          <p className="register-kicker">
            RESEARCHHUB / JOIN THE WORKSPACE
          </p>

          <h1 className="register-heading">
            Every idea
            <br />
            deserves
            <br />
            <em>a closer look.</em>
          </h1>

          <p className="register-description">
            Create your student account to submit academic
            research, follow review progress and take part
            in a structured research community.
          </p>

          <div className="register-steps">
            <div className="register-step">
              <span className="register-step-number">01</span>
              <div>
                <strong>Create your account</strong>
                <span>
                  Register with your name and email address.
                </span>
              </div>
            </div>

            <div className="register-step">
              <span className="register-step-number">02</span>
              <div>
                <strong>Submit your research</strong>
                <span>
                  Add your manuscript and research keywords.
                </span>
              </div>
            </div>

            <div className="register-step">
              <span className="register-step-number">03</span>
              <div>
                <strong>Follow the review</strong>
                <span>
                  Track assignments and academic feedback.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* REGISTRATION FORM */}

        <section className="register-panel">
          <Link href="/" className="register-logo">
            Research<span>Hub.</span>
          </Link>

          <p className="register-subtitle">
            ACADEMIC RESEARCH & PEER REVIEW PORTAL
          </p>

          <h2 className="register-title">
            Create your account.
          </h2>

          <p className="register-hint">
            Register as a student to enter the workspace.
          </p>

          <form onSubmit={handleRegister} className="register-form">
            <div className="register-field">
              <label className="register-label" htmlFor="fullName">
                Full name
              </label>

              <input
                id="fullName"
                type="text"
                required
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                className="register-input"
              />
            </div>

            <div className="register-field">
              <label className="register-label" htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                required
                maxLength={150}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="register-input"
              />
            </div>

            <div className="register-field">
              <label className="register-label" htmlFor="password">
                Password
              </label>

              <div className="register-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                  className="register-input register-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="register-eye"
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            <div className="register-field">
              <label
                className="register-label"
                htmlFor="confirmPassword"
              >
                Confirm password
              </label>

              <div className="register-input-wrap">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  className="register-input register-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="register-eye"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>

              {passwordMatches && (
                <p className="register-match">
                  <Check size={13} />
                  Passwords match
                </p>
              )}
            </div>

            {error && (
              <p role="alert" className="register-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="register-submit"
            >
              <span>
                {loading
                  ? "CREATING ACCOUNT..."
                  : "CREATE STUDENT ACCOUNT"}
              </span>

              <ArrowUpRight size={17} />
            </button>
          </form>

          <div className="register-login">
            ALREADY REGISTERED?
            <br />

            <Link href="/login">
              Sign in to your account ↗
            </Link>
          </div>

          <Link href="/" className="register-back">
            <ArrowLeft size={13} />
            Back to ResearchHub
          </Link>
        </section>
      </div>

      <span className="register-corner">
        RESEARCHHUB / 2026
      </span>
    </main>
  );
}
