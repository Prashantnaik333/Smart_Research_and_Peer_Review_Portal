import {
  connection,
  NextRequest,
  NextResponse,
} from "next/server";

import pool from "@/lib/db";
import clientPromise from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Wait until the incoming request is available.
  await connection();

  try {
    // 1. Verify authenticated session.
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Please log in first.",
        },
        { status: 401 }
      );
    }

    // 2. Only administrators and coordinators can access analytics.
    if (
      session.role !== "ADMIN" &&
      session.role !== "COORDINATOR"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to access analytics.",
        },
        { status: 403 }
      );
    }

    // 3. PostgreSQL: manuscript statistics.
    const manuscriptResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE status = 'SUBMITTED'
        )::int AS submitted,
        COUNT(*) FILTER (
          WHERE status = 'UNDER_REVIEW'
        )::int AS under_review
      FROM manuscripts;
    `);

    // 4. PostgreSQL: assignment statistics.
    const assignmentResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (
          WHERE status = 'ASSIGNED'
        )::int AS assigned,
        COUNT(*) FILTER (
          WHERE status = 'IN_PROGRESS'
        )::int AS in_progress,
        COUNT(DISTINCT a.assignment_id) FILTER (
          WHERE rv.review_id IS NOT NULL
        )::int AS reviewed
      FROM assignments a
      LEFT JOIN reviews rv
        ON rv.assignment_id = a.assignment_id;
    `);

    // 5. PostgreSQL: peer review statistics.
    const reviewResult = await pool.query(`
      SELECT
        COUNT(*)::int AS total_reviews,
        ROUND(AVG(technical_score), 2)
          AS average_technical_score,
        ROUND(AVG(originality_score), 2)
          AS average_originality_score,
        COUNT(*) FILTER (
          WHERE recommendation = 'ACCEPT'
        )::int AS accepted,
        COUNT(*) FILTER (
          WHERE recommendation = 'REVISION_REQUIRED'
        )::int AS revision_required
      FROM reviews;
    `);

    // 6. PostgreSQL: reviewer workload.
    const reviewerResult = await pool.query(`
      SELECT
        r.reviewer_id,
        u.full_name AS reviewer_name,
        COUNT(DISTINCT a.assignment_id)::int
          AS total_assignments,
        COUNT(DISTINCT rv.review_id)::int
          AS completed_reviews
      FROM reviewers r
      INNER JOIN users u
        ON u.user_id = r.user_id
      LEFT JOIN assignments a
        ON a.reviewer_id = r.reviewer_id
      LEFT JOIN reviews rv
        ON rv.assignment_id = a.assignment_id
      GROUP BY r.reviewer_id, u.full_name
      ORDER BY total_assignments DESC, reviewer_name;
    `);

    // 7. PostgreSQL: department-wise manuscripts.
    const departmentResult = await pool.query(`
      SELECT
        d.department_name,
        COUNT(DISTINCT m.manuscript_id)::int
          AS manuscript_count
      FROM departments d
      LEFT JOIN users u
        ON u.department_id = d.department_id
      LEFT JOIN manuscripts m
        ON m.student_id = u.user_id
      GROUP BY d.department_id, d.department_name
      ORDER BY manuscript_count DESC, d.department_name;
    `);

    // 8. PostgreSQL: research topic distribution.
    const topicResult = await pool.query(`
      SELECT
        rt.topic_name,
        COUNT(DISTINCT mt.manuscript_id)::int
          AS manuscript_count
      FROM research_topics rt
      LEFT JOIN manuscript_topics mt
        ON mt.topic_id = rt.topic_id
      GROUP BY rt.topic_id, rt.topic_name
      ORDER BY manuscript_count DESC, rt.topic_name;
    `);

    // 9. PostgreSQL: recent activity.
    const activityResult = await pool.query(`
      SELECT
        al.log_id,
        al.action,
        al.entity_type,
        al.description,
        al.created_at,
        u.full_name AS user_name
      FROM audit_logs al
      LEFT JOIN users u
        ON u.user_id = al.user_id
      ORDER BY al.created_at DESC
      LIMIT 8;
    `);

    // 10. MongoDB: discussion and reply statistics.
    const client = await clientPromise;
    const databaseName = process.env.MONGODB_DATABASE;

    if (!databaseName) {
      throw new Error("MONGODB_DATABASE is not configured.");
    }

    const db = client.db(databaseName);
    const discussions = db.collection("review_discussions");

    const discussionResult = await discussions
      .aggregate([
        {
          $group: {
            _id: null,

            total: {
              $sum: 1,
            },

            open: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "OPEN"] },
                  1,
                  0,
                ],
              },
            },

            resolved: {
              $sum: {
                $cond: [
                  { $eq: ["$status", "RESOLVED"] },
                  1,
                  0,
                ],
              },
            },

            totalReplies: {
              $sum: {
                $cond: [
                  { $isArray: "$replies" },
                  { $size: "$replies" },
                  0,
                ],
              },
            },
          },
        },
      ])
      .toArray();

    const discussionStats = discussionResult[0] ?? {
      total: 0,
      open: 0,
      resolved: 0,
      totalReplies: 0,
    };

    // 11. Return combined PostgreSQL and MongoDB analytics.
    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),

      manuscripts: manuscriptResult.rows[0],
      assignments: assignmentResult.rows[0],
      reviews: reviewResult.rows[0],

      reviewerWorkload: reviewerResult.rows,
      departmentStats: departmentResult.rows,
      topicStats: topicResult.rows,
      recentActivities: activityResult.rows,

      discussions: {
        total: discussionStats.total,
        open: discussionStats.open,
        resolved: discussionStats.resolved,
        totalReplies: discussionStats.totalReplies,
      },
    });
  } catch (error) {
    console.error("Analytics API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate analytics reports.",
      },
      { status: 500 }
    );
  }
}