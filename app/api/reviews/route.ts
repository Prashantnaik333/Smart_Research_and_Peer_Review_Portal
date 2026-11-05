
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET: Retrieve reviews according to the logged-in user's role
export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    let result;

    const baseQuery = `
      SELECT
        r.review_id,
        r.assignment_id,
        a.manuscript_id,
        m.title AS manuscript_title,
        a.reviewer_id,
        u.full_name AS reviewer_name,
        r.review_comments,
        r.technical_score,
        r.originality_score,
        r.recommendation,
        r.reviewed_at
      FROM reviews r
      INNER JOIN assignments a
        ON r.assignment_id = a.assignment_id
      INNER JOIN manuscripts m
        ON a.manuscript_id = m.manuscript_id
      INNER JOIN reviewers rv
        ON a.reviewer_id = rv.reviewer_id
      INNER JOIN users u
        ON rv.user_id = u.user_id
    `;

    if (session.role === "STUDENT") {
      // Students see reviews for their own manuscripts only.
      result = await pool.query(
        `${baseQuery}
         WHERE m.student_id = $1
         ORDER BY r.reviewed_at DESC`,
        [session.userId]
      );
    } else if (session.role === "REVIEWER") {
      // Reviewers see only their own submitted reviews.
      result = await pool.query(
        `${baseQuery}
         WHERE rv.user_id = $1
         ORDER BY r.reviewed_at DESC`,
        [session.userId]
      );
    } else if (
      session.role === "ADMIN" ||
      session.role === "COORDINATOR"
    ) {
      // Admins and coordinators can see all reviews.
      result = await pool.query(
        `${baseQuery}
         ORDER BY r.reviewed_at DESC`
      );
    } else {
      return NextResponse.json(
        { success: false, message: "You are not authorized." },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      total: result.rows.length,
      reviews: result.rows,
    });

  } catch (error) {
    console.error("Review GET error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve reviews.",
      },
      { status: 500 }
    );
  }
}

// POST: Submit a peer review
export async function POST(request: Request) {
  let client;
  let transactionStarted = false;

  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    // Only reviewers can submit peer reviews.
    if (session.role !== "REVIEWER") {
      return NextResponse.json(
        {
          success: false,
          message: "Only authorized reviewers can submit peer reviews.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const assignmentId = Number(body.assignment_id);
    const technicalScore = Number(body.technical_score);
    const originalityScore = Number(body.originality_score);

    const comments =
      typeof body.review_comments === "string"
        ? body.review_comments.trim()
        : "";

    const recommendation = body.recommendation;

    const validRecommendations = [
      "ACCEPT",
      "REJECT",
      "REVISION_REQUIRED",
    ];

    if (
      !Number.isInteger(assignmentId) ||
      assignmentId <= 0 ||
      !Number.isFinite(technicalScore) ||
      !Number.isFinite(originalityScore) ||
      technicalScore < 0 ||
      technicalScore > 10 ||
      originalityScore < 0 ||
      originalityScore > 10 ||
      !comments ||
      comments.length > 10000 ||
      !validRecommendations.includes(recommendation)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide valid review details.",
        },
        { status: 400 }
      );
    }

    client = await pool.connect();

    await client.query("BEGIN");
    transactionStarted = true;

    // Verify that this assignment belongs to the logged-in reviewer.
    // Lock the assignment to prevent simultaneous review submissions.
    const assignmentResult = await client.query(
      `SELECT
         a.assignment_id,
         a.status
       FROM assignments a
       INNER JOIN reviewers rv
         ON a.reviewer_id = rv.reviewer_id
       WHERE a.assignment_id = $1
         AND rv.user_id = $2
       FOR UPDATE OF a`,
      [assignmentId, session.userId]
    );

    if (assignmentResult.rowCount === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return NextResponse.json(
        {
          success: false,
          message: "Assignment not found or not assigned to you.",
        },
        { status: 403 }
      );
    }

    const assignment = assignmentResult.rows[0];

    if (
      assignment.status === "COMPLETED" ||
      assignment.status === "CANCELLED"
    ) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return NextResponse.json(
        {
          success: false,
          message: "This assignment cannot receive another review.",
        },
        { status: 409 }
      );
    }

    // Insert review
    const reviewResult = await client.query(
      `INSERT INTO reviews (
        assignment_id,
        review_comments,
        technical_score,
        originality_score,
        recommendation
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        assignmentId,
        comments,
        technicalScore,
        originalityScore,
        recommendation,
      ]
    );

    // Mark assignment as completed
    await client.query(
      `UPDATE assignments
       SET status = 'COMPLETED'
       WHERE assignment_id = $1`,
      [assignmentId]
    );

    await client.query("COMMIT");
    transactionStarted = false;

    return NextResponse.json(
      {
        success: true,
        message: "Peer review submitted successfully!",
        review: reviewResult.rows[0],
      },
      { status: 201 }
    );

  } catch (error) {
    if (client && transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Review rollback error:", rollbackError);
      }
    }

    const dbError = error as { code?: string };

    if (dbError.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "A review already exists for this assignment.",
        },
        { status: 409 }
      );
    }

    console.error("Review POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit peer review.",
      },
      { status: 500 }
    );

  } finally {
    client?.release();
  }
}
