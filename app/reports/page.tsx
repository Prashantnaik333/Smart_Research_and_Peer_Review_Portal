"use client";

import { useCallback, useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";

type AnalyticsData = {
  success: boolean;
  generatedAt: string;
  manuscripts: {
    total: number;
    submitted: number;
    under_review: number;
  };
  assignments: {
    total: number;
    assigned: number;
    in_progress: number;
    reviewed: number;
  };
  reviews: {
    total_reviews: number;
    average_technical_score: number | null;
    average_originality_score: number | null;
    accepted: number;
    revision_required: number;
  };
  reviewerWorkload: {
    reviewer_id: number;
    reviewer_name: string;
    total_assignments: number;
    completed_reviews: number;
  }[];
  departmentStats: {
    department_name: string;
    manuscript_count: number;
  }[];
  topicStats: {
    topic_name: string;
    manuscript_count: number;
  }[];
  recentActivities: {
    log_id: number;
    action: string;
    entity_type: string;
    description: string;
    created_at: string;
    user_name: string | null;
  }[];
  discussions: {
    total: number;
    open: number;
    resolved: number;
    totalReplies: number;
  };
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function StatCard({
  label,
  value,
  note,
  icon,
}: {
  label: string;
  value: string | number;
  note: string;
  icon: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-700">{label}</p>
        <span className="text-xl">{icon}</span>
      </div>

      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-2 text-xs font-medium text-slate-600">{note}</p>
    </div>
  );
}

function Bar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between gap-3 text-sm">
        <span className="truncate font-semibold text-slate-800">
          {label}
        </span>
        <span className="font-bold text-slate-950">{value}</span>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-emerald-600 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DiscussionStat({
  label,
  value,
  background,
  labelColor,
  valueColor,
}: {
  label: string;
  value: number;
  background: string;
  labelColor: string;
  valueColor: string;
}) {
  return (
    <div className={`rounded-xl p-5 ${background}`}>
      <p className={`text-sm font-semibold ${labelColor}`}>{label}</p>
      <p className={`mt-2 text-3xl font-extrabold ${valueColor}`}>
        {value}
      </p>
    </div>
  );
}

export default function ReportsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/analytics", {
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Unable to load reports.");
      }

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // LOADING STATE
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Sidebar />

        <section className="p-5 md:p-8 lg:ml-64">
          <div className="mx-auto max-w-7xl">
            <p className="font-medium text-slate-700">
              Loading ResearchHub analytics...
            </p>
          </div>
        </section>
      </main>
    );
  }

  // ERROR STATE
  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50">
        <Sidebar />

        <section className="p-5 md:p-8 lg:ml-64">
          <div className="mx-auto max-w-7xl rounded-xl border border-red-200 bg-white p-6">
            <h1 className="text-xl font-bold text-slate-950">
              Unable to load reports
            </h1>

            <p className="mt-2 text-sm font-medium text-red-700">
              {error}
            </p>

            <button
              onClick={loadAnalytics}
              className="mt-4 rounded-lg bg-emerald-700 px-5 py-2 font-semibold text-white hover:bg-emerald-800"
            >
              Try again
            </button>
          </div>
        </section>
      </main>
    );
  }

  const manuscriptMax = Math.max(
    data.manuscripts.submitted,
    data.manuscripts.under_review,
    1
  );

  const assignmentMax = Math.max(
    data.assignments.assigned,
    data.assignments.in_progress,
    data.assignments.reviewed,
    1
  );

  const departmentMax = Math.max(
    ...data.departmentStats.map((item) => item.manuscript_count),
    1
  );

  const reviewerMax = Math.max(
    ...data.reviewerWorkload.map((item) => item.total_assignments),
    1
  );

  const topicMax = Math.max(
    ...data.topicStats.map((item) => item.manuscript_count),
    1
  );

  const submittedPercentage =
    data.manuscripts.total > 0
      ? (data.manuscripts.submitted / data.manuscripts.total) * 100
      : 0;

  const reviewPercentage =
    data.manuscripts.total > 0
      ? (data.manuscripts.under_review / data.manuscripts.total) * 100
      : 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <Sidebar />

      <section className="p-5 md:p-8 lg:ml-64">
        <div className="mx-auto max-w-7xl space-y-7">

          {/* HEADER */}
          <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                ResearchHub / Reports
              </p>

              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-950">
                Reports & Analytics
              </h1>

              <p className="mt-2 text-sm font-medium text-slate-600">
                Research activity, peer-review performance and institutional insights.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={loadAnalytics}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-100"
              >
                ↻ Refresh
              </button>

              <button
                onClick={() => window.print()}
                className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800"
              >
                Print report
              </button>
            </div>
          </header>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-xs font-medium text-slate-700">
            <span>Live database report · PostgreSQL + MongoDB</span>
            <span>Generated: {formatDate(data.generatedAt)}</span>
          </div>

          {/* OVERVIEW */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-950">
                Institutional overview
              </h2>
              <p className="text-sm text-slate-600">
                Key figures from the research management system.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total manuscripts"
                value={data.manuscripts.total}
                note="Research papers registered"
                icon="📄"
              />

              <StatCard
                label="Total assignments"
                value={data.assignments.total}
                note="Reviewer assignments created"
                icon="📋"
              />

              <StatCard
                label="Peer reviews"
                value={data.reviews.total_reviews}
                note="Reviews submitted"
                icon="⭐"
              />

              <StatCard
                label="Review discussions"
                value={data.discussions.total}
                note={`${data.discussions.open} currently open`}
                icon="💬"
              />
            </div>
          </section>

          {/* MANUSCRIPT AND ASSIGNMENT STATUS */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-slate-950">
                Manuscript status
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Distribution of submitted research papers.
              </p>

              <div className="mt-7 flex flex-col gap-6 sm:flex-row sm:items-center">
                <div
                  className="mx-auto flex h-40 w-40 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#059669 0% ${submittedPercentage}%, #3b82f6 ${submittedPercentage}% ${submittedPercentage + reviewPercentage}%, #e2e8f0 ${submittedPercentage + reviewPercentage}% 100%)`,
                  }}
                >
                  <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-3xl font-extrabold text-slate-950">
                      {data.manuscripts.total}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Manuscripts
                    </span>
                  </div>
                </div>

                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <span className="h-3 w-3 rounded-sm bg-emerald-600" />
                      Submitted
                    </span>
                    <strong className="text-slate-950">
                      {data.manuscripts.submitted}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                      <span className="h-3 w-3 rounded-sm bg-blue-500" />
                      Under review
                    </span>
                    <strong className="text-slate-950">
                      {data.manuscripts.under_review}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-slate-950">
                Assignment progress
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Current reviewer assignment breakdown.
              </p>

              <div className="mt-7 space-y-6">
                <Bar
                  label="Assigned"
                  value={data.assignments.assigned}
                  max={assignmentMax}
                />

                <Bar
                  label="In progress"
                  value={data.assignments.in_progress}
                  max={assignmentMax}
                />

                <Bar
                  label="Assignments with a review"
                  value={data.assignments.reviewed}
                  max={assignmentMax}
                />
              </div>

              <div className="mt-7 border-t border-slate-200 pt-4">
                <p className="text-sm font-medium text-slate-600">
                  Total assignments
                </p>

                <p className="mt-1 text-2xl font-extrabold text-slate-950">
                  {data.assignments.total}
                </p>
              </div>
            </div>
          </section>

          {/* PEER REVIEW */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-slate-950">
                Peer-review performance
              </h2>

              <p className="text-sm text-slate-600">
                Review scores and editorial recommendations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Technical score"
                value={Number(data.reviews.average_technical_score ?? 0).toFixed(2)}
                note="Average technical score"
                icon="📊"
              />

              <StatCard
                label="Originality score"
                value={Number(data.reviews.average_originality_score ?? 0).toFixed(2)}
                note="Average originality score"
                icon="💡"
              />

              <StatCard
                label="Accepted"
                value={data.reviews.accepted}
                note="Recommendation: ACCEPT"
                icon="✓"
              />

              <StatCard
                label="Revision required"
                value={data.reviews.revision_required}
                note="Recommendation: REVISION_REQUIRED"
                icon="↻"
              />
            </div>
          </section>

          {/* REVIEWER WORKLOAD */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-slate-950">
              Reviewer workload
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Assignment distribution and completed reviews by reviewer.
            </p>

            {data.reviewerWorkload.length === 0 ? (
              <p className="mt-6 text-sm text-slate-600">
                No reviewer records available.
              </p>
            ) : (
              <div className="mt-6 space-y-6">
                {data.reviewerWorkload.map((reviewer) => (
                  <div key={reviewer.reviewer_id}>
                    <Bar
                      label={reviewer.reviewer_name}
                      value={reviewer.total_assignments}
                      max={reviewerMax}
                    />

                    <p className="mt-1 text-xs font-medium text-slate-600">
                      {reviewer.completed_reviews} completed review(s) ·{" "}
                      {reviewer.total_assignments} assignment(s)
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* DEPARTMENTS AND TOPICS */}
          <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-slate-950">
                Department-wise submissions
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Manuscripts associated with each department.
              </p>

              <div className="mt-7 space-y-5">
                {data.departmentStats.map((department) => (
                  <Bar
                    key={department.department_name}
                    label={department.department_name}
                    value={department.manuscript_count}
                    max={departmentMax}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-slate-950">
                Research topic distribution
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Manuscripts mapped to research topics.
              </p>

              <div className="mt-7 space-y-5">
                {data.topicStats.map((topic) => (
                  <Bar
                    key={topic.topic_name}
                    label={topic.topic_name}
                    value={topic.manuscript_count}
                    max={topicMax}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* DISCUSSION ANALYTICS */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <h2 className="font-bold text-slate-950">
                Discussion analytics
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-600">
                Conversation data stored in MongoDB.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <DiscussionStat
                label="Total discussions"
                value={data.discussions.total}
                background="bg-slate-100"
                labelColor="text-slate-800"
                valueColor="text-slate-950"
              />

              <DiscussionStat
                label="Open"
                value={data.discussions.open}
                background="bg-amber-50"
                labelColor="text-amber-900"
                valueColor="text-amber-950"
              />

              <DiscussionStat
                label="Resolved"
                value={data.discussions.resolved}
                background="bg-emerald-50"
                labelColor="text-emerald-900"
                valueColor="text-emerald-950"
              />

              <DiscussionStat
                label="Replies"
                value={data.discussions.totalReplies}
                background="bg-blue-50"
                labelColor="text-blue-900"
                valueColor="text-blue-950"
              />
            </div>
          </section>

          {/* RECENT ACTIVITIES */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-6">
              <h2 className="font-bold text-slate-950">
                Recent system activity
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Latest events recorded in the PostgreSQL audit log.
              </p>
            </div>

            {data.recentActivities.length === 0 ? (
              <p className="p-6 text-sm font-medium text-slate-600">
                No activity records available.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-left text-sm">
                  <thead className="bg-slate-100 text-xs font-bold uppercase text-slate-700">
                    <tr>
                      <th className="px-6 py-4">Activity</th>
                      <th className="px-6 py-4">Entity</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Date</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {data.recentActivities.map((activity) => (
                      <tr key={activity.log_id}>
                        <td className="max-w-sm px-6 py-4">
                          <p className="font-bold text-slate-900">
                            {activity.action}
                          </p>

                          <p className="mt-1 text-xs font-medium text-slate-600">
                            {activity.description}
                          </p>
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-700">
                          {activity.entity_type}
                        </td>

                        <td className="px-6 py-4 font-medium text-slate-700">
                          {activity.user_name || "System"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-600">
                          {formatDate(activity.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* FOOTER */}
          <footer className="border-t border-slate-200 py-5 text-center text-xs font-medium text-slate-600">
            ResearchHub · Research Management & Peer Review Analytics
            <br />
            Reports generated from PostgreSQL and MongoDB.
          </footer>

        </div>
      </section>

      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          button,
          aside {
            display: none !important;
          }

          main {
            padding: 0 !important;
          }

          main > section {
            margin-left: 0 !important;
            padding: 12px !important;
          }
        }
      `}</style>
    </main>
  );
}