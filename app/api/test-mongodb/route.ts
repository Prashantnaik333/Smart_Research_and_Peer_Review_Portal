import {
  connection,
  NextRequest,
  NextResponse,
} from "next/server";

import clientPromise from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  // Wait for the incoming request.
  await connection();

  try {
    // 1. Verify authenticated session.
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

    // 2. Only ADMIN and COORDINATOR can access this endpoint.
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

    // 3. Connect to MongoDB.
    const client = await clientPromise;

    const databaseName = process.env.MONGODB_DATABASE;

    if (!databaseName) {
      throw new Error("MONGODB_DATABASE is not configured.");
    }

    const database = client.db(databaseName);

    // 4. Check MongoDB connection.
    await database.command({ ping: 1 });

    // 5. Count total discussions.
    const totalDiscussions = await database
      .collection("review_discussions")
      .countDocuments();

    // 6. Return connection information.
    return NextResponse.json({
      success: true,
      message: "MongoDB connected successfully!",
      database: database.databaseName,
      totalDiscussions,
    });
  } catch (error) {
    console.error("MongoDB connection error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "MongoDB connection failed.",
      },
      { status: 500 }
    );
  }
}