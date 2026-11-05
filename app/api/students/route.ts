import { connection, NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Wait until the incoming request is available.
  await connection();

  try {
    // 1. Verify the authenticated session.
    const session = await getSessionFromRequest(request);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized. Please log in.",
        },
        { status: 401 }
      );
    }

    // 2. Only ADMIN and COORDINATOR can view all students.
    if (
      session.role !== "ADMIN" &&
      session.role !== "COORDINATOR"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden. You do not have permission to view students.",
        },
        { status: 403 }
      );
    }

    // 3. Retrieve students from PostgreSQL.
    const result = await pool.query(`
      SELECT
        user_id,
        full_name
      FROM users
      WHERE role = 'STUDENT'
      ORDER BY full_name;
    `);

    // 4. Return student records.
    return NextResponse.json({
      success: true,
      students: result.rows,
    });
  } catch (error) {
    console.error("Students API error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unable to fetch students.",
      },
      { status: 500 }
    );
  }
}