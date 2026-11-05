
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET: Retrieve reviewer directory.
// Only ADMIN and COORDINATOR can access the full directory.
export async function GET() {
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
        { success: false, message: "You are not authorized to view the reviewer directory." },
        { status: 403 }
      );
    }

    const result = await pool.query(`
      SELECT
        r.reviewer_id,
        r.user_id,
        u.full_name AS reviewer_name,
        u.email,
        r.expertise,
        r.qualification,
        r.experience_years,
        r.availability,
        COUNT(a.assignment_id)::INTEGER AS total_assignments
      FROM reviewers r
      INNER JOIN users u
        ON r.user_id = u.user_id
      LEFT JOIN assignments a
        ON r.reviewer_id = a.reviewer_id
      GROUP BY
        r.reviewer_id,
        r.user_id,
        u.full_name,
        u.email,
        r.expertise,
        r.qualification,
        r.experience_years,
        r.availability
      ORDER BY r.reviewer_id;
    `);

    return NextResponse.json({
      success: true,
      total: result.rows.length,
      reviewers: result.rows,
    });
  } catch (error) {
    console.error("Reviewer GET error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve reviewers." },
      { status: 500 }
    );
  }
}

// POST: Register a new reviewer.
// Only ADMIN and COORDINATOR can create reviewer accounts.
export async function POST(request: Request) {
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
        message: "Only administrators and coordinators can register reviewers.",
      },
      { status: 403 }
    );
  }

  let client;

  try {
    const body = await request.json();

    const fullName =
      typeof body.full_name === "string"
        ? body.full_name.trim()
        : "";

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const expertise =
      typeof body.expertise === "string"
        ? body.expertise.trim()
        : "";

    const qualification =
      typeof body.qualification === "string"
        ? body.qualification.trim()
        : "";

    const experience = Number(body.experience_years);

    if (
      !fullName ||
      !email ||
      !password ||
      !expertise ||
      !Number.isInteger(experience) ||
      experience < 0 ||
      experience > 80
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide valid reviewer details.",
        },
        { status: 400 }
      );
    }

    if (
      fullName.length > 100 ||
      email.length > 150 ||
      expertise.length > 200 ||
      qualification.length > 150
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more fields exceed their allowed length.",
        },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address." },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        {
          success: false,
          message: "Password must contain between 8 and 72 characters.",
        },
        { status: 400 }
      );
    }

    // Use the same bcrypt format as the login API.
    const passwordHash = await bcrypt.hash(password, 12);

    client = await pool.connect();

    await client.query("BEGIN");

    // Create reviewer login account.
    const userResult = await client.query(
      `INSERT INTO users
        (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'REVIEWER')
       RETURNING user_id, full_name, email, role`,
      [fullName, email, passwordHash]
    );

    const user = userResult.rows[0];

    // Create reviewer profile.
    const reviewerResult = await client.query(
      `INSERT INTO reviewers
        (user_id, expertise, qualification, experience_years, availability)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING reviewer_id, user_id, expertise,
                 qualification, experience_years, availability`,
      [
        user.user_id,
        expertise,
        qualification || null,
        experience,
      ]
    );

    await client.query("COMMIT");

    return NextResponse.json(
      {
        success: true,
        message: "Reviewer registered successfully!",
        reviewer: {
          ...reviewerResult.rows[0],
          reviewer_name: user.full_name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error("Reviewer transaction rollback error:", rollbackError);
      }
    }

    const dbError = error as { code?: string };

    if (dbError.code === "23505") {
      return NextResponse.json(
        {
          success: false,
          message: "This email address or reviewer assignment already exists.",
        },
        { status: 409 }
      );
    }

    console.error("Reviewer POST error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to register reviewer." },
      { status: 500 }
    );
  } finally {
    client?.release();
  }
}
