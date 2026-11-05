
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowUpRight,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Login failed");
        return;
      }

      const destinations: Record<string, string> = {
        STUDENT: "/submit",
        REVIEWER: "/reviews",
        ADMIN: "/",
        COORDINATOR: "/assignments",
      };

      router.replace(destinations[data.user.role] || "/");
      router.refresh();
    } catch {
      setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <style jsx global>{`
        .login-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 90px 24px 50px;
          position: relative;
          isolation: isolate;
          overflow: visible;
          color: #ffffff;
          font-family: Arial, Helvetica, sans-serif;
        }

        .login-page *,
        .login-page *::before,
        .login-page *::after {
          box-sizing: border-box;
        }

        .login-layout {
          position: relative;
          z-index: 10;
          pointer-events: auto;
          width: 100%;
          max-width: 1080px;
          display: grid;
          grid-template-columns: 1fr 440px;
          gap: 80px;
          align-items: center;
        }
        /* LEFT INTRODUCTION */

        .login-intro {
          max-width: 520px;
        }

        .login-kicker {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #c6d2ff;
          font-family: monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .login-kicker::before {
          content: "";
          height: 1px;
          width: 32px;
          background: #aebfff;
        }

        .login-heading {
          margin-top: 28px;
          font-family: Georgia, "Times New Roman", serif;
          font-size: clamp(48px, 6vw, 76px);
          font-weight: 400;
          letter-spacing: -0.065em;
          line-height: 0.98;
          color: #ffffff;
          text-shadow: 0 2px 18px rgba(0, 0, 0, 0.2);
        }

        .login-heading em {
          color: #b9c9ff;
          font-weight: 400;
        }

        .login-description {
          max-width: 390px;
          margin-top: 25px;
          color: #e2e5ee;
          font-family: monospace;
          font-size: 12px;
          line-height: 2;
          text-shadow: 0 1px 8px rgba(0, 0, 0, 0.35);
        }

        .login-meta {
          margin-top: 55px;
          display: flex;
          flex-wrap: wrap;
          gap: 25px;
        }

        .login-meta-item {
          border-left: 1px solid rgba(255, 255, 255, 0.35);
          padding-left: 12px;
        }

        .login-meta-item strong {
          display: block;
          font-family: Georgia, serif;
          font-size: 24px;
          font-weight: 400;
          color: #d6dfff;
        }

        .login-meta-item span {
          display: block;
          margin-top: 4px;
          color: #e0e4ef;
          font-family: monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
        }

        /* LOGIN GLASS PANEL */

        .login-panel {
          position: relative;
          padding: 40px 34px;
          border: 1px solid rgba(255, 255, 255, 0.85);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.91);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.22);
          color: #171b2a;
          z-index: 11;
          pointer-events: auto;
        }

        .login-panel::before {
          content: "";
          position: absolute;
          top: 0;
          left: 30px;
          width: 55px;
          height: 3px;
          background: #5269ad;
        }

        .login-logo {
          display: inline-block;
          color: #171b2a;
          font-family: Georgia, serif;
          font-size: 25px;
          font-weight: 600;
          letter-spacing: -0.06em;
          text-decoration: none;
        }

        .login-logo span {
          color: #5269ad;
        }

        .login-subtitle {
          margin-top: 7px;
          color: #68738c;
          font-family: monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
        }

        .login-title {
          margin-top: 42px;
          color: #171b2a;
          font-family: Georgia, serif;
          font-size: 35px;
          font-weight: 400;
          letter-spacing: -0.045em;
        }

        .login-hint {
          margin-top: 8px;
          color: #626b7c;
          font-family: monospace;
          font-size: 11px;
          line-height: 1.8;
        }

        /* FORM */

        .login-form {
          margin-top: 32px;
        }

        .login-field {
          margin-bottom: 22px;
        }

        .login-label {
          display: block;
          margin-bottom: 9px;
          color: #35415b;
          font-family: monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .login-input-wrap {
          position: relative;
        }

        .login-input {
          width: 100%;
          height: 49px;
          padding: 0 14px;
          border: 1px solid #cbd1df;
          border-radius: 5px;
          background: #ffffff;
          color: #171b2a;
          font-family: monospace;
          font-size: 12px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .login-input::placeholder {
          color: #9299a8;
        }

        .login-input:focus {
          border-color: #5269ad;
          box-shadow: 0 0 0 3px rgba(82, 105, 173, 0.13);
        }

        .login-password {
          padding-right: 48px;
        }

        .login-eye {
          position: absolute;
          top: 50%;
          right: 13px;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 0;
          background: transparent;
          color: #59647b;
          cursor: pointer;
        }

        .login-eye:hover {
          color: #5269ad;
        }

        /* ERROR MESSAGE */

        .login-error {
          margin-bottom: 18px;
          padding: 12px;
          border: 1px solid #e8bfc4;
          border-radius: 5px;
          background: #fff0f1;
          color: #a32f42;
          font-family: monospace;
          font-size: 11px;
          line-height: 1.6;
        }

        /* SIGN IN BUTTON */

        .login-submit {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          min-height: 51px;
          margin-top: 28px;
          padding: 0 17px;
          border: 1px solid #222b43;
          border-radius: 5px;
          background: #222b43;
          color: #ffffff;
          font-family: monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .login-submit:hover:not(:disabled) {
          background: #5269ad;
          border-color: #5269ad;
        }

        .login-submit:active:not(:disabled) {
          transform: translateY(1px);
        }

        .login-submit:disabled {
          opacity: 0.6;
          cursor: wait;
        }

        /* REGISTER LINK */

        .login-register {
          margin-top: 28px;
          padding-top: 22px;
          border-top: 1px solid #dce0e9;
          color: #59647b;
          font-family: monospace;
          font-size: 10px;
          line-height: 2;
          text-align: center;
        }

        .login-register a {
          color: #405ba7;
          font-weight: 700;
          text-decoration: none;
        }

        .login-register a:hover {
          text-decoration: underline;
        }

        .login-back {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          margin-top: 23px;
          color: #69738a;
          font-family: monospace;
          font-size: 10px;
          text-decoration: none;
        }

        .login-back:hover {
          color: #405ba7;
        }

        .login-corner {
          position: absolute;
          right: 25px;
          bottom: 22px;
          color: rgba(255, 255, 255, 0.75);
          font-family: monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
        }

        /* RESPONSIVE */

        @media (max-width: 850px) {
          .login-layout {
            grid-template-columns: 1fr;
            max-width: 480px;
            gap: 38px;
          }

          .login-intro {
            text-align: center;
            margin: auto;
          }

          .login-kicker {
            justify-content: center;
          }

          .login-description {
            margin-left: auto;
            margin-right: auto;
          }

          .login-meta {
            justify-content: center;
            margin-top: 25px;
          }

          .login-heading {
            font-size: 54px;
          }
        }

        @media (max-width: 480px) {
          .login-page {
            padding: 80px 16px 35px;
          }

          .login-panel {
            padding: 30px 22px;
            border-radius: 14px;
          }

          .login-heading {
            font-size: 45px;
          }

          .login-title {
            font-size: 30px;
          }

          .login-meta {
            gap: 16px;
          }
        }
      `}</style>

      <div className="login-layout">
        {/* LEFT INTRODUCTION */}

        <section className="login-intro">
          <p className="login-kicker">
            RESEARCHHUB / ACCESS PORTAL
          </p>

          <h1 className="login-heading">
            Research
            <br />
            begins with
            <br />
            <em>the right people.</em>
          </h1>

          <p className="login-description">
            A considered space for academic research,
            peer evaluation and meaningful collaboration.
            Sign in to continue your work.
          </p>

          <div className="login-meta">
            <div className="login-meta-item">
              <strong>01</strong>
              <span>SUBMIT</span>
            </div>

            <div className="login-meta-item">
              <strong>02</strong>
              <span>REVIEW</span>
            </div>

            <div className="login-meta-item">
              <strong>03</strong>
              <span>IMPROVE</span>
            </div>
          </div>
        </section>

        {/* LOGIN FORM */}

        <section className="login-panel">
          <Link href="/" className="login-logo">
            Research<span>Hub.</span>
          </Link>

          <p className="login-subtitle">
            ACADEMIC RESEARCH & PEER REVIEW PORTAL
          </p>

          <h2 className="login-title">
            Welcome back.
          </h2>

          <p className="login-hint">
            Sign in to access your research workspace.
          </p>

          <form onSubmit={handleLogin} className="login-form">
            <div className="login-field">
              <label className="login-label" htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="login-input"
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">
                Password
              </label>

              <div className="login-input-wrap">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="login-input login-password"
                />

                <button
                  type="button"
                  className="login-eye"
                  onClick={() => setShowPassword(!showPassword)}
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

            {error && (
              <p role="alert" className="login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="login-submit"
            >
              <span>
                {loading ? "AUTHENTICATING..." : "SIGN IN TO WORKSPACE"}
              </span>

              <ArrowUpRight size={17} />
            </button>
          </form>

          <div className="login-register">
            NEW TO RESEARCHHUB?
            <br />

            <Link href="/register">
              Create an account ↗
            </Link>
          </div>

          <Link href="/" className="login-back">
            <ArrowLeft size={13} />
            Back to ResearchHub
          </Link>
        </section>
      </div>

      <span className="login-corner">
        RESEARCHHUB / 2026
      </span>
    </main>
  );
}
