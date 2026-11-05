"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Manuscript = {
  manuscript_id: number;
  title: string;
  status: string;
  student_name: string;
};

type Reviewer = {
  reviewer_id: number;
  reviewer_name: string;
  email: string;
  expertise: string;
  availability: boolean;
};

type Assignment = {
  assignment_id: number;
  manuscript_id: number;
  manuscript_title: string;
  reviewer_id: number;
  reviewer_name: string;
  reviewer_email: string;
  assigned_at: string;
  due_date: string;
  status: string;
};

export default function AssignmentsPage() {
  const [manuscripts, setManuscripts] = useState<Manuscript[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [manuscriptId, setManuscriptId] = useState("");
  const [reviewerId, setReviewerId] = useState("");
  const [dueDate, setDueDate] = useState("");

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [assignmentResponse, manuscriptResponse, reviewerResponse] =
        await Promise.all([
          fetch("/api/assignments", { cache: "no-store" }),
          fetch("/api/manuscripts", { cache: "no-store" }),
          fetch("/api/reviewers", { cache: "no-store" }),
        ]);

      const [assignmentData, manuscriptData, reviewerData] =
        await Promise.all([
          assignmentResponse.json(),
          manuscriptResponse.json(),
          reviewerResponse.json(),
        ]);

      if (!assignmentResponse.ok || !assignmentData.success) {
        throw new Error(
          assignmentData.message || "Unable to load assignments"
        );
      }

      if (!manuscriptResponse.ok || !manuscriptData.success) {
        throw new Error(
          manuscriptData.message || "Unable to load manuscripts"
        );
      }

      if (!reviewerResponse.ok || !reviewerData.success) {
        throw new Error(
          reviewerData.message || "Unable to load reviewers"
        );
      }

      setAssignments(assignmentData.assignments || []);
      setManuscripts(manuscriptData.manuscripts || []);
      setReviewers(reviewerData.reviewers || []);

    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load data"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleAssignment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          manuscript_id: Number(manuscriptId),
          reviewer_id: Number(reviewerId),
          due_date: dueDate,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Assignment failed"
        );
      }

      setSuccess(true);
      setMessage("Reviewer assigned successfully!");

      setManuscriptId("");
      setReviewerId("");
      setDueDate("");

      await loadData();

      setShowForm(false);
      setMessage("");

    } catch (err) {
      setSuccess(false);
      setMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  const availableReviewers = reviewers.filter(
    (reviewer) => reviewer.availability
  );

  const assignedCount = assignments.length;

  const pendingCount = assignments.filter(
    (assignment) => assignment.status === "ASSIGNED"
  ).length;

  const completedCount = assignments.filter(
    (assignment) => assignment.status === "COMPLETED"
  ).length;

  const formatDate = (date: string) => {
    if (!date) return "Not specified";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-900">
      <Sidebar />

      <section className="px-5 py-8 md:px-10 md:py-10 lg:ml-64">
        <div className="mx-auto max-w-7xl">

          {/* Header */}
          <a
            href="/"
            className="text-sm font-semibold text-emerald-700 hover:underline"
          >
            ← Back to Dashboard
          </a>

          <header className="mb-8 mt-8 flex flex-wrap items-center justify-between gap-5">
            <div>
              <p className="text-sm font-bold tracking-wide text-emerald-800">
                RESEARCH MANAGEMENT
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
                Assignment Management
              </h1>

              <p className="mt-3 text-sm text-slate-700">
                Assign research manuscripts to qualified reviewers.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={loadData}
                disabled={loading}
                className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
              >
                ↻ Refresh
              </button>

              <button
                onClick={() => {
                  setMessage("");
                  setShowForm(true);
                }}
                disabled={
                  availableReviewers.length === 0 ||
                  manuscripts.length === 0
                }
                className="rounded-lg bg-emerald-700 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                + New Assignment
              </button>
            </div>
          </header>

          {/* Statistics */}
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Assignments"
              value={assignments.length}
              description="All reviewer assignments"
            />

            <StatCard
              title="Pending Reviews"
              value={pendingCount}
              description="Awaiting review completion"
            />

            <StatCard
              title="Completed Reviews"
              value={completedCount}
              description="Reviews submitted"
            />

            <StatCard
              title="Available Reviewers"
              value={availableReviewers.length}
              description="Ready for assignments"
            />
          </section>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
              {error}
            </div>
          )}

          {/* Manuscripts */}
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-bold text-slate-950">
              Available Research Manuscripts
            </h2>

            {loading ? (
              <p className="text-sm text-slate-600">
                Loading manuscripts...
              </p>
            ) : manuscripts.length === 0 ? (
              <p className="text-sm text-slate-600">
                No manuscripts available.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                    <tr>
                      <th className="p-3">ID</th>
                      <th className="p-3">Manuscript</th>
                      <th className="p-3">Student</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {manuscripts.map((manuscript) => (
                      <tr
                        key={manuscript.manuscript_id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="p-3 font-semibold">
                          #{manuscript.manuscript_id}
                        </td>

                        <td className="p-3 font-semibold text-slate-900">
                          {manuscript.title}
                        </td>

                        <td className="p-3 text-slate-700">
                          {manuscript.student_name}
                        </td>

                        <td className="p-3">
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                            {manuscript.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Assignments */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  Reviewer Assignments
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  Track assigned research papers and their deadlines.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                {assignedCount} assignments
              </span>
            </div>

            {loading ? (
              <p className="py-8 text-center text-slate-600">
                Loading assignments...
              </p>
            ) : assignments.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-10 text-center">
                <h3 className="font-semibold text-slate-900">
                  No assignments yet
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Create your first reviewer assignment.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-slate-700">
                    <tr>
                      <th className="p-3">Assignment</th>
                      <th className="p-3">Manuscript</th>
                      <th className="p-3">Reviewer</th>
                      <th className="p-3">Assigned Date</th>
                      <th className="p-3">Deadline</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {assignments.map((assignment) => (
                      <tr
                        key={assignment.assignment_id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="p-3 font-semibold text-slate-900">
                          #{assignment.assignment_id}
                        </td>

                        <td className="max-w-xs p-3 font-medium text-slate-900">
                          {assignment.manuscript_title}
                        </td>

                        <td className="p-3">
                          <p className="font-semibold text-slate-900">
                            {assignment.reviewer_name}
                          </p>

                          <p className="text-xs text-slate-600">
                            {assignment.reviewer_email}
                          </p>
                        </td>

                        <td className="p-3 text-slate-700">
                          {formatDate(assignment.assigned_at)}
                        </td>

                        <td className="p-3 text-slate-700">
                          {formatDate(assignment.due_date)}
                        </td>

                        <td className="p-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              assignment.status === "COMPLETED"
                                ? "bg-emerald-50 text-emerald-800"
                                : assignment.status === "IN_PROGRESS"
                                  ? "bg-blue-50 text-blue-800"
                                  : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            {assignment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Assignment Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
              <div className="my-auto w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl md:p-8">
                <div className="mb-7 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold tracking-wide text-emerald-700">
                      REVIEW WORKFLOW
                    </p>

                    <h2 className="mt-2 text-2xl font-bold text-slate-950">
                      Create Assignment
                    </h2>

                    <p className="mt-2 text-sm text-slate-600">
                      Select a manuscript and an available reviewer.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="rounded-lg px-3 py-2 text-xl font-bold text-slate-500 hover:bg-slate-100"
                    aria-label="Close"
                  >
                    ×
                  </button>
                </div>

                <form
                  onSubmit={handleAssignment}
                  className="space-y-5"
                >
                  <div>
                    <label
                      htmlFor="manuscript"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Select Manuscript *
                    </label>

                    <select
                      id="manuscript"
                      required
                      value={manuscriptId}
                      onChange={(e) => setManuscriptId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-600"
                    >
                      <option value="">Choose a manuscript</option>

                      {manuscripts.map((manuscript) => (
                        <option
                          key={manuscript.manuscript_id}
                          value={manuscript.manuscript_id}
                        >
                          #{manuscript.manuscript_id} - {manuscript.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="reviewer"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Select Reviewer *
                    </label>

                    <select
                      id="reviewer"
                      required
                      value={reviewerId}
                      onChange={(e) => setReviewerId(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-600"
                    >
                      <option value="">Choose an available reviewer</option>

                      {availableReviewers.map((reviewer) => (
                        <option
                          key={reviewer.reviewer_id}
                          value={reviewer.reviewer_id}
                        >
                          {reviewer.reviewer_name} - {reviewer.expertise}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="deadline"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Review Deadline *
                    </label>

                    <input
                      id="deadline"
                      required
                      type="date"
                      value={dueDate}
                      min={new Date().toLocaleDateString("en-CA")}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-600"
                    />
                  </div>

                  {message && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                      {message}
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
                      {saving ? "Assigning..." : "Assign Reviewer"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <footer className="mt-10 border-t border-slate-200 py-6 text-center text-xs text-slate-600">
            Smart Research & Peer Review Portal · 2026
          </footer>

        </div>
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-700">
        {title}
      </p>

      <p className="mt-3 text-4xl font-bold text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-600">
        {description}
      </p>
    </div>
  );
}