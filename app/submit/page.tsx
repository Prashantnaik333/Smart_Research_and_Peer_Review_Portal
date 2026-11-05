
"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Student = {
  userId: number;
  fullName: string;
  email: string;
  role: string;
};

export default function SubmitManuscriptPage() {
  const router = useRouter();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [keywords, setKeywords] = useState("");

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // LOAD LOGGED-IN STUDENT
  useEffect(() => {
    async function loadStudent() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.user) {
          router.replace("/login");
          return;
        }

        if (data.user.role !== "STUDENT") {
          setMessage("Only student accounts can submit manuscripts.");
          return;
        }

        setStudent(data.user);
      } catch {
        setMessage("Unable to verify your account. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadStudent();
  }, [router]);

  // SUBMIT MANUSCRIPT
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!student) {
      setMessage("Student account not found. Please log in again.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/manuscripts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          abstract: abstract.trim(),
          keywords: keywords.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Submission failed.");
      }

      setSuccess(true);

      setMessage(
        `Manuscript #${data.manuscript.manuscript_id} submitted successfully!`
      );

      setTitle("");
      setAbstract("");
      setKeywords("");
    } catch (error) {
      setSuccess(false);

      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f6f8] px-5 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">

        {/* NAVIGATION */}
        <Link
          href="/"
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        {/* PAGE HEADING */}
        <div className="mb-8 mt-8">
          <p className="text-sm font-bold tracking-wide text-emerald-700">
            STUDENT WORKSPACE
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Submit Research Manuscript
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Submit your academic research paper for peer review.
            Complete all the required fields below.
          </p>
        </div>

        {/* SUBMISSION FORM */}
        <form
          onSubmit={handleSubmit}
          className="space-y-7 rounded-2xl border border-slate-200 bg-white p-6 text-slate-900 shadow-sm md:p-8"
        >

          {/* LOGGED-IN STUDENT DETAILS */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">
              Submitting Student
            </label>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              {loading ? (
                <p className="text-sm text-slate-500">
                  Loading student account...
                </p>
              ) : student ? (
                <>
                  <p className="text-sm font-semibold text-slate-900">
                    {student.fullName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {student.email}
                  </p>

                  <p className="mt-2 text-xs font-medium text-emerald-700">
                    {student.role}
                  </p>
                </>
              ) : (
                <p className="text-sm text-red-600">
                  Student account could not be verified.
                </p>
              )}
            </div>

            <p className="mt-2 text-xs text-slate-500">
              Your manuscript will automatically be linked to your account.
            </p>
          </div>

          {/* RESEARCH TITLE */}
          <div>
            <label
              htmlFor="title"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Research Paper Title <span className="text-red-600">*</span>
            </label>

            <input
              id="title"
              type="text"
              required
              maxLength={250}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your research title"
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />

            <p className="mt-2 text-right text-xs text-slate-500">
              {title.length}/250 characters
            </p>
          </div>

          {/* ABSTRACT */}
          <div>
            <label
              htmlFor="abstract"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Abstract <span className="text-red-600">*</span>
            </label>

            <textarea
              id="abstract"
              required
              rows={6}
              maxLength={10000}
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Describe your research problem, methodology, objectives and expected outcomes..."
              className="w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              Explain what your research investigates and how it is conducted.
            </p>
          </div>

          {/* KEYWORDS */}
          <div>
            <label
              htmlFor="keywords"
              className="mb-2 block text-sm font-semibold text-slate-800"
            >
              Research Keywords <span className="text-red-600">*</span>
            </label>

            <input
              id="keywords"
              type="text"
              required
              maxLength={1000}
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Example: AI, Machine Learning, Agriculture"
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            />

            <p className="mt-2 text-xs text-slate-500">
              Separate multiple keywords using commas.
            </p>
          </div>

          {/* SUCCESS AND ERROR MESSAGES */}
          {message && (
            <div
              role="status"
              className={`rounded-lg border p-4 text-sm font-medium ${
                success
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {success ? "✓ " : "⚠ "}
              {message}
            </div>
          )}

          {/* FORM ACTIONS */}
          <div className="flex flex-col-reverse items-center justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row">

            <Link
              href="/manuscripts"
              className="text-sm font-semibold text-slate-600 hover:text-emerald-700"
            >
              View manuscripts →
            </Link>

            <button
              type="submit"
              disabled={
                submitting ||
                loading ||
                !student ||
                !title.trim() ||
                !abstract.trim() ||
                !keywords.trim()
              }
              className="w-full rounded-lg bg-emerald-700 px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {submitting
                ? "Submitting..."
                : "Submit Research Paper"}
            </button>

          </div>
        </form>

        {/* FOOTER */}
        <footer className="mt-8 text-center text-xs text-slate-500">
          Smart Research & Peer Review Portal · 2026
        </footer>

      </div>
    </main>
  );
}
