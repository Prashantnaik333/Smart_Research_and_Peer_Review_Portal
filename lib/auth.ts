
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";


const COOKIE_NAME = "researchhub_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or invalid");
  }

  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  userId: number;
  fullName: string;
  email: string;
  role: "STUDENT" | "REVIEWER" | "ADMIN" | "COORDINATOR";
};

const validRoles = [
  "STUDENT",
  "REVIEWER",
  "ADMIN",
  "COORDINATOR",
];

async function verifySessionToken(
  token?: string
): Promise<SessionUser | null> {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());

    if (
      typeof payload.userId !== "number" ||
      typeof payload.fullName !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.role !== "string" ||
      !validRoles.includes(payload.role)
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      fullName: payload.fullName,
      email: payload.email,
      role: payload.role as SessionUser["role"],
    };
  } catch {
    return null;
  }
}

// Create login session.
export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());

  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

// Read session using Next.js cookies().
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  return verifySessionToken(token);
}

// Read session directly from an incoming API request.
export async function getSessionFromRequest(
  request: Request
): Promise<SessionUser | null> {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");

  const sessionCookie = cookies.find((cookie) => {
    return cookie.trim().startsWith(`${COOKIE_NAME}=`);
  });

  const token = sessionCookie
    ? sessionCookie.trim().substring(COOKIE_NAME.length + 1)
    : undefined;

  return verifySessionToken(token);
}

// Destroy login session.
export async function destroySession() {
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
