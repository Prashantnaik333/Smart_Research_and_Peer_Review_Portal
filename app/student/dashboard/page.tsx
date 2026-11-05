
"use client";

import { useEffect, useState } from "react";

interface Review {
  review_id: number;
  assignment_id: number;
  manuscript_id: number;
  manuscript_title: string;
  reviewer_name: string;
  technical_score: number | string | null;
  originality_score: number | string | null;
  average_score: number | string | null;
  review_comments: string;
  recommendation: string | null;
  reviewed_at: string;
}

export default function StudentReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadReviews() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/student/dashboard", {
        method: "GET",
        credentials: "include",
        cache: "no-store"
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load reviews.");
      }

      setReviews(result.reviews || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading reviews."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReviews();
  }, []);

  function formatDate(date: string) {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    });
  }

  function getRecommendationStyle(recommendation: string | null) {
    const value = recommendation?.toUpperCase() || "";

    if (value.includes("ACCEPT")) {
      return "bg-green-100 text-green-800";
    }

    if (value.includes("REJECT")) {
      return "bg-red-100 text-red-800";
    }

    if (value.includes("REVISION")) {
      return "bg-yellow-100 text-yellow-800";
    }

    return "bg-gray-100 text-gray-700";
  }

  function ScoreCard({
    title,
    score,
    color
  }: {
    title: string;
    score: number | string | null;
    color: string;
  }) {
    return (
      <div className={`rounded-xl p-5 ${color}`}>
        <p className="text-sm font-medium opacity-80">{title}</p>

        <p className="mt-3 text-3xl font-bold">
          {score !== null && score !== undefined
            ? score
            : "N/A"}
          <span className="ml-1 text-sm font-normal">/ 100</span>
        </p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#080b13] px-4 py-8 text-white sm:px-8 lg:px-16">

      {/* HEADER */}

      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">

        <div>
          <h1 className="text-2xl font-bold tracking-wide">
            ResearchHub.
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Student Review Portal
          </p>
        </div>

        <button
          onClick={loadReviews}
          disabled={loading}
          className="rounded-full border border-blue-400/60 px-5 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh Reviews"}
        </button>

      </header>

      {/* PAGE TITLE */}

      <section className="mx-auto mt-10 max-w-6xl">

        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-400">
          Academic Evaluation
        </p>

        <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
          My Scores & Feedback
        </h2>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-400">
          View all evaluations submitted by reviewers for your research
          manuscripts, including scores, comments and recommendations.
        </p>

      </section>

      {/* SUMMARY */}

      {!loading && !error && (
        <section className="mx-auto mt-8 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-gray-400">
              Total Reviews Received
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-300">
              {reviews.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-gray-400">
              Manuscripts Reviewed
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-300">
              {new Set(reviews.map((r) => r.manuscript_id)).size}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm text-gray-400">
              Average Evaluation Score
            </p>

            <p className="mt-2 text-3xl font-bold text-green-300">
              {reviews.length > 0
                ? (
                    reviews.reduce(
                      (sum, review) =>
                        sum +
                        (review.average_score !== null
                          ? Number(review.average_score)
                          : 0),
                      0
                    ) /
                    reviews.filter(
                      (review) => review.average_score !== null
                    ).length || 1
                  ).toFixed(2)
                : "N/A"}
              {reviews.some((r) => r.average_score !== null) ? "%" : ""}
            </p>
          </div>

        </section>
      )}

      {/* REVIEW CONTENT */}

      <section className="mx-auto mt-10 max-w-6xl">

        {loading && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">
            <p className="text-gray-300">
              Loading your reviews...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">

            <h3 className="font-bold text-red-300">
              Unable to load reviews
            </h3>

            <p className="mt-2 text-sm text-red-200">
              {error}
            </p>

            <button
              onClick={loadReviews}
              className="mt-4 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold hover:bg-red-700"
            >
              Try Again
            </button>

          </div>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-12 text-center">

            <div className="text-5xl">📄</div>

            <h3 className="mt-5 text-xl font-bold">
              No Reviews Available Yet
            </h3>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-400">
              Your submitted manuscripts have not received reviewer
              evaluations yet. Once a reviewer submits their scores
              and feedback, they will appear here.
            </p>

          </div>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="space-y-7">

            {reviews.map((review) => (
              <article
                key={review.review_id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#111827] shadow-xl"
              >

                {/* REVIEW HEADER */}

                <div className="border-b border-white/10 p-6">

                  <div className="flex flex-col justify-between gap-4 sm:flex-row">

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-blue-400">
                        Manuscript #{review.manuscript_id}
                      </p>

                      <h3 className="mt-2 text-xl font-bold sm:text-2xl">
                        {review.manuscript_title}
                      </h3>

                      <p className="mt-3 text-sm text-gray-400">
                        Reviewed by:{" "}
                        <span className="font-semibold text-gray-200">
                          {review.reviewer_name}
                        </span>
                      </p>
                    </div>

                    <div className="text-sm text-gray-400">
                      <p>Review #{review.review_id}</p>
                      <p className="mt-2">
                        {formatDate(review.reviewed_at)}
                      </p>
                    </div>

                  </div>

                </div>

                {/* SCORES */}

                <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">

                  <ScoreCard
                    title="Technical Score"
                    score={review.technical_score}
                    color="bg-blue-500/10 text-blue-200"
                  />

                  <ScoreCard
                    title="Originality Score"
                    score={review.originality_score}
                    color="bg-purple-500/10 text-purple-200"
                  />

                  <ScoreCard
                    title="Average Score"
                    score={review.average_score}
                    color="bg-green-500/10 text-green-200"
                  />

                </div>

                {/* FEEDBACK */}

                <div className="px-6 pb-6">

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">

                    <h4 className="font-bold text-white">
                      Reviewer Feedback
                    </h4>

                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-gray-300">
                      {review.review_comments || "No comments provided."}
                    </p>

                  </div>

                  {/* RECOMMENDATION */}

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">

                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-500">
                        Final Recommendation
                      </p>

                      <span
                        className={`mt-2 inline-block rounded-full px-4 py-2 text-sm font-bold ${getRecommendationStyle(review.recommendation)}`}
                      >
                        {review.recommendation || "Not provided"}
                      </span>
                    </div>

                    <div className="text-right text-xs text-gray-500">
                      <p>Assignment ID</p>
                      <p className="mt-1 font-semibold text-gray-300">
                        #{review.assignment_id}
                      </p>
                    </div>

                  </div>

                </div>

              </article>
            ))}

          </div>
        )}

      </section>

      {/* FOOTER */}

      <footer className="mx-auto mt-16 max-w-6xl border-t border-white/10 py-6 text-center text-xs text-gray-500">
        Smart Research & Peer Review Portal
        <br />
        Your research. Your reviews. Your progress.
      </footer>

    </main>
  );
}
