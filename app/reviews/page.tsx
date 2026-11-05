"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Assignment = {
  assignment_id: number;
  manuscript_id: number;
  manuscript_title: string;
  reviewer_id: number;
  reviewer_name: string;
  reviewer_email: string;
  due_date: string;
  status: string;
};

type Review = {
  review_id: number;
  assignment_id: number;
  manuscript_id: number;
  manuscript_title: string;
  reviewer_name: string;
  review_comments: string;
  technical_score: number;
  originality_score: number;
  recommendation: string;
  reviewed_at: string;
};

export default function ReviewsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  const [assignmentId, setAssignmentId] = useState("");
  const [technicalScore, setTechnicalScore] = useState("8");
  const [originalityScore, setOriginalityScore] = useState("8");
  const [comments, setComments] = useState("");
  const [recommendation, setRecommendation] = useState("ACCEPT");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [assignmentResponse, reviewResponse] =
        await Promise.all([
          fetch("/api/assignments", { cache: "no-store" }),
          fetch("/api/reviews", { cache: "no-store" }),
        ]);

      const [assignmentData, reviewData] = await Promise.all([
        assignmentResponse.json(),
        reviewResponse.json(),
      ]);

      if (!assignmentResponse.ok || !assignmentData.success) {
        throw new Error(
          assignmentData.message || "Unable to load assignments"
        );
      }

      if (!reviewResponse.ok || !reviewData.success) {
        throw new Error(
          reviewData.message || "Unable to load reviews"
        );
      }

      setAssignments(assignmentData.assignments || []);
      setReviews(reviewData.reviews || []);

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

  const pendingAssignments = assignments.filter(
    (assignment) =>
      assignment.status !== "COMPLETED" &&
      assignment.status !== "CANCELLED"
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setSuccess(false);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id: Number(assignmentId),
          technical_score: Number(technicalScore),
          originality_score: Number(originalityScore),
          review_comments: comments,
          recommendation,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to submit review"
        );
      }

      setSuccess(true);
      setMessage("Review submitted successfully!");

      setAssignmentId("");
      setTechnicalScore("8");
      setOriginalityScore("8");
      setComments("");
      setRecommendation("ACCEPT");

      await loadData();

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

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

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

          <header className="mb-8 mt-8 flex flex-wrap items-center justify-between gap-4">

            <div>
              <p className="text-sm font-bold tracking-wide text-emerald-800">
                ACADEMIC PEER REVIEW
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-950 md:text-4xl">
                Peer Review Management
              </h1>

              <p className="mt-3 text-sm text-slate-700">
                Evaluate research manuscripts and submit professional feedback.
              </p>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-50"
            >
              ↻ Refresh Data
            </button>

          </header>

          {/* Statistics */}
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">

            <StatCard
              title="Total Assignments"
              value={assignments.length}
              description="Research papers assigned"
            />

            <StatCard
              title="Pending Reviews"
              value={pendingAssignments.length}
              description="Awaiting evaluation"
            />

            <StatCard
              title="Submitted Reviews"
              value={reviews.length}
              description="Completed evaluations"
            />

          </section>

          {/* Errors */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
              {error}
            </div>
          )}

          {/* Review Submission */}
          <section className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">

            <div className="mb-7">
              <p className="text-xs font-bold tracking-wide text-emerald-700">
                REVIEW WORKSPACE
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Submit Research Review
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Complete the evaluation for an assigned manuscript.
              </p>
            </div>

            {loading ? (
              <p className="py-8 text-center text-slate-600">
                Loading review information...
              </p>
            ) : pendingAssignments.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-8 text-center">
                <h3 className="font-semibold text-slate-900">
                  No pending assignments
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  New assignments will appear here when they are created.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Assignment selection */}
                <div>
                  <label
                    htmlFor="assignment"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Assigned Research Paper *
                  </label>

                  <select
                    id="assignment"
                    required
                    value={assignmentId}
                    onChange={(e) => setAssignmentId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  >
                    <option value="">Select an assigned manuscript</option>

                    {pendingAssignments.map((assignment) => (
                      <option
                        key={assignment.assignment_id}
                        value={assignment.assignment_id}
                      >
                        #{assignment.assignment_id} - {assignment.manuscript_title}
                        {" | "}
                        {assignment.reviewer_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Score inputs */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

                  <div>
                    <label
                      htmlFor="technical"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Technical Score (0–10) *
                    </label>

                    <input
                      id="technical"
                      type="number"
                      required
                      min="0"
                      max="10"
                      step="0.5"
                      value={technicalScore}
                      onChange={(e) => setTechnicalScore(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-600"
                    />

                    <p className="mt-2 text-xs text-slate-600">
                      Evaluate research methodology, implementation and results.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="originality"
                      className="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Originality Score (0–10) *
                    </label>

                    <input
                      id="originality"
                      type="number"
                      required
                      min="0"
                      max="10"
                      step="0.5"
                      value={originalityScore}
                      onChange={(e) => setOriginalityScore(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-600"
                    />

                    <p className="mt-2 text-xs text-slate-600">
                      Evaluate research novelty and contribution.
                    </p>
                  </div>

                </div>

                {/* Comments */}
                <div>
                  <label
                    htmlFor="comments"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Detailed Review Comments *
                  </label>

                  <textarea
                    id="comments"
                    required
                    minLength={5}
                    maxLength={10000}
                    rows={6}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Describe the strengths, weaknesses, methodology, results and improvements required..."
                    className="w-full resize-y rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-emerald-600"
                  />

                  <p className="mt-2 text-xs text-slate-600">
                    {comments.length}/10000 characters
                  </p>
                </div>

                {/* Recommendation */}
                <div>
                  <label
                    htmlFor="recommendation"
                    className="mb-2 block text-sm font-semibold text-slate-800"
                  >
                    Final Recommendation *
                  </label>

                  <select
                    id="recommendation"
                    required
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-600"
                  >
                    <option value="ACCEPT">
                      ACCEPT
                    </option>

                    <option value="REJECT">
                      REJECT
                    </option>

                    <option value="REVISION_REQUIRED">
                      REVISION REQUIRED
                    </option>
                  </select>

                  <p className="mt-2 text-xs text-slate-600">
                    Select your final evaluation recommendation.
                  </p>
                </div>

                {/* Feedback */}
                {message && (
                  <div
                    role="alert"
                    className={`rounded-lg p-4 text-sm font-semibold ${
                      success
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-red-50 text-red-800"
                    }`}
                  >
                    {message}
                  </div>
                )}

                {/* Submit */}
                <div className="flex justify-end border-t border-slate-200 pt-5">

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-emerald-700 px-7 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {saving ? "Submitting..." : "Submit Peer Review"}
                  </button>

                </div>

              </form>
            )}

          </section>

          {/* Review History */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-950">
                Submitted Review History
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Previously submitted research evaluations.
              </p>
            </div>

            {loading ? (
              <p className="text-sm text-slate-600">
                Loading review history...
              </p>
            ) : reviews.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-8 text-center text-sm text-slate-600">
                No reviews submitted yet.
              </div>
            ) : (
              <div className="space-y-4">

                {reviews.map((review) => (
                  <article
                    key={review.review_id}
                    className="rounded-lg border border-slate-200 p-5"
                  >

                    <div className="flex flex-wrap items-start justify-between gap-3">

                      <div>
                        <p className="text-xs font-bold text-emerald-700">
                          REVIEW #{review.review_id}
                        </p>

                        <h3 className="mt-2 font-bold text-slate-950">
                          {review.manuscript_title}
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                          Reviewer: {review.reviewer_name}
                        </p>
                      </div>

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                        {review.recommendation.replaceAll("_", " ")}
                      </span>

                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">

                      <ScoreBox
                        label="Technical Score"
                        value={review.technical_score}
                      />

                      <ScoreBox
                        label="Originality Score"
                        value={review.originality_score}
                      />

                      <ScoreBox
                        label="Average Score"
                        value={(
                          (Number(review.technical_score) +
                            Number(review.originality_score)) / 2
                        ).toFixed(2)}
                      />

                    </div>

                    <div className="mt-5">
                      <p className="text-xs font-bold uppercase text-slate-600">
                        Reviewer Comments
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                        {review.review_comments}
                      </p>
                    </div>

                    <p className="mt-4 text-xs text-slate-500">
                      Submitted: {formatDate(review.reviewed_at)}
                    </p>

                  </article>
                ))}

              </div>
            )}

          </section>

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

function ScoreBox({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-4">
      <p className="text-xs font-medium text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-950">
        {value}/10
      </p>
    </div>
  );
}