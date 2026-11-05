import {
  connection,
  NextRequest,
  NextResponse,
} from "next/server";

import pool from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await connection();

  try {
    // 1. Verify the logged-in user.
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

    // 2. Only ADMIN and COORDINATOR can test PostgreSQL.
    if (
      session.role !== "ADMIN" &&
      session.role !== "COORDINATOR"
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized to access this endpoint.",
        },
        { status: 403 }
      );
    }

    // 3. Test PostgreSQL connection.
    const result = await pool.query(
      `SELECT
        current_database() AS database_name,
        NOW() AS server_time`
    );

    // 4. Return connection status.
    return NextResponse.json({
      success: true,
      message: "PostgreSQL connected successfully!",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("PostgreSQL connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "PostgreSQL connection failed",
      },
      { status: 500 }
    );
  }
}