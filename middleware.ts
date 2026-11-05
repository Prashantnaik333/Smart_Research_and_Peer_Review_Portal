
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "researchhub_session";

type Role =
  | "STUDENT"
  | "REVIEWER"
  | "ADMIN"
  | "COORDINATOR";

const allowedRoles: Role[] = [
  "STUDENT",
  "REVIEWER",
  "ADMIN",
  "COORDINATOR",
];

// ==========================================
// PAGE PERMISSIONS
// ==========================================

const permissions: Record<string, Role[]> = {
  // Dashboard
  "/": [
    "STUDENT",
    "REVIEWER",
    "ADMIN",
    "COORDINATOR",
  ],

  // Student manuscript submission
  "/submit": [
    "STUDENT",
    "ADMIN",
    "COORDINATOR",
  ],

  // Manuscripts
  "/manuscripts": [
    "STUDENT",
    "REVIEWER",
    "ADMIN",
    "COORDINATOR",
  ],

  // Reviewer management
  "/reviewers": [
    "ADMIN",
    "COORDINATOR",
  ],

  // Peer review management
  "/reviews": [
    "REVIEWER",
    "ADMIN",
    "COORDINATOR",
  ],

  // Assignments
  "/assignments": [
    "REVIEWER",
    "ADMIN",
    "COORDINATOR",
  ],

  // Discussions
  "/discussions": [
    "STUDENT",
    "REVIEWER",
    "ADMIN",
    "COORDINATOR",
  ],

  // Reports and analytics
  "/reports": [
    "ADMIN",
    "COORDINATOR",
  ],
};

// ==========================================
// API PERMISSIONS
// ==========================================

const apiPermissions: Record<string, Role[]> = {
  // Manuscripts
  "/api/manuscripts": [
    "STUDENT",
    "REVIEWER",
    "ADMIN",
    "COORDINATOR",
  ],

  // Reviewer management
  "/api/reviewers": [
    "ADMIN",
    "COORDINATOR",
  ],

  // Assignments
  "/api/assignments": [
    "STUDENT",
    "REVIEWER",
    "ADMIN",
    "COORDINATOR",
  ],

  // Reviews
  // The API route must perform its own GET/POST authorization.
  "/api/reviews": [
    "STUDENT",
    "REVIEWER",
    "ADMIN",
    "COORDINATOR",
  ],

  // Discussions
  "/api/discussions": [
    "STUDENT",
    "REVIEWER",
    "ADMIN",
    "COORDINATOR",
  ],

  // Database connection status
  "/api/database-status": [
    "STUDENT",
    "REVIEWER",
    "ADMIN",
    "COORDINATOR",
  ],

  // Analytics
  "/api/analytics": [
    "ADMIN",
    "COORDINATOR",
  ],

  // Student management
  "/api/students": [
    "ADMIN",
    "COORDINATOR",
  ],

  // Database testing
  "/api/test-postgres": [
    "ADMIN",
    "COORDINATOR",
  ],

  "/api/test-mongodb": [
    "ADMIN",
    "COORDINATOR",
  ],
};

// ==========================================
// MIDDLEWARE
// ==========================================

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow public pages and authentication APIs.
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth/")
  ) {
    return NextResponse.next();
  }

  const isApi = pathname.startsWith("/api/");

  // 2. Read authentication cookie.
  const cookie = request.cookies.get(COOKIE_NAME)?.value;

  if (!cookie) {
    if (isApi) {
      return NextResponse.json(
        {
          success: false,
          message: "Authentication required.",
        },
        { status: 401 }
      );
    }

    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  let role: Role;

  // 3. Verify JWT session.
  try {
    const secret = process.env.AUTH_SECRET;

    if (!secret || secret.length < 32) {
      throw new Error("AUTH_SECRET is missing or invalid.");
    }

    const { payload } = await jwtVerify(
      cookie,
      new TextEncoder().encode(secret)
    );

    if (
      typeof payload.role !== "string" ||
      !allowedRoles.includes(payload.role as Role)
    ) {
      throw new Error("Invalid session role.");
    }

    role = payload.role as Role;
  } catch {
    if (isApi) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or expired session.",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.redirect(
      new URL("/login", request.url)
    );

    response.cookies.delete(COOKIE_NAME);

    return response;
  }

  // 4. Check API permissions.
  if (isApi) {
    const requiredRoles = apiPermissions[pathname];

    if (
      requiredRoles &&
      !requiredRoles.includes(role)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorized.",
        },
        { status: 403 }
      );
    }

    // API handlers must also verify authorization.
    return NextResponse.next();
  }

  // 5. Check page permissions.
  const requiredRoles = permissions[pathname];

  if (
    requiredRoles &&
    !requiredRoles.includes(role)
  ) {
    return NextResponse.redirect(
      new URL("/", request.url)
    );
  }

  return NextResponse.next();
}

// ==========================================
// MIDDLEWARE MATCHER
// ==========================================

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
