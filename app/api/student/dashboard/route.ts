
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";



export async function GET() {
  try {
    // 1. Verify the logged-in user
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in to view your reviews."
        },
        { status: 401 }
      );
    }

    // 2. Allow only students
    if (session.role !== "STUDENT") {
      return NextResponse.json(
        {
          success: false,
          message: "Only students can access this page."
        },
        { status: 403 }
      );
    }

    // 3. Get all submitted reviews belonging to this student
    const reviewsQuery = `
      SELECT
        rv.review_id,
        rv.assignment_id,
        m.manuscript_id,
        m.title AS manuscript_title,

        reviewer_user.full_name AS reviewer_name,

        rv.technical_score,
        rv.originality_score,

        CASE
          WHEN rv.technical_score IS NOT NULL
           AND rv.originality_score IS NOT NULL
          THEN ROUND(
            (rv.technical_score + rv.originality_score) / 2,
            2
          )
          ELSE NULL
        END AS average_score,

        rv.review_comments,
        rv.recommendation,
        rv.reviewed_at

      FROM reviews rv

      INNER JOIN assignments a
        ON rv.assignment_id = a.assignment_id

      INNER JOIN manuscripts m
        ON a.manuscript_id = m.manuscript_id

      INNER JOIN reviewers r
        ON a.reviewer_id = r.reviewer_id

      INNER JOIN users reviewer_user
        ON r.user_id = reviewer_user.user_id

      WHERE m.student_id = $1

      ORDER BY rv.reviewed_at DESC;
    `;

    const result = await pool.query(reviewsQuery, [
      session.userId
    ]);

    const reviews = result.rows;

    // 4. Calculate dashboard summary
    const reviewedManuscripts = new Set(
      reviews.map((review) => review.manuscript_id)
    );

    const scores = reviews
      .filter(
        (review) =>
          review.average_score !== null &&
          review.average_score !== undefined
      )
      .map((review) => Number(review.average_score));

    const averageScore =
      scores.length > 0
        ? Number(
            (
              scores.reduce((total, score) => total + score, 0) /
              scores.length
            ).toFixed(2)
          )
        : null;

    // 5. Return results
    return NextResponse.json({
      success: true,

      student: {
        userId: session.userId,
        fullName: session.fullName,
        email: session.email
      },

      statistics: {
        totalReviews: reviews.length,
        manuscriptsReviewed: reviewedManuscripts.size,
        averageScore
      },

      reviews
    });

  } catch (error) {
    console.error("Student reviews API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve student reviews."
      },
      { status: 500 }
    );
  }
}
