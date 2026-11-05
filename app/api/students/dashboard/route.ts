
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Student Dashboard API is working!",
    reviews: []
  });
}
