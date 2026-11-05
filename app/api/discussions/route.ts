
import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, type Filter } from "mongodb";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

type DiscussionRole = "STUDENT" | "REVIEWER";

interface DiscussionReply {
  author_name: string;
  author_role: DiscussionRole;
  message: string;
  created_at: string;
}

interface DiscussionMessage {
  manuscript_id: number;
  assignment_id?: number;
  student_name: string;
  discussion: string;
  reviewer_name: string;
  discussion_type: "REVIEW_FEEDBACK" | "GENERAL_DISCUSSION";
  created_at: string;
  status: "OPEN" | "RESOLVED";
  replies?: DiscussionReply[];
}

function getDatabaseName() {
  const name = process.env.MONGODB_DATABASE;

  if (!name) {
    throw new Error("Missing MONGODB_DATABASE");
  }

  return name;
}

function isManager(role: string) {
  return role === "ADMIN" || role === "COORDINATOR";
}

// Check whether a user can access a particular discussion.
async function canAccessDiscussion(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
  discussion: DiscussionMessage
) {
  if (isManager(session.role)) {
    return true;
  }

  if (session.role === "STUDENT") {
    const result = await pool.query(
      `SELECT 1
       FROM manuscripts
       WHERE manuscript_id = $1
         AND student_id = $2`,
      [discussion.manuscript_id, session.userId]
    );

    return result.rowCount !== 0;
  }

  if (session.role === "REVIEWER") {
    if (!discussion.assignment_id) {
      return false;
    }

    const result = await pool.query(
      `SELECT 1
       FROM assignments a
       INNER JOIN reviewers r
         ON a.reviewer_id = r.reviewer_id
       WHERE a.assignment_id = $1
         AND a.manuscript_id = $2
         AND r.user_id = $3`,
      [
        discussion.assignment_id,
        discussion.manuscript_id,
        session.userId,
      ]
    );

    return result.rowCount !== 0;
  }

  return false;
}

// GET: Fetch only discussions the logged-in user can access.
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const database = client.db(getDatabaseName());

    const manuscriptParam =
      request.nextUrl.searchParams.get("manuscript_id");

    const filter: Filter<DiscussionMessage> = {};

    if (manuscriptParam !== null) {
      const id = Number(manuscriptParam);

      if (!Number.isInteger(id) || id <= 0) {
        return NextResponse.json(
          { success: false, message: "Invalid manuscript ID." },
          { status: 400 }
        );
      }

      filter.manuscript_id = id;
    }

    // Admin and coordinator can see all discussions.
    if (!isManager(session.role)) {
      if (session.role === "STUDENT") {
        const manuscripts = await pool.query(
          `SELECT manuscript_id
           FROM manuscripts
           WHERE student_id = $1`,
          [session.userId]
        );

        const manuscriptIds = manuscripts.rows.map(
          (row) => Number(row.manuscript_id)
        );

        filter.manuscript_id = {
          $in: manuscriptIds,
        };
      } else if (session.role === "REVIEWER") {
        const assignments = await pool.query(
          `SELECT assignment_id
           FROM assignments a
           INNER JOIN reviewers r
             ON a.reviewer_id = r.reviewer_id
           WHERE r.user_id = $1`,
          [session.userId]
        );

        const assignmentIds = assignments.rows.map(
          (row) => Number(row.assignment_id)
        );

        filter.assignment_id = {
          $in: assignmentIds,
        };
      } else {
        return NextResponse.json(
          { success: false, message: "You are not authorized." },
          { status: 403 }
        );
      }
    }

    const discussions = await database
      .collection<DiscussionMessage>("review_discussions")
      .find(filter)
      .sort({ created_at: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      total: discussions.length,
      discussions,
    });
  } catch (error) {
    console.error("Fetch discussions error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch discussions." },
      { status: 500 }
    );
  }
}

// POST: Create a discussion only for an assignment the user can access.
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const assignmentId = Number(body.assignment_id);

    const discussion =
      typeof body.discussion === "string"
        ? body.discussion.trim()
        : "";

    const discussionType = body.discussion_type;

    if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
      return NextResponse.json(
        { success: false, message: "Valid assignment_id is required." },
        { status: 400 }
      );
    }

    if (!discussion || discussion.length > 5000) {
      return NextResponse.json(
        {
          success: false,
          message: "Discussion must contain 1-5000 characters.",
        },
        { status: 400 }
      );
    }

    if (
      !["REVIEW_FEEDBACK", "GENERAL_DISCUSSION"].includes(
        discussionType
      )
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid discussion type." },
        { status: 400 }
      );
    }

    if (
      !isManager(session.role) &&
      session.role !== "STUDENT" &&
      session.role !== "REVIEWER"
    ) {
      return NextResponse.json(
        { success: false, message: "You are not authorized." },
        { status: 403 }
      );
    }

    let assignmentQuery = `
      SELECT
        a.assignment_id,
        a.manuscript_id,
        m.student_id,
        r.user_id AS reviewer_user_id,
        student.full_name AS student_name,
        reviewer.full_name AS reviewer_name
      FROM assignments a
      INNER JOIN manuscripts m
        ON a.manuscript_id = m.manuscript_id
      INNER JOIN users student
        ON m.student_id = student.user_id
      INNER JOIN reviewers r
        ON a.reviewer_id = r.reviewer_id
      INNER JOIN users reviewer
        ON r.user_id = reviewer.user_id
      WHERE a.assignment_id = $1
    `;

    const assignmentValues: number[] = [assignmentId];

    if (session.role === "STUDENT") {
      assignmentQuery += ` AND m.student_id = $2`;
      assignmentValues.push(session.userId);
    } else if (session.role === "REVIEWER") {
      assignmentQuery += ` AND r.user_id = $2`;
      assignmentValues.push(session.userId);
    }

    const assignmentResult = await pool.query(
      assignmentQuery,
      assignmentValues
    );

    if (assignmentResult.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Assignment not found or you are not authorized to access it.",
        },
        { status: 404 }
      );
    }

    const assignment = assignmentResult.rows[0];

    const client = await clientPromise;
    const database = client.db(getDatabaseName());

    const newDiscussion: DiscussionMessage = {
      assignment_id: Number(assignment.assignment_id),
      manuscript_id: Number(assignment.manuscript_id),
      student_name: assignment.student_name,
      reviewer_name: assignment.reviewer_name,
      discussion,
      discussion_type: discussionType,
      created_at: new Date().toISOString(),
      status: "OPEN",
      replies: [],
    };

    const result = await database
      .collection<DiscussionMessage>("review_discussions")
      .insertOne(newDiscussion);

    return NextResponse.json(
      {
        success: true,
        message: "Discussion created successfully.",
        discussion_id: result.insertedId,
        discussion: newDiscussion,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create discussion error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to create discussion." },
      { status: 500 }
    );
  }
}

// PATCH: Add a reply or update status after verifying discussion ownership.
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const discussionId =
      typeof body.discussion_id === "string"
        ? body.discussion_id
        : "";

    if (!ObjectId.isValid(discussionId)) {
      return NextResponse.json(
        { success: false, message: "Invalid discussion ID." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const database = client.db(getDatabaseName());

    const collection =
      database.collection<DiscussionMessage>("review_discussions");

    const objectId = new ObjectId(discussionId);

    const existing = await collection.findOne({
      _id: objectId,
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Discussion not found." },
        { status: 404 }
      );
    }

    const authorized = await canAccessDiscussion(session, existing);

    if (!authorized) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to access this discussion.",
        },
        { status: 403 }
      );
    }

    // ACTION 1: Add a reply.
    if (body.action === "ADD_REPLY") {
      if (
        session.role !== "STUDENT" &&
        session.role !== "REVIEWER" &&
        !isManager(session.role)
      ) {
        return NextResponse.json(
          { success: false, message: "You are not authorized to reply." },
          { status: 403 }
        );
      }

      const message =
        typeof body.message === "string"
          ? body.message.trim()
          : "";

      if (!message || message.length > 3000) {
        return NextResponse.json(
          {
            success: false,
            message: "Reply must contain 1-3000 characters.",
          },
          { status: 400 }
        );
      }

      if (existing.status !== "OPEN") {
        return NextResponse.json(
          {
            success: false,
            message: "Cannot reply to a resolved discussion. Reopen it first.",
          },
          { status: 409 }
        );
      }

      // Identity and role come from the authenticated session,
      // never from the request body.
      const reply: DiscussionReply = {
        author_name: session.fullName,
        author_role:
          session.role === "REVIEWER" ? "REVIEWER" : "STUDENT",
        message,
        created_at: new Date().toISOString(),
      };

      const result = await collection.updateOne(
        {
          _id: objectId,
          status: "OPEN",
        },
        {
          $push: { replies: reply },
        }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Discussion is no longer open. Refresh and try again.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Reply added successfully.",
        reply,
      });
    }

    // ACTION 2: Update discussion status.
    if (body.action !== undefined) {
      return NextResponse.json(
        { success: false, message: "Invalid discussion action." },
        { status: 400 }
      );
    }

    const status = body.status;

    if (status !== "OPEN" && status !== "RESOLVED") {
      return NextResponse.json(
        {
          success: false,
          message: "Status must be OPEN or RESOLVED.",
        },
        { status: 400 }
      );
    }

    const result = await collection.updateOne(
      { _id: objectId },
      { $set: { status } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "Discussion not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Discussion status updated successfully.",
      status,
    });
  } catch (error) {
    console.error("Update discussion error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to update discussion." },
      { status: 500 }
    );
  }
}
