
"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Reviewer = {
  reviewer_id: number;
  user_id: number;
  reviewer_name: string;
  email: string;
  expertise: string;
  qualification: string | null;
  experience_years: number;
  availability: boolean;
  total_assignments: number;
};

type ReviewerForm = {
  full_name: string;
  email: string;
  password: string;
  expertise: string;
  qualification: string;
  experience_years: string;
};

const emptyForm: ReviewerForm = {
  full_name: "",
  email: "",
  password: "",
  expertise: "",
  qualification: "",
  experience_years: "0",
};

export default function ReviewersPage() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ReviewerForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  async function loadReviewers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/reviewers", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load reviewers");
      }

      setReviewers(data.reviewers);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviewers();
  }, []);

  function updateField(
    field: keyof ReviewerForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleAddReviewer(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setFormMessage("");
    setFormSuccess(false);

    try {
      const response = await fetch("/api/reviewers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          experience_years: Number(form.experience_years),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to register reviewer");
      }

      setFormSuccess(true);
      setFormMessage("Reviewer registered successfully!");

      setForm(emptyForm);

      await loadReviewers();

      setShowForm(false);
      setFormMessage("");
    } catch (err) {
      setFormSuccess(false);
      setFormMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredReviewers = reviewers.filter((reviewer) => {
    const query = search.toLowerCase();

    return (
      reviewer.reviewer_name.toLowerCase().includes(query) ||
      reviewer.email.toLowerCase().includes(query) ||
      reviewer.expertise.toLowerCase().includes(query)
    );
  });

  const availableCount = reviewers.filter(
    (reviewer) => reviewer.availability
  ).length;

  const totalAssignments = reviewers.reduce(
    (total, reviewer) => total + reviewer.total_assignments,
    0
  );

  return (
  <main className="min-h-screen bg-[#f5f6f8] text-slate-900">

    <Sidebar />

    <section className="px-5 py-8 md:px-10 md:py-10 lg:ml-64">
      <div className="mx-auto max-w-7xl">

        {/* Navigation */}
        <a
          href="/"
          className="text-sm font-semibold text-emerald-700 hover:underline"
        >
          ← Back to Dashboard
        </a>

        {/* Header */}
        <header className="mb-8 mt-8">
          <p className="text-sm font-bold tracking-wide text-emerald-800">
            RESEARCH MANAGEMENT
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
                Reviewer Management
              </h1>

              <p className="mt-3 text-sm text-slate-700">
                Manage reviewer expertise, qualifications and availability.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">

              <button
                onClick={() => {
                  setForm(emptyForm);
                  setFormMessage("");
                  setShowForm(true);
                }}
                className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800"
              >
                + Add New Reviewer
              </button>

              <button
                onClick={loadReviewers}
                disabled={loading}
                className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
              >
                ↻ Refresh Data
              </button>

            </div>
          </div>
        </header>

        {/* Statistics */}
        <section className="mb-7 grid grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-700">
              Total Reviewers
            </p>

            <p className="mt-3 text-4xl font-bold text-slate-950">
              {reviewers.length}
            </p>

            <p className="mt-2 text-xs text-slate-600">
              Registered reviewers
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-700">
              Available Reviewers
            </p>

            <p className="mt-3 text-4xl font-bold text-emerald-700">
              {availableCount}
            </p>

            <p className="mt-2 text-xs text-slate-600">
              Currently available
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-700">
              Total Assignments
            </p>

            <p className="mt-3 text-4xl font-bold text-slate-950">
              {totalAssignments}
            </p>

            <p className="mt-2 text-xs text-slate-600">
              Assigned research papers
            </p>
          </div>

        </section>

        {/* Search */}
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          <label
            htmlFor="reviewer-search"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Search Reviewers
          </label>

          <input
            id="reviewer-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email or expertise..."
            className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />

        </section>

        {/* Loading and errors */}
        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-700">
            Loading reviewer information...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm font-medium text-red-800">
            {error}
          </div>
        )}

        {/* Reviewer Cards */}
        {!loading && !error && (
          <section>

            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-950">
                Registered Reviewers
              </h2>

              <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-800">
                {filteredReviewers.length} reviewers
              </span>
            </div>

            {filteredReviewers.length === 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                <h3 className="font-semibold text-slate-900">
                  No reviewers found
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Try another search or register a reviewer.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

              {filteredReviewers.map((reviewer) => (
                <article
                  key={reviewer.reviewer_id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
                >

                  <div className="flex items-start justify-between gap-3">

                    <div className="flex min-w-0 items-center gap-4">

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-800">
                        {reviewer.reviewer_name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <h3 className="break-words text-lg font-bold text-slate-950">
                          {reviewer.reviewer_name}
                        </h3>

                        <p className="break-all text-sm text-slate-600">
                          {reviewer.email}
                        </p>
                      </div>

                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold ${
                        reviewer.availability
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-red-200 bg-red-50 text-red-800"
                      }`}
                    >
                      {reviewer.availability ? "AVAILABLE" : "UNAVAILABLE"}
                    </span>

                  </div>

                  <div className="mt-6">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Area of Expertise
                    </p>

                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {reviewer.expertise}
                    </p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-4">

                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-600">
                        Qualification
                      </p>

                      <p className="mt-2 text-sm font-bold text-slate-950">
                        {reviewer.qualification || "Not specified"}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-medium text-slate-600">
                        Experience
                      </p>

                      <p className="mt-2 text-sm font-bold text-slate-950">
                        {reviewer.experience_years} years
                      </p>
                    </div>

                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">

                    <span className="text-sm font-medium text-slate-700">
                      Total Assignments
                    </span>

                    <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-900">
                      {reviewer.total_assignments}
                    </span>

                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Reviewer ID: {reviewer.reviewer_id}
                  </p>

                </article>
              ))}

            </div>
          </section>
        )}

        {/* Add Reviewer Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">

            <div className="my-auto w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl md:p-8">

              <div className="mb-6 flex items-start justify-between">

                <div>
                  <p className="text-xs font-bold tracking-wide text-emerald-700">
                    REVIEWER REGISTRATION
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    Add New Reviewer
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    Enter the reviewer account and professional details.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-3 py-2 text-xl font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                  aria-label="Close form"
                >
                  ×
                </button>

              </div>

              <form onSubmit={handleAddReviewer} className="space-y-5">

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Full Name *
                    </label>

                    <input
                      required
                      maxLength={100}
                      value={form.full_name}
                      onChange={(e) =>
                        updateField("full_name", e.target.value)
                      }
                      placeholder="Dr. Arjun Kumar"
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Email Address *
                    </label>

                    <input
                      required
                      type="email"
                      maxLength={150}
                      value={form.email}
                      onChange={(e) =>
                        updateField("email", e.target.value)
                      }
                      placeholder="reviewer@example.com"
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Initial Password *
                    </label>

                    <input
                      required
                      type="password"
                      minLength={8}
                      value={form.password}
                      onChange={(e) =>
                        updateField("password", e.target.value)
                      }
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      The password will be hashed before database storage.
                    </p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Area of Expertise *
                    </label>

                    <input
                      required
                      maxLength={200}
                      value={form.expertise}
                      onChange={(e) =>
                        updateField("expertise", e.target.value)
                      }
                      placeholder="Artificial Intelligence"
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Qualification
                    </label>

                    <input
                      maxLength={150}
                      value={form.qualification}
                      onChange={(e) =>
                        updateField("qualification", e.target.value)
                      }
                      placeholder="PhD, M.Tech, etc."
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-800">
                      Experience (Years) *
                    </label>

                    <input
                      required
                      type="number"
                      min={0}
                      max={80}
                      step={1}
                      value={form.experience_years}
                      onChange={(e) =>
                        updateField("experience_years", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                </div>

                {formMessage && (
                  <div
                    role="alert"
                    className={`rounded-lg p-3 text-sm font-medium ${
                      formSuccess
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {formMessage}
                  </div>
                )}

                <div className="flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    disabled={saving}
                    className="rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {saving ? "Registering..." : "Register Reviewer"}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-600">
          Smart Research & Peer Review Portal · 2026
        </footer>

            </div>
    </section>
  </main>
  );
}
