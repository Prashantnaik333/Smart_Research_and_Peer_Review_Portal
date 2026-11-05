"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type DatabaseStatus = {
  loading: boolean;
  connected: boolean;
  details: string;
};

type LoggedInUser = {
  userId: number;
  fullName: string;
  email: string;
  role: string;
};

const initialStatus: DatabaseStatus = {
  loading: true,
  connected: false,
  details: "Checking connection...",
};

function Brand() {
  return (
    <span className="brand-word">
      ResearchHub<span>.</span>
    </span>
  );
}

export default function Home() {
  const router = useRouter();

  const [postgres, setPostgres] =
    useState<DatabaseStatus>(initialStatus);

  const [mongo, setMongo] =
    useState<DatabaseStatus>(initialStatus);

  const [user, setUser] =
    useState<LoggedInUser | null>(null);

  const [authLoading, setAuthLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const [manuscriptCount, setManuscriptCount] =
    useState<number | null>(null);

  const [assignmentCount, setAssignmentCount] =
    useState<number | null>(null);

  const traveller = useRef<HTMLDivElement | null>(null);

  // AUTHENTICATION AND DATABASE STATUS

  useEffect(() => {
    let active = true;

    async function checkUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (active && response.ok && data.success) {
          setUser(data.user);
        } else if (active) {
          setUser(null);
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    async function checkDatabases() {
      try {
        const response = await fetch("/api/database-status", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!active) return;

        if (response.status === 401) {
          const loggedOut = {
            loading: false,
            connected: false,
            details: "Log in to view connection status.",
          };

          setPostgres(loggedOut);
          setMongo(loggedOut);
          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to check database connections."
          );
        }

        setPostgres({
          loading: false,
          connected: data.postgres?.connected === true,
          details:
            data.postgres?.status || "Connection status unavailable.",
        });

        setMongo({
          loading: false,
          connected: data.mongodb?.connected === true,
          details:
            data.mongodb?.status || "Connection status unavailable.",
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to check database connections.";

        if (!active) return;

        setPostgres({
          loading: false,
          connected: false,
          details: message,
        });

        setMongo({
          loading: false,
          connected: false,
          details: message,
        });
      }
    }

    checkUser();
    checkDatabases();

    return () => {
      active = false;
    };
  }, []);

  // LOAD MANUSCRIPT AND ASSIGNMENT COUNTS

  useEffect(() => {
    if (!user) return;

    let active = true;

    async function loadCounts() {
      try {
        const [manuscriptsResponse, assignmentsResponse] =
          await Promise.all([
            fetch("/api/manuscripts", { cache: "no-store" }),
            fetch("/api/assignments", { cache: "no-store" }),
          ]);

        if (manuscriptsResponse.ok) {
          const data = await manuscriptsResponse.json();

          if (
            active &&
            data.success &&
            Array.isArray(data.manuscripts)
          ) {
            setManuscriptCount(data.manuscripts.length);
          }
        }

        if (assignmentsResponse.ok) {
          const data = await assignmentsResponse.json();

          if (
            active &&
            data.success &&
            Array.isArray(data.assignments)
          ) {
            setAssignmentCount(data.assignments.length);
          }
        }
      } catch {
        // Counts remain unavailable if an API fails.
      }
    }

    loadCounts();

    return () => {
      active = false;
    };
  }, [user]);

  // TRAVELLING MANUSCRIPT ANIMATION

  useEffect(() => {
    const node = traveller.current;
    if (!node) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    if (reduceMotion.matches) {
      node.style.display = "none";
      return;
    }

    let frame = 0;

    const update = () => {
      cancelAnimationFrame(frame);

      frame = requestAnimationFrame(() => {
        const maxScroll = Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight
        );

        const progress = Math.min(
          1,
          Math.max(0, window.scrollY / maxScroll)
        );

        const x = 76 - progress * 49;
        const y = 25 + progress * 48;
        const rotation = -10 + progress * 30;
        const scale = 1.08 - progress * 0.42;

        const opacity =
          progress < 0.58
            ? 1
            : Math.max(0, 1 - (progress - 0.58) / 0.18);

        node.style.left = `${x}%`;
        node.style.top = `${y}%`;

        node.style.transform = `
          translate(-50%, -50%)
          rotate(${rotation}deg)
          scale(${scale})
        `;

        node.style.opacity = String(opacity);

        node.style.visibility =
          opacity <= 0.01 ? "hidden" : "visible";
      });
    };

    update();

    window.addEventListener("scroll", update, {
      passive: true,
    });

    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // LOGOUT

  async function handleLogout() {
    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      setUser(null);
      router.replace("/login");
      router.refresh();
    } catch {
      alert("Unable to logout. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  }

  const statusText = (db: DatabaseStatus) =>
    db.loading
      ? "CHECKING"
      : db.connected
        ? "CONNECTED"
        : "UNAVAILABLE";

  // ROLE-BASED NAVIGATION
  // These links are shown according to the authenticated user's role.
  const roleLinks: Record<string, { href: string; label: string }[]> = {
    STUDENT: [
      { href: "/submit", label: "SUBMIT MANUSCRIPT" },
      { href: "/manuscripts", label: "MY MANUSCRIPTS" },
      { href: "/discussions", label: "DISCUSSIONS" },
      { href: "/student/dashboard", label: "REVIEWS" },
    ],
    REVIEWER: [
      { href: "/reviews", label: "REVIEW WORKSPACE" },
      { href: "/assignments", label: "MY ASSIGNMENTS" },
      { href: "/discussions", label: "DISCUSSIONS" },
    ],
    ADMIN: [
      { href: "/submit", label: "SUBMIT" },
      { href: "/manuscripts", label: "MANUSCRIPTS" },
      { href: "/reviews", label: "REVIEWS" },
      { href: "/assignments", label: "ASSIGNMENTS" },
      { href: "/reviewers", label: "REVIEWERS" },
      { href: "/reports", label: "REPORTS" },
      { href: "/discussions", label: "DISCUSSIONS" },
    ],
    COORDINATOR: [
      { href: "/manuscripts", label: "MANUSCRIPTS" },
      { href: "/assignments", label: "ASSIGNMENTS" },
      { href: "/reviewers", label: "REVIEWERS" },
      { href: "/reports", label: "REPORTS" },
      { href: "/discussions", label: "DISCUSSIONS" },
    ],
  };

  const visibleLinks = user ? roleLinks[user.role] ?? [] : [];

  return (
    <main className="paper-site">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&display=swap');

        :root {
          --paper: #080B14;
          --paper-deep: #111827;
          --ink: #F8FAFF;
          --ink-soft: #D1D8E6;
          --muted: #AAB5C8;
          --blue: #91B2FF;
          --hair: rgba(220,230,255,.22);
        }

        * {
          box-sizing: border-box;
        }
        html,
        body {
          margin: 0;
          min-height: 100%;
          background: #080B14 !important;
          color: #F8FAFF !important;
        }

        .paper-site {
          position: relative;
          z-index: 1;
          min-height: 100vh;
          overflow: visible;
          background: transparent !important;
          color: #F8FAFF !important;
        }
         
        .paper-site p,
        .paper-site li,
        .paper-site dd,
        .paper-site span,
        .paper-site .row-copy,
        .paper-site .hero-lede,
        .paper-site .section-lede {
          color: #D1D8E6;
        }

        .paper-site h1,
        .paper-site h2,
        .paper-site h3,
        .paper-site .account-name {
          color: #F8FAFF;
        }

        .paper-site .eyebrow,
        .paper-site .kicker,
        .paper-site .row-tag,
        .paper-site .measure-row dt {
          color: #91B2FF !important;
        }

        .paper-site .spread span {
          color: rgba(220,230,255,.13);
        }

        .paper-site .square-btn {
          color: #F8FAFF;
          border-color: #AAB5C8;
        }

        .paper-site .square-btn:hover {
          background: #F8FAFF;
          color: #080B14;
        }

        .paper-site .square-btn.blue {
          color: #91B2FF;
          border-color: #91B2FF;
        }

        .paper-site .square-btn.blue:hover {
          background: #91B2FF;
          color: #080B14;
        }

        .mono,
        .paper-site p,
        .paper-site a,
        .paper-site button,
        .paper-site li,
        .paper-site small,
        .paper-site dt,
        .paper-site dd {
          font-family: 'Courier Prime', monospace;
        }

        .paper-site p {
          font-size: 12px;
          line-height: 1.9;
          letter-spacing: .035em;
          color: var(--ink-soft);
          text-shadow: none;
        }

        .serif {
          font-family: 'Newsreader', serif;
          font-weight: 400;
          letter-spacing: -.035em;
          line-height: .98;
        }

        .serif em {
          color: var(--blue);
          font-weight: 400;
        }

        /* NAVIGATION */

        .topbar {
          position: fixed;
          z-index: 50;
          inset: 0 0 auto;
          min-height: 58px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 7px 4.5vw;
          background: rgba(9,11,18,.88);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          border-bottom: 1px solid rgba(226,233,246,.18);
          pointer-events: auto;
        }

        .brand-word {
          font-family: 'Newsreader', serif;
          font-size: 20px;
          letter-spacing: -.04em;
          font-weight: 600;
          white-space: nowrap;
          color: var(--ink);
        }

        .brand-word span {
          color: var(--blue);
        }

        .navlinks {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: clamp(14px,2.5vw,38px);
          position: relative;
          z-index: 60;
          pointer-events: auto;
        }

        .navlinks > a {
          color: var(--ink-soft);
          text-decoration: none;
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: .12em;
          transition: color .2s;
        }

        .navlinks > a:hover {
          color: var(--blue);
        }

        /* ROLE-BASED OVAL NAVIGATION IN THE TOP RIGHT */
        .navlinks {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 9px;
          max-width: calc(100% - 190px);
        }

        .navlinks .role-nav-link,
        .navlinks .square-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          padding: 0 14px;
          border: 1px solid rgba(145,178,255,.8);
          border-radius: 999px;
          background: rgba(145,178,255,.08);
          color: #F8FAFF;
          text-decoration: none;
          font: 700 9px 'Courier Prime', monospace;
          letter-spacing: .07em;
          white-space: nowrap;
          transition: background .2s, color .2s, transform .2s;
        }

        .navlinks .role-nav-link:hover,
        .navlinks .square-btn:hover {
          background: #91B2FF;
          color: #080B14;
          transform: translateY(-1px);
        }

        .navlinks .role-nav-link.active {
          background: #91B2FF;
          color: #080B14;
        }

        .navlinks .account-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 9px;
        }

        .navlinks .account-details {
          min-width: 110px;
          padding: 4px 9px;
          border: 1px solid var(--hair);
          background: rgba(16,21,34,.82);
        }

        .navlinks .logout-btn {
          border-color: rgba(220,230,255,.55);
          background: transparent;
        }

        .square-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 38px;
          padding: 0 17px;
          border: 1px solid var(--ink);
          border-radius: 0;
          background: transparent;
          color: var(--ink);
          text-decoration: none;
          font-size: 10px;
          letter-spacing: .1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background .2s, color .2s;
        }

        .square-btn:hover {
          background: var(--ink);
          color: var(--paper);
        }

        .square-btn.blue {
          border-color: var(--blue);
          color: var(--blue);
        }

        .square-btn.blue:hover {
          background: var(--blue);
          color: #090B12;
        }

        /* ACCOUNT DETAILS */

        .account-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .account-details {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 150px;
          max-width: 210px;
          padding: 6px 11px;
          border: 1px solid var(--hair);
          background: rgba(16,21,34,.82);
        }

        .account-name {
          overflow: hidden;
          color: var(--ink);
          font-family: 'Newsreader', serif;
          font-size: 16px;
          font-weight: 600;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .account-email {
          overflow: hidden;
          margin-top: 3px;
          color: var(--ink-soft);
          font-family: 'Courier Prime', monospace;
          font-size: 9px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .account-role {
          margin-top: 3px;
          color: var(--blue);
          font-family: 'Courier Prime', monospace;
          font-size: 9px;
          letter-spacing: .1em;
        }

        /* HERO */

        .hero {
          position: relative;
          min-height: calc(100svh - 58px);
          margin-top: 58px;
          padding: clamp(70px,10vh,110px) 8vw 0;
          background: transparent;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .hero-copy {
          position: relative;
          z-index: 2;
          width: min(620px,48vw);
        }

        .kicker,
        .eyebrow {
          color: var(--blue) !important;
          text-transform: uppercase;
          font-size: 10px !important;
          letter-spacing: .15em !important;
        }

        .hero h1 {
          margin: 22px 0;
          font-size: clamp(42px,5.5vw,78px);
          max-width: 720px;
          color: var(--ink);
        }

        .hero-lede {
          max-width: 440px;
        }

        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 25px;
        }

        .spec-strip {
          position: relative;
          z-index: 2;
          display: flex;
          gap: clamp(18px,4vw,60px);
          flex-wrap: wrap;
          border-top: 1px solid var(--hair);
          margin-top: auto;
          padding: 18px 0 22px;
        }

        .spec-strip span {
          font: 10px 'Courier Prime', monospace;
          color: var(--ink-soft);
          letter-spacing: .1em;
          text-transform: uppercase;
        }

        .spread {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          width: 108%;
          margin-left: -4%;
          overflow: hidden;
          white-space: nowrap;
          transform: translateY(.24em);
          pointer-events: none;
        }

        .spread span {
          font-family: 'Newsreader', serif;
          font-size: clamp(60px,12vw,180px);
          line-height: .78;
          letter-spacing: -.075em;
          font-weight: 500;
          color: rgba(244,245,248,.12);
        }

        /* GENERAL SECTIONS */

        .section {
          position: relative;
          z-index: 2;
          padding: clamp(75px,10vw,140px) 9vw;
          background: transparent;
        }

        .two-col {
          display: grid;
          grid-template-columns: minmax(220px,.85fr) minmax(0,1.15fr);
          gap: 9vw;
        }

        .section h2 {
          font-size: clamp(38px,4.5vw,64px);
          margin: 12px 0 22px;
          color: var(--ink);
        }

        .section-lede {
          max-width: 350px;
        }

        .ruled-list {
          border-top: 1px solid var(--hair);
        }

        .ruled-row {
          display: grid;
          grid-template-columns: 110px 1fr auto;
          gap: 22px;
          align-items: start;
          padding: 20px 0;
          border-bottom: 1px solid var(--hair);
        }

        .row-tag {
          color: var(--blue) !important;
          font-size: 10px !important;
          letter-spacing: .12em !important;
          text-transform: uppercase;
        }

        .row-copy {
          margin: 0;
          max-width: 500px;
        }

        .row-value {
          color: var(--ink);
          font-size: 11px;
          white-space: nowrap;
        }

        /* PLATFORM */

        .material-grid {
          display: grid;
          grid-template-columns: repeat(2,1fr);
          gap: 0 7vw;
          margin-top: 38px;
        }

        .material-item {
          border-top: 1px solid var(--hair);
          padding: 22px 0;
        }

        .material-item h3 {
          margin: 10px 0 6px;
          font: 500 27px 'Newsreader', serif;
          letter-spacing: -.02em;
          color: var(--ink);
        }

        /* MEASUREMENTS */

        .measurements {
          max-width: 850px;
          margin: 35px auto 0;
        }

        .measure-row {
          display: grid;
          grid-template-columns: 1fr 2fr auto;
          gap: 20px;
          padding: 18px 0;
          border-top: 1px solid var(--hair);
          align-items: baseline;
        }

        .measure-row:last-child {
          border-bottom: 1px solid var(--hair);
        }

        .measure-row dt {
          color: var(--blue);
          font-size: 10px;
          letter-spacing: .12em;
        }

        .measure-row dd {
          margin: 0;
          color: var(--ink-soft);
          font-size: 11px;
          line-height: 1.8;
        }

        .measure-value {
          color: var(--ink) !important;
          font-size: 18px !important;
          font-weight: 700;
          font-variant-numeric: tabular-nums;
        }

        .status-good {
          color: #75D6A5;
        }

        .status-bad {
          color: #FF9292;
        }

        .status-wait {
          color: #F3C879;
        }

        .status-line {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 14px 0;
          border-top: 1px solid var(--hair);
          font: 10px 'Courier Prime', monospace;
          letter-spacing: .08em;
          color: var(--ink-soft);
        }

        /* CLOSING */

        .close-section {
          padding-bottom: 0;
          background: transparent;
        }

        .close-inner {
          display: flex;
          justify-content: space-between;
          align-items: end;
          gap: 35px;
          padding-bottom: 65px;
        }

        .close-inner h2 {
          max-width: 700px;
        }

        .close-word {
          margin-top: 20px;
        }

        .footerline {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          border-top: 1px solid var(--hair);
          padding: 15px 0 0;
          color: var(--muted);
          font: 9px 'Courier Prime', monospace;
          letter-spacing: .1em;
        }

        /* TRAVELLING PAPER */

        .travelling-paper {
          position: fixed;
          z-index: 20;
          left: 76%;
          top: 25%;
          width: clamp(92px,12vw,170px);
          aspect-ratio: .72;
          pointer-events: none;
          opacity: 1;
          filter: drop-shadow(12px 18px 14px rgba(0,0,0,.45));
        }

        .paper-sheet {
          position: absolute;
          inset: 0;
          background: #F8F5ED;
          border: 1px solid rgba(20,28,43,.35);
          padding: 12% 10%;
          transform: rotate(2deg);
        }

        .paper-sheet:before {
          content: '';
          display: block;
          height: 7px;
          width: 55%;
          background: #365AA7;
          margin-bottom: 13%;
          opacity: .95;
        }

        .paper-lines {
          display: grid;
          gap: 7px;
        }

        .paper-lines i {
          display: block;
          height: 2px;
          background: rgba(20,28,43,.23);
        }

        .paper-lines i:nth-child(3n) {
          width: 68%;
        }

        .paper-mark {
          margin-top: 18%;
          border: 1px solid rgba(44,74,143,.5);
          height: 27%;
          display: grid;
          place-items: center;
          color: #2C4A8F;
          font: 9px 'Courier Prime', monospace;
        }

        @media (prefers-reduced-motion: reduce) {
          html {
            scroll-behavior: auto;
          }

          .travelling-paper {
            display: none !important;
          }

          * {
            transition-duration: .01ms !important;
            animation-duration: .01ms !important;
          }
        }

        @media (max-width: 800px) {
          .topbar {
            padding: 9px 18px;
            align-items: flex-start;
            flex-wrap: wrap;
          }

          .navlinks {
            max-width: 100%;
            justify-content: flex-start;
          }

          .navlinks {
            gap: 12px;
          }


          .account-details {
            min-width: 125px;
          }

          .hero {
            padding: 80px 7vw 0;
          }

          .hero-copy {
            width: min(100%,620px);
          }

          .two-col {
            grid-template-columns: 1fr;
            gap: 35px;
          }

          .ruled-row {
            grid-template-columns: 85px 1fr;
          }

          .row-value {
            grid-column: 2;
          }

          .close-inner {
            align-items: flex-start;
            flex-direction: column;
          }

          .material-grid {
            grid-template-columns: 1fr;
          }

          .measure-row {
            grid-template-columns: 1fr auto;
            gap: 5px 15px;
          }

          .measure-row dd {
            grid-column: 1;
          }

          .measure-value {
            grid-column: 2;
            grid-row: 1 / span 2;
          }

          .travelling-paper {
            width: 90px;
          }
        }

        @media (max-width: 480px) {
          .brand-word {
            font-size: 18px;
          }

          .navlinks .role-nav-link,
          .navlinks .square-btn {
            min-height: 32px;
            padding: 0 10px;
            font-size: 8px;
          }

          .account-details {
            min-width: 105px;
            max-width: 130px;
            padding: 5px 7px;
          }

          .account-name {
            font-size: 13px;
          }

          .account-email {
            font-size: 8px;
          }

          .account-role {
            font-size: 8px;
          }

          .account-actions {
            gap: 6px;
          }

          .account-actions .square-btn {
            padding: 0 8px;
            font-size: 8px;
          }

          .hero h1 {
            font-size: 44px;
          }

          .spec-strip {
            gap: 12px 22px;
          }

          .spread span {
            font-size: 62px;
          }

          .footerline {
            flex-direction: column;
          }
        }
      `}</style>

      {/* TRAVELLING MANUSCRIPT */}

      <div
        className="travelling-paper"
        ref={traveller}
        aria-hidden="true"
      >
        <div className="paper-sheet">
          <div className="paper-lines">
            {Array.from({ length: 8 }).map((_, index) => (
              <i key={index} />
            ))}
          </div>

          <div className="paper-mark">
            RESEARCH
            <br />
            PAPER
          </div>
        </div>
      </div>

      {/* NAVIGATION */}

      <nav className="topbar" aria-label="Main navigation">
        <Link
          href="/"
          aria-label="ResearchHub home"
          style={{
            color: "inherit",
            textDecoration: "none",
          }}
        >
          <Brand />
        </Link>

        <div className="navlinks">
          {authLoading ? (
            <span className="mono" style={{ fontSize: 10, color: "#D1D8E6" }}>
              LOADING...
            </span>
          ) : user ? (
            <>
              {visibleLinks.map((item) => (
                <Link
                  className="role-nav-link"
                  href={item.href}
                  key={item.href}
                >
                  {item.label} ↗
                </Link>
              ))}

              <div className="account-actions">
                <div className="account-details">
                  <span className="account-name">{user.fullName}</span>
                  <span className="account-email">{user.email}</span>
                  <span className="account-role">{user.role}</span>
                </div>
                <button
                  className="square-btn logout-btn"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? "EXITING" : "LOG OUT"}
                </button>
              </div>
            </>
          ) : (
                  <a
        href="/login"
        className="square-btn"
        style={{
          position: "relative",
          zIndex: 60,
          pointerEvents: "auto",
          cursor: "pointer",
        }}
>
  SIGN IN
</a>
          )}
        </div>
      </nav>

      {/* HERO */}

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="kicker">
            AN ACADEMIC REVIEW WORKSPACE / 2026
          </p>

          <h1 className="serif">
            Research deserves a{" "}
            <em>closer review.</em>
          </h1>

          <p className="hero-lede">
            A considered workspace for research submissions,
            reviewer assignments and academic feedback.
            Bring the paper, the right expertise and the
            review process into one place.
          </p>
        </div>

        <div className="spec-strip">
          <span>01 / SUBMIT</span>
          <span>02 / ASSIGN</span>
          <span>03 / REVIEW</span>
          <span>04 / IMPROVE</span>
        </div>

        <div className="spread" aria-label="ResearchHub">
          {"RESEARCHHUB".split("").map((letter, index) => (
            <span key={`${letter}-${index}`}>{letter}</span>
          ))}
        </div>
      </section>

      {/* ARGUMENT */}

      <section className="section two-col" id="approach">
        <div>
          <p className="eyebrow">THE REASON FOR THE WORK</p>

          <h2 className="serif">
            Good research needs{" "}
            <em>the right readers.</em>
          </h2>

          <p className="section-lede">
            Keyword-only discovery can miss papers that
            explore the same idea in different language.
            Manual reviewer allocation can also take time
            and make expertise harder to coordinate.
          </p>
        </div>

        <div className="ruled-list">
          <div className="ruled-row">
            <p className="row-tag">01 / DISCOVER</p>
            <p className="row-copy">
              Organise manuscripts with abstracts, keywords
              and research-topic tags so related work is easier to inspect.
            </p>
            <span className="row-value">STRUCTURE</span>
          </div>

          <div className="ruled-row">
            <p className="row-tag">02 / MATCH</p>
            <p className="row-copy">
              Use reviewer expertise and availability to
              support a transparent, explainable assignment decision.
            </p>
            <span className="row-value">EXPERTISE</span>
          </div>

          <div className="ruled-row">
            <p className="row-tag">03 / EVALUATE</p>
            <p className="row-copy">
              Keep scores, recommendations and comments
              connected to the manuscript assignment.
            </p>
            <span className="row-value">FEEDBACK</span>
          </div>
        </div>
      </section>

      {/* PLATFORM */}

      <section className="section" id="materials">
        <div className="two-col">
          <div>
            <p className="eyebrow">THE WORKING PARTS</p>

            <h2 className="serif">
              A clear record of{" "}
              <em>every decision.</em>
            </h2>

            <p className="section-lede">
              The portal separates structured academic
              records from flexible discussion content,
              while keeping the workflow connected.
            </p>
          </div>

          <div className="ruled-list">
            <div className="ruled-row">
              <p className="row-tag">RELATIONAL</p>
              <p className="row-copy">
                PostgreSQL stores users, departments,
                manuscripts, topics, assignments and reviews.
              </p>
              <span className="row-value">POSTGRESQL</span>
            </div>

            <div className="ruled-row">
              <p className="row-tag">DOCUMENT</p>
              <p className="row-copy">
                MongoDB stores discussion documents and
                nested messages where the conversation structure can vary.
              </p>
              <span className="row-value">MONGODB</span>
            </div>

            <div className="ruled-row">
              <p className="row-tag">CONTROL</p>
              <p className="row-copy">
                Role-based access separates student,
                reviewer and administrative actions.
              </p>
              <span className="row-value">RBAC</span>
            </div>

            <div className="ruled-row">
              <p className="row-tag">TRACE</p>
              <p className="row-copy">
                Review records and audit events help
                preserve an accountable process.
              </p>
              <span className="row-value">AUDIT LOG</span>
            </div>
          </div>
        </div>

        <div className="material-grid">
          <article className="material-item">
            <p className="eyebrow">01 / SUBMISSION</p>
            <h3>Manuscript records</h3>
            <p>
              Capture a paper's title, abstract, keywords,
              submission status and owner.
            </p>
          </article>

          <article className="material-item">
            <p className="eyebrow">02 / ASSIGNMENT</p>
            <h3>Reviewer expertise</h3>
            <p>
              Connect a manuscript to an available reviewer
              and a defined review deadline.
            </p>
          </article>

          <article className="material-item">
            <p className="eyebrow">03 / EVALUATION</p>
            <h3>Peer review</h3>
            <p>
              Record technical and originality scores,
              recommendations and written feedback.
            </p>
          </article>

          <article className="material-item">
            <p className="eyebrow">04 / DISCUSSION</p>
            <h3>Research dialogue</h3>
            <p>
              Keep assignment-related discussions and
              messages in the document store.
            </p>
          </article>
        </div>
      </section>

      {/* MEASUREMENTS */}

      <section className="section" id="measurements">
        <div style={{ textAlign: "center" }}>
          <p className="eyebrow">LIVE WORKSPACE SNAPSHOT</p>

          <h2 className="serif">
            The record,{" "}
            <em>as it stands.</em>
          </h2>

          <p style={{ maxWidth: 500, margin: "15px auto 0" }}>
            Counts below are read from the authenticated
            portal APIs where available.
          </p>
        </div>

        <dl className="measurements">
          <div className="measure-row">
            <dt>MANUSCRIPTS</dt>
            <dd>Records visible to the current signed-in role</dd>
            <dd className="measure-value">
              {manuscriptCount === null
                ? "—"
                : manuscriptCount.toString().padStart(2, "0")}
            </dd>
          </div>

          <div className="measure-row">
            <dt>ASSIGNMENTS</dt>
            <dd>Assignments visible to the current signed-in role</dd>
            <dd className="measure-value">
              {assignmentCount === null
                ? "—"
                : assignmentCount.toString().padStart(2, "0")}
            </dd>
          </div>

          <div className="measure-row">
            <dt>POSTGRESQL</dt>
            <dd>Relational database connection</dd>
            <dd
              className={`measure-value ${
                postgres.connected
                  ? "status-good"
                  : postgres.loading
                    ? "status-wait"
                    : "status-bad"
              }`}
              style={{ fontSize: 12 }}
            >
              {statusText(postgres)}
            </dd>
          </div>

          <div className="measure-row">
            <dt>MONGODB</dt>
            <dd>Discussion document database connection</dd>
            <dd
              className={`measure-value ${
                mongo.connected
                  ? "status-good"
                  : mongo.loading
                    ? "status-wait"
                    : "status-bad"
              }`}
              style={{ fontSize: 12 }}
            >
              {statusText(mongo)}
            </dd>
          </div>
        </dl>

        {user && (
          <div style={{ maxWidth: 850, margin: "18px auto 0" }}>
            <div className="status-line">
              <span>POSTGRESQL / {postgres.details}</span>
              <span>
                {postgres.connected
                  ? "OK"
                  : postgres.loading
                    ? "WAIT"
                    : "CHECK"}
              </span>
            </div>

            <div className="status-line">
              <span>MONGODB / {mongo.details}</span>
              <span>
                {mongo.connected
                  ? "OK"
                  : mongo.loading
                    ? "WAIT"
                    : "CHECK"}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* CLOSING SECTION */}

      <section className="section close-section">
        <div className="close-inner">
          <div>
            <p className="eyebrow">MAKE THE NEXT REVIEW COUNT</p>

            <h2 className="serif">
              Give good research{" "}
              <em>room to be read.</em>
            </h2>

            <p>
              {user
                ? `Signed in as ${user.fullName} · ${user.role}`
                : "Create an account to enter the research workspace."}
            </p>
          </div>


        </div>

        <div className="footerline">
          <span>RESEARCHHUB / ACADEMIC RESEARCH PORTAL</span>
          <span>POSTGRESQL + MONGODB / 2026</span>
        </div>

        <div className="spread close-word" aria-hidden="true">
          {"RESEARCHHUB".split("").map((letter, index) => (
            <span key={`${letter}-${index}`}>{letter}</span>
          ))}
        </div>
      </section>
    </main>
  );
}