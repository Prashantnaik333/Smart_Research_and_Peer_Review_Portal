
import { NextResponse } from "next/server";
import pool  from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET: Retrieve manuscripts according to the logged-in user's role
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

    if (session.role === "STUDENT") {
      // Students can only see their own manuscripts
      result = await pool.query(
        `SELECT
          m.manuscript_id,
          m.title,
          m.abstract,
          m.keywords,
          m.status,
          m.submitted_at,
          m.updated_at,
          u.full_name AS student_name,
          d.department_name
        FROM manuscripts m
        LEFT JOIN users u ON m.student_id = u.user_id
        LEFT JOIN departments d ON u.department_id = d.department_id
        WHERE m.student_id = $1
        ORDER BY m.submitted_at DESC`,
        [session.userId]
      );
    } else if (session.role === "REVIEWER") {
      // Reviewers can only see manuscripts assigned to them
      result = await pool.query(
        `SELECT DISTINCT
          m.manuscript_id,
          m.title,
          m.abstract,
          m.keywords,
          m.status,
          m.submitted_at,
          m.updated_at,
          u.full_name AS student_name,
          d.department_name
        FROM manuscripts m
        LEFT JOIN users u ON m.student_id = u.user_id
        LEFT JOIN departments d ON u.department_id = d.department_id
        INNER JOIN assignments a
          ON a.manuscript_id = m.manuscript_id
        INNER JOIN reviewers r
          ON r.reviewer_id = a.reviewer_id
        WHERE r.user_id = $1
        ORDER BY m.submitted_at DESC`,
        [session.userId]
      );
    } else if (
      session.role === "ADMIN" ||
      session.role === "COORDINATOR"
    ) {
      // Admins and coordinators can see all manuscripts
      result = await pool.query(
        `SELECT
          m.manuscript_id,
          m.title,
          m.abstract,
          m.keywords,
          m.status,
          m.submitted_at,
          m.updated_at,
          u.full_name AS student_name,
          d.department_name
        FROM manuscripts m
        LEFT JOIN users u ON m.student_id = u.user_id
        LEFT JOIN departments d ON u.department_id = d.department_id
        ORDER BY m.submitted_at DESC`
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
      manuscripts: result.rows,
    });
  } catch (error) {
    console.error("Manuscript GET error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to fetch manuscripts." },
      { status: 500 }
    );
  }
}

// POST: Submit a new manuscript
export async function POST(request: Request) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Authentication required." },
        { status: 401 }
      );
    }

    // Only students can submit through this endpoint
    if (session.role !== "STUDENT") {
      return NextResponse.json(
        {
          success: false,
          message: "Only students can submit manuscripts.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const title =
      typeof body.title === "string" ? body.title.trim() : "";

    const abstract =
      typeof body.abstract === "string" ? body.abstract.trim() : "";

    const keywords =
      typeof body.keywords === "string" ? body.keywords.trim() : "";

    if (!title || !abstract || !keywords) {
      return NextResponse.json(
        {
          success: false,
          message: "Title, abstract and keywords are required.",
        },
        { status: 400 }
      );
    }

    if (title.length > 250) {
      return NextResponse.json(
        {
          success: false,
          message: "Title must not exceed 250 characters.",
        },
        { status: 400 }
      );
    }

    if (abstract.length > 10000 || keywords.length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message: "Abstract or keywords are too long.",
        },
        { status: 400 }
      );
    }

    // Always use the authenticated student's ID.
    // Never trust student_id sent by the browser.
    const result = await pool.query(
      `INSERT INTO manuscripts
        (title, abstract, keywords, student_id)
       VALUES ($1, $2, $3, $4)
       RETURNING
         manuscript_id,
         title,
         student_id,
         status,
         submitted_at`,
      [title, abstract, keywords, session.userId]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Research manuscript submitted successfully!",
        manuscript: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Manuscript POST error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit manuscript.",
      },
      { status: 500 }
    );
  }
}
