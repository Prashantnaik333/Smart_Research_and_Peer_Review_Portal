
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/Sidebar";

type Role = "STUDENT" | "REVIEWER" | "ADMIN" | "COORDINATOR";

type LoggedInUser = {
  userId: number;
  fullName: string;
  email: string;
  role: Role;
};

type DiscussionReply = {
  author_name: string;
  author_role: "STUDENT" | "REVIEWER";
  message: string;
  created_at: string;
};

type Discussion = {
  _id: string;
  manuscript_id: number;
  assignment_id?: number;
  student_name: string;
  discussion: string;
  reviewer_name: string;
  discussion_type: "REVIEW_FEEDBACK" | "GENERAL_DISCUSSION";
  created_at: string;
  status: "OPEN" | "RESOLVED";
  replies?: DiscussionReply[];
};

type Assignment = {
  assignment_id: number;
  manuscript_id: number;
  manuscript_title: string;
  student_name: string;
  reviewer_id: number;
  reviewer_name: string;
  reviewer_email?: string;
  due_date?: string;
  status: string;
};

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [user, setUser] = useState<LoggedInUser | null>(null);

  const [filter, setFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState("");

  const [form, setForm] = useState({
    assignment_id: "",
    discussion: "",
    discussion_type: "REVIEW_FEEDBACK",
  });

  // LOAD AUTHENTICATED USER
  useEffect(() => {
    async function loadUser() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (!response.ok || !data.success || !data.user) {
          throw new Error("Unable to identify logged-in user.");
        }

        setUser(data.user);
      } catch (err) {
        setUser(null);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load user information."
        );
      } finally {
        setAuthLoading(false);
      }
    }

    loadUser();
  }, []);

  // LOAD DISCUSSIONS FROM MONGODB
  const loadDiscussions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/discussions", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load discussions");
      }

      setDiscussions(data.discussions || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load discussions"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // LOAD ASSIGNMENTS FROM POSTGRESQL
  const loadAssignments = useCallback(async () => {
    try {
      setAssignmentsLoading(true);

      const response = await fetch("/api/assignments", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load assignments");
      }

      const loadedAssignments: Assignment[] =
        data.assignments || [];

      setAssignments(loadedAssignments);

      setForm((previous) => {
        if (
          previous.assignment_id &&
          loadedAssignments.some(
            (item) =>
              String(item.assignment_id) === previous.assignment_id
          )
        ) {
          return previous;
        }

        return {
          ...previous,
          assignment_id: loadedAssignments.length
            ? String(loadedAssignments[0].assignment_id)
            : "",
        };
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load assignments"
      );
    } finally {
      setAssignmentsLoading(false);
    }
  }, []);

  // INITIAL DATA LOADING
  useEffect(() => {
    loadDiscussions();
    loadAssignments();
  }, [loadDiscussions, loadAssignments]);

  // SELECTED ASSIGNMENT
  const selectedAssignment = useMemo(
    () =>
      assignments.find(
        (item) =>
          String(item.assignment_id) === form.assignment_id
      ),
    [assignments, form.assignment_id]
  );

  // FILTER DISCUSSIONS
  const filteredDiscussions = useMemo(() => {
    if (filter === "ALL") return discussions;

    if (filter === "OPEN" || filter === "RESOLVED") {
      return discussions.filter(
        (item) => item.status === filter
      );
    }

    return discussions.filter(
      (item) => String(item.manuscript_id) === filter
    );
  }, [discussions, filter]);

  // STATISTICS
  const openCount = discussions.filter(
    (item) => item.status === "OPEN"
  ).length;

  const resolvedCount = discussions.filter(
    (item) => item.status === "RESOLVED"
  ).length;

  const manuscriptIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...assignments.map((item) => item.manuscript_id),
          ...discussions.map((item) => item.manuscript_id),
        ])
      ).sort((a, b) => a - b),
    [assignments, discussions]
  );

  // CREATE DISCUSSION
  async function addDiscussion(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.assignment_id) {
      setError("Please select an assignment.");
      return;
    }

    if (!form.discussion.trim()) {
      setError("Please enter a discussion message.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/discussions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id: Number(form.assignment_id),
          discussion: form.discussion.trim(),
          discussion_type: form.discussion_type,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to add discussion"
        );
      }

      setForm((previous) => ({
        ...previous,
        discussion: "",
      }));

      setSuccess("Discussion added successfully.");

      await loadDiscussions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add discussion"
      );
    } finally {
      setSaving(false);
    }
  }

  // ADD REPLY
  async function submitReply(item: Discussion) {
    if (!replyText.trim()) {
      setError("Please enter a reply.");
      return;
    }

    if (!user) {
      setError("Please log in before replying.");
      return;
    }

    try {
      setSendingReply(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/discussions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discussion_id: item._id,
          action: "ADD_REPLY",
          message: replyText.trim(),

          // Do not send author_name or author_role.
          // The API derives both from the authenticated session.
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to send reply"
        );
      }

      setReplyText("");
      setReplyingTo("");

      setSuccess("Reply added successfully.");

      await loadDiscussions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to send reply"
      );
    } finally {
      setSendingReply(false);
    }
  }

  // RESOLVE OR REOPEN DISCUSSION
  async function updateStatus(
    id: string,
    status: "OPEN" | "RESOLVED"
  ) {
    try {
      setUpdatingId(id);
      setError("");
      setSuccess("");

      const response = await fetch("/api/discussions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          discussion_id: id,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to update discussion"
        );
      }

      setSuccess("Discussion status updated successfully.");

      await loadDiscussions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update status"
      );
    } finally {
      setUpdatingId("");
    }
  }

  // DATE FORMATTING
  function formatDate(date: string) {
    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return "Date unavailable";
    }

    return parsed.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }

  // ROLE DISPLAY
  const roleColor = (role: string) => {
    switch (role) {
      case "STUDENT":
        return "bg-blue-50 text-blue-700";

      case "REVIEWER":
        return "bg-emerald-50 text-emerald-700";

      case "ADMIN":
        return "bg-purple-50 text-purple-700";

      case "COORDINATOR":
        return "bg-amber-50 text-amber-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <main className="min-h-screen bg-[#f5f6f8] text-slate-900">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <section className="lg:ml-64">

        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5 md:px-10">

          <div>
            <p className="text-sm text-slate-500">
              Workspace / Discussions
            </p>

            <h1 className="mt-1 text-2xl font-bold">
              Research Discussions
            </h1>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white px-4 py-2">
            {authLoading ? (
              <p className="text-sm text-slate-500">
                Checking account...
              </p>
            ) : user ? (
              <>
                <p className="text-sm font-semibold">
                  {user.fullName}
                </p>

                <span
                  className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-semibold ${roleColor(user.role)}`}
                >
                  {user.role}
                </span>
              </>
            ) : (
              <p className="text-sm text-red-600">
                Not authenticated
              </p>
            )}
          </div>
        </header>

        <div className="p-6 md:p-10">

          {/* INTRODUCTION */}
          <div className="mb-8">
            <p className="text-sm font-medium text-emerald-700">
              POSTGRESQL + MONGODB · DISCUSSION MANAGEMENT
            </p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Discussion workspace
            </h2>

            <p className="mt-2 text-slate-500">
              Manage communication and feedback between students
              and research reviewers.
            </p>
          </div>

          {/* STATISTICS */}
          <div className="mb-8 grid gap-5 sm:grid-cols-3">

            {[
              {
                label: "Total discussions",
                value: discussions.length,
                description: "All stored MongoDB documents",
              },
              {
                label: "Open discussions",
                value: openCount,
                description: "Awaiting resolution",
              },
              {
                label: "Resolved discussions",
                value: resolvedCount,
                description: "Completed conversations",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <p className="text-sm text-slate-500">
                  {item.label}
                </p>

                <p className="mt-4 text-3xl font-bold">
                  {item.value}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}

          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {success}
            </div>
          )}

          {/* DASHBOARD COLUMNS */}
          <div className="grid gap-7 xl:grid-cols-[1.5fr_1fr]">

            {/* DISCUSSION RECORDS */}
            <section className="rounded-xl border border-slate-200 bg-white p-6">

              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

                <div>
                  <h3 className="text-lg font-bold">
                    Discussion records
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Messages stored in MongoDB.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    loadDiscussions();
                    loadAssignments();
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
                >
                  Refresh
                </button>

              </div>

              {/* FILTERS */}
              <div className="mb-6">

                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Filter discussions
                </label>

                <select
                  value={filter}
                  onChange={(event) =>
                    setFilter(event.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="ALL">
                    All discussions
                  </option>

                  <option value="OPEN">
                    Open discussions
                  </option>

                  <option value="RESOLVED">
                    Resolved discussions
                  </option>

                  {manuscriptIds.map((id) => (
                    <option key={id} value={String(id)}>
                      Manuscript #{id}
                    </option>
                  ))}
                </select>

              </div>

              {/* DISCUSSION LIST */}
              {loading ? (
                <p className="py-10 text-center text-sm text-slate-500">
                  Loading discussions...
                </p>
              ) : filteredDiscussions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center">

                  <p className="font-medium text-slate-700">
                    No discussions found
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Try another filter or add a new discussion.
                  </p>

                </div>
              ) : (
                <div className="space-y-5">

                  {filteredDiscussions.map((item) => (
                    <article
                      key={item._id}
                      className="rounded-xl border border-slate-200 p-5"
                    >

                      {/* DISCUSSION HEADING */}
                      <div className="flex flex-wrap items-start justify-between gap-3">

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            Manuscript #{item.manuscript_id}
                          </p>

                          {item.assignment_id && (
                            <p className="mt-1 text-xs text-slate-400">
                              Assignment #{item.assignment_id}
                            </p>
                          )}

                          <h4 className="mt-2 font-bold">
                            {item.student_name}
                          </h4>

                          <p className="mt-1 text-xs text-slate-500">
                            Reviewer: {item.reviewer_name}
                          </p>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            item.status === "OPEN"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {item.status}
                        </span>

                      </div>

                      {/* ORIGINAL DISCUSSION */}
                      <div className="mt-4 rounded-lg bg-slate-50 p-4">

                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Original discussion
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {item.discussion}
                        </p>

                      </div>

                      <div className="mt-3">

                        <p className="text-xs text-slate-500">
                          {item.discussion_type.replaceAll("_", " ")}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDate(item.created_at)}
                        </p>

                      </div>

                      {/* CONVERSATION REPLIES */}
                      <div className="mt-5 border-t border-slate-100 pt-4">

                        <h5 className="mb-3 text-sm font-semibold text-slate-800">
                          Conversation ({item.replies?.length || 0})
                        </h5>

                        {item.replies && item.replies.length > 0 ? (
                          <div className="space-y-3">

                            {item.replies.map((reply, index) => (
                              <div
                                key={`${item._id}-${index}`}
                                className="rounded-lg border border-slate-200 bg-white p-4"
                              >

                                <div className="flex flex-wrap items-center justify-between gap-2">

                                  <p className="text-sm font-semibold text-slate-800">
                                    {reply.author_name}
                                  </p>

                                  <span
                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${roleColor(reply.author_role)}`}
                                  >
                                    {reply.author_role}
                                  </span>

                                </div>

                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                  {reply.message}
                                </p>

                                <p className="mt-2 text-xs text-slate-400">
                                  {formatDate(reply.created_at)}
                                </p>

                              </div>
                            ))}

                          </div>
                        ) : (
                          <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">
                            No replies yet. Start the conversation.
                          </p>
                        )}

                        {/* REPLY FORM */}
                        {item.status === "OPEN" && user && (
                          <div className="mt-4">

                            {replyingTo === item._id ? (
                              <div className="space-y-3">

                                {/* AUTHENTICATED REPLY IDENTITY */}
                                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">

                                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                    Replying as
                                  </p>

                                  <p className="mt-1 text-sm font-semibold text-slate-800">
                                    {user.fullName}
                                  </p>

                                  <p className="mt-1 text-xs text-slate-500">
                                    {user.role}
                                  </p>

                                </div>

                                <textarea
                                  value={replyText}
                                  onChange={(event) =>
                                    setReplyText(event.target.value)
                                  }
                                  maxLength={3000}
                                  rows={3}
                                  placeholder="Write your reply..."
                                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600"
                                />

                                <p className="text-right text-xs text-slate-400">
                                  {replyText.length}/3000
                                </p>

                                <div className="flex flex-wrap gap-2">

                                  <button
                                    type="button"
                                    disabled={
                                      sendingReply ||
                                      !replyText.trim()
                                    }
                                    onClick={() => submitReply(item)}
                                    className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {sendingReply
                                      ? "Sending..."
                                      : "Send reply"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyingTo("");
                                      setReplyText("");
                                    }}
                                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
                                  >
                                    Cancel
                                  </button>

                                </div>

                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyingTo(item._id);
                                  setReplyText("");
                                }}
                                className="rounded-lg border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                              >
                                + Reply to discussion
                              </button>
                            )}

                          </div>
                        )}

                      </div>

                      {/* STATUS ACTIONS */}
                      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">

                        {item.status === "OPEN" ? (
                          <button
                            type="button"
                            disabled={updatingId === item._id}
                            onClick={() =>
                              updateStatus(item._id, "RESOLVED")
                            }
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {updatingId === item._id
                              ? "Updating..."
                              : "Mark resolved"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={updatingId === item._id}
                            onClick={() =>
                              updateStatus(item._id, "OPEN")
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {updatingId === item._id
                              ? "Updating..."
                              : "Reopen discussion"}
                          </button>
                        )}

                      </div>

                    </article>
                  ))}

                </div>
              )}

            </section>

            {/* ADD NEW DISCUSSION */}
            <section className="h-fit rounded-xl border border-slate-200 bg-white p-6">

              <div className="mb-6">

                <h3 className="text-lg font-bold">
                  Add new discussion
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Select an assignment from PostgreSQL and save feedback in MongoDB.
                </p>

              </div>

              <form onSubmit={addDiscussion} className="space-y-5">

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Select assignment
                  </label>

                  <select
                    value={form.assignment_id}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        assignment_id: event.target.value,
                      })
                    }
                    required
                    disabled={
                      assignmentsLoading ||
                      assignments.length === 0
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
                  >
                    <option value="">
                      {assignmentsLoading
                        ? "Loading assignments..."
                        : assignments.length === 0
                          ? "No assignments available"
                          : "Select an assignment"}
                    </option>

                    {assignments.map((item) => (
                      <option
                        key={item.assignment_id}
                        value={String(item.assignment_id)}
                      >
                        Assignment #{item.assignment_id} –{" "}
                        {item.manuscript_title} – {item.reviewer_name}
                      </option>
                    ))}
                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Manuscript
                  </label>

                  <input
                    value={
                      selectedAssignment
                        ? `#${selectedAssignment.manuscript_id} – ${selectedAssignment.manuscript_title}`
                        : ""
                    }
                    readOnly
                    placeholder="Select an assignment first"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Student name
                  </label>

                  <input
                    value={selectedAssignment?.student_name || ""}
                    readOnly
                    placeholder="Automatically loaded from PostgreSQL"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Reviewer name
                  </label>

                  <input
                    value={selectedAssignment?.reviewer_name || ""}
                    readOnly
                    placeholder="Automatically loaded from PostgreSQL"
                    className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Discussion type
                  </label>

                  <select
                    value={form.discussion_type}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        discussion_type: event.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm"
                  >
                    <option value="REVIEW_FEEDBACK">
                      Review feedback
                    </option>

                    <option value="GENERAL_DISCUSSION">
                      General discussion
                    </option>
                  </select>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-medium">
                    Discussion message
                  </label>

                  <textarea
                    value={form.discussion}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        discussion: event.target.value,
                      })
                    }
                    required
                    maxLength={5000}
                    rows={5}
                    placeholder="Enter reviewer feedback or discussion..."
                    className="w-full resize-y rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600"
                  />

                  <p className="mt-1 text-right text-xs text-slate-400">
                    {form.discussion.length}/5000
                  </p>

                </div>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    assignmentsLoading ||
                    !selectedAssignment ||
                    !user
                  }
                  className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Add discussion"}
                </button>

              </form>

              <div className="mt-5 rounded-lg bg-slate-50 p-4">

                <p className="text-xs font-semibold text-slate-700">
                  DATABASE INTEGRATION
                </p>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Assignment and user information is retrieved from PostgreSQL.
                  Discussion messages, replies and statuses are stored in MongoDB.
                  Reply identity is determined by the authenticated session.
                </p>

              </div>

            </section>

          </div>

          {/* FOOTER */}
          <footer className="mt-12 border-t border-slate-200 py-6 text-center text-xs text-slate-400">
            Smart Research & Peer Review Portal · Academic Project 2026
          </footer>

        </div>
      </section>
    </main>
  );
}
