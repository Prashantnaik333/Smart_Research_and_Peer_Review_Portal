import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import  pool from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const fullName = String(body.fullName || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (fullName.length > 100 || email.length > 150) {
      return NextResponse.json(
        { success: false, message: "Input is too long" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Enter a valid email address" },
        { status: 400 }
      );
    }

    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { success: false, message: "Password must be 8–72 characters" },
        { status: 400 }
      );
    }

    const existing = await pool.query(
      "SELECT user_id FROM users WHERE LOWER(email) = $1",
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, message: "Email is already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users
       (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'STUDENT')
       RETURNING user_id, full_name, email, role`,
      [fullName, email, passwordHash]
    );

    const user = result.rows[0];

    await createSession({
      userId: user.user_id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      message: "Student account created successfully",
      user,
    }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);

    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 }
    );
  }
}
