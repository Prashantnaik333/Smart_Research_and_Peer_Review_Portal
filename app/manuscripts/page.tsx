
"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Manuscript = {
  manuscript_id: number;
  title: string;
  abstract: string;
  keywords: string;
  status: string;
  submitted_at: string;
  student_name: string;
  department_name: string;
};

export default function ManuscriptsPage() {
  const [papers, setPapers] = useState<Manuscript[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadManuscripts() {
      try {
        const response = await fetch("/api/manuscripts", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load manuscripts"
          );
        }

        setPapers(data.manuscripts);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    loadManuscripts();
  }, []);

  const underReview = papers.filter(
    (paper) => paper.status === "UNDER_REVIEW"
  ).length;

  const otherStatuses = papers.length - underReview;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "UNDER_REVIEW":
        return "bg-amber-50 text-amber-800 border-amber-200";

      case "SUBMITTED":
        return "bg-blue-50 text-blue-800 border-blue-200";

      case "ACCEPTED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";

      case "REJECTED":
        return "bg-red-50 text-red-800 border-red-200";

      case "REVISION_REQUIRED":
        return "bg-orange-50 text-orange-800 border-orange-200";

      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
  <main className="min-h-screen bg-[#f5f6f8] text-slate-900">

    <Sidebar />

    <section className="px-5 py-8 md:px-10 md:py-10 lg:ml-64">
      <div className="mx-auto max-w-7xl">

        {/* Navigation */}
        <a
          href="/"
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 hover:underline"
        >
          ← Back to Dashboard
        </a>

        {/* Page Heading */}
        <header className="mb-8 mt-8">
          <p className="text-sm font-bold tracking-wide text-emerald-800">
            RESEARCH MANAGEMENT
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
            Research Manuscripts
          </h1>

          <p className="mt-3 text-base text-slate-700">
            View and monitor research papers submitted by students.
          </p>
        </header>

        {/* Loading */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-700">
            Loading research manuscripts...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Statistics */}
            <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-700">
                  Total manuscripts
                </p>

                <p className="mt-3 text-4xl font-bold tabular-nums text-slate-950">
                  {papers.length}
                </p>

                <p className="mt-2 text-xs font-medium text-slate-600">
                  All research submissions
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-700">
                  Under review
                </p>

                <p className="mt-3 text-4xl font-bold tabular-nums text-slate-950">
                  {underReview}
                </p>

                <p className="mt-2 text-xs font-medium text-slate-600">
                  Currently being evaluated
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-700">
                  Other statuses
                </p>

                <p className="mt-3 text-4xl font-bold tabular-nums text-slate-950">
                  {otherStatuses}
                </p>

                <p className="mt-2 text-xs font-medium text-slate-600">
                  Submitted, accepted or rejected
                </p>
              </div>

            </section>

            {/* Manuscript List */}
            <section className="space-y-5">

              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-slate-950">
                  All Submissions
                </h2>

                <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800">
                  {papers.length} records
                </span>
              </div>

              {papers.length === 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                  <p className="font-semibold text-slate-900">
                    No manuscripts found
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    New student submissions will appear here.
                  </p>
                </div>
              )}

              {papers.map((paper) => (
                <article
                  key={paper.manuscript_id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md md:p-7"
                >

                  {/* Title and Status */}
                  <div className="flex flex-wrap items-start justify-between gap-4">

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold tracking-wide text-emerald-800">
                        MANUSCRIPT #{paper.manuscript_id}
                      </p>

                      <h3 className="mt-2 text-xl font-bold leading-snug text-slate-950">
                        {paper.title}
                      </h3>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusStyle(
                        paper.status
                      )}`}
                    >
                      {paper.status.replaceAll("_", " ")}
                    </span>

                  </div>

                  {/* Abstract */}
                  <div className="mt-5">
                    <p className="text-sm leading-7 text-slate-700">
                      {paper.abstract}
                    </p>
                  </div>

                  {/* Keywords */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {paper.keywords
                      .split(",")
                      .map((keyword) => keyword.trim())
                      .filter(Boolean)
                      .map((keyword) => (
                        <span
                          key={keyword}
                          className="rounded-md border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-800"
                        >
                          {keyword}
                        </span>
                      ))}
                  </div>

                  {/* Student Information */}
                  <div className="mt-6 grid grid-cols-1 gap-5 border-t border-slate-200 pt-5 sm:grid-cols-3">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Student
                      </p>

                      <p className="mt-2 break-words text-sm font-bold text-slate-950">
                        {paper.student_name || "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Department
                      </p>

                      <p className="mt-2 break-words text-sm font-bold text-slate-950">
                        {paper.department_name || "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Submitted
                      </p>

                      <p className="mt-2 text-sm font-bold text-slate-950">
                        {new Date(
                          paper.submitted_at
                        ).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                  </div>

                </article>
              ))}

            </section>

          </>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs font-medium text-slate-600">
          Smart Research & Peer Review Portal · 2026
        </footer>
      </div>
    </section>
  </main>
  );
}
