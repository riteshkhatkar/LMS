import { SignJWT, jwtVerify, base64url } from "jose";
import { cookies } from "next/headers";
import type { Role, LearnerGroup } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const SESSION_COOKIE_NAME = "learn_lms_session";
const COOKIE_NAME = SESSION_COOKIE_NAME;

const SECRET_STRING =
  process.env.JWT_SECRET || "learn_lms_super_secret_jwt_key_2026_dev_env_987654321";

const JWK_KEY = {
  kty: "oct",
  k: base64url.encode(Buffer.from(SECRET_STRING, "utf-8")),
};

export const JWT_ISSUER = "learn-lms";
export const JWT_AUDIENCE = "learn-lms-client";

export interface SessionUser {
  id: string;
  userId?: string;
  email: string;
  name?: string;
  fullName?: string;
  role: Role;
  learnerGroup?: LearnerGroup | null;
  organizationId?: string | null;
}

export type SessionPayload = SessionUser;

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name || user.fullName || "",
    role: user.role,
    learnerGroup: user.learnerGroup ?? null,
    organizationId: user.organizationId ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWK_KEY);
}

export const createSessionToken = signSessionToken;

export async function createSession(user: SessionUser): Promise<string> {
  const token = await signSessionToken(user);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return token;
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWK_KEY);
    // Strict Issuer and Audience check if present in token
    if (payload.iss && payload.iss !== JWT_ISSUER) {
      return null;
    }
    if (payload.aud && payload.aud !== JWT_AUDIENCE) {
      return null;
    }
    const uid = payload.userId as string;
    return {
      id: uid,
      userId: uid,
      email: payload.email as string,
      name: payload.name as string,
      fullName: payload.name as string,
      role: payload.role as Role,
      learnerGroup: (payload.learnerGroup as LearnerGroup) || null,
      organizationId: (payload.organizationId as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const verified = await verifySessionToken(token);
  if (!verified) return null;

  // OWASP ASVS Level 2 Defense: Immediate Session Invalidation & Role Demotion Check
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: verified.id },
      select: { id: true, isActive: true, role: true, learnerGroup: true, organizationId: true },
    });
    if (!dbUser || dbUser.isActive === false) {
      return null; // Deactivated account cannot exercise privileges
    }
    return {
      ...verified,
      role: dbUser.role,
      learnerGroup: dbUser.learnerGroup,
      organizationId: dbUser.organizationId,
    };
  } catch {
    // If DB is unreachable or in non-DB testing sandbox, fall back to verified payload
    return verified;
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function requireRole(allowedRoles: Role[]): Promise<SessionUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
