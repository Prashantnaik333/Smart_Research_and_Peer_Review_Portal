import {
  connection,
  NextRequest,
  NextResponse,
} from "next/server";

import pool from "@/lib/db";
import clientPromise from "@/lib/mongodb";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  await connection();

  // Authentication check
  const session = await getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json(
      { success: false, message: "Please log in first." },
      { status: 401 }
    );
  }

  // Check PostgreSQL independently
  let postgresConnected = false;

  try {
    await pool.query("SELECT 1");
    postgresConnected = true;
  } catch (error) {
    console.error("PostgreSQL health check failed:", error);
  }

  // Check MongoDB independently
  let mongodbConnected = false;

  try {
    const databaseName = process.env.MONGODB_DATABASE;

    if (!databaseName) {
      throw new Error("MONGODB_DATABASE is not configured.");
    }

    const client = await clientPromise;
    const database = client.db(databaseName);

    await database.command({ ping: 1 });

    mongodbConnected = true;
  } catch (error) {
    console.error("MongoDB health check failed:", error);
  }

  return NextResponse.json({
    success: true,
    postgres: {
      connected: postgresConnected,
      status: postgresConnected ? "Connected" : "Disconnected",
    },
    mongodb: {
      connected: mongodbConnected,
      status: mongodbConnected ? "Connected" : "Disconnected",
    },
  });
}