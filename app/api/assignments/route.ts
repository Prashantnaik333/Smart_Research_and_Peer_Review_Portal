
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET: Retrieve assignments according to the logged-in user's role.
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    let query = `
      SELECT
        a.assignment_id,
        a.manuscript_id,
        m.title AS manuscript_title,
        student.full_name AS student_name,
        a.reviewer_id,
        reviewer.full_name AS reviewer_name,
        reviewer.email AS reviewer_email,
        a.assigned_at,
        a.due_date,
        a.status
      FROM assignments a
      INNER JOIN manuscripts m
        ON a.manuscript_id = m.manuscript_id
      INNER JOIN users student
        ON m.student_id = student.user_id
      INNER JOIN reviewers r
        ON a.reviewer_id = r.reviewer_id
      INNER JOIN users reviewer
        ON r.user_id = reviewer.user_id
    `;

    const values: number[] = [];

    if (session.role === "STUDENT") {
      query += ` WHERE m.student_id = $1`;
      values.push(session.userId);
    } else if (session.role === "REVIEWER") {
      query += ` WHERE r.user_id = $1`;
      values.push(session.userId);
    } else if (
      session.role !== "ADMIN" &&
      session.role !== "COORDINATOR"
    ) {
      return NextResponse.json(
        { success: false, message: "You are not authorized." },
        { status: 403 }
      );
    }

    query += ` ORDER BY a.assigned_at DESC`;

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      total: result.rows.length,
      assignments: result.rows,
    });
  } catch (error) {
    console.error("Assignment GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve assignments.",
      },
      { status: 500 }
    );
  }
}

// POST: Only ADMIN and COORDINATOR can assign reviewers.
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Please log in first." },
        { status: 401 }
      );
    }

    if (
      session.role !== "ADMIN" &&
      session.role !== "COORDINATOR"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Only administrators and coordinators can assign reviewers.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const manuscriptId = Number(body.manuscript_id);
    const reviewerId = Number(body.reviewer_id);
    const dueDate = body.due_date;

    if (
      !Number.isInteger(manuscriptId) ||
      manuscriptId <= 0 ||
      !Number.isInteger(reviewerId) ||
      reviewerId <= 0 ||
      typeof dueDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide valid assignment details.",
        },
        { status: 400 }
      );
    }

    const validDate = new Date(`${dueDate}T00:00:00Z`);

    if (
      Number.isNaN(validDate.getTime()) ||
      validDate.toISOString().slice(0, 10) !== dueDate
    ) {
      return NextResponse.json(
        { success: false, message: "Invalid deadline." },
        { status: 400 }
      );
    }

    const manuscript = await pool.query(
      `SELECT manuscript_id
       FROM manuscripts
       WHERE manuscript_id = $1`,
      [manuscriptId]
    );

    if (manuscript.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: "Manuscript not found." },
        { status: 404 }
      );
    }

    const reviewer = await pool.query(
      `SELECT reviewer_id
       FROM reviewers
       WHERE reviewer_id = $1
       AND availability = TRUE`,
      [reviewerId]
    );

    if (reviewer.rowCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Reviewer not found or unavailable.",
        },
        { status: 404 }
      );
    }

    const result = await pool.query(
      `INSERT INTO assignments
        (manuscript_id, reviewer_id, due_date)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [manuscriptId, reviewerId, dueDate]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Reviewer assigned successfully!",
        assignment: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    const dbError = error as { code?: string };

    if (dbError.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "This reviewer is already assigned to this manuscript.",
        },
        { status: 409 }
      );
    }

    console.error("Assignment POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to create assignment.",
      },
      { status: 500 }
    );
  }
}
