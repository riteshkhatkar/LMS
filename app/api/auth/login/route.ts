import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/auth/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    const body = await request.json();
    const { email, password } = body;

    // Dual-Key Rate Limiting:
    // Key 1: 60 attempts per minute per IP to mitigate network-level brute-force/DDoS
    const ipRateCheck = checkRateLimit(`login-ip-${ip}`, 60, 60000);
    if (!ipRateCheck.success) {
      return NextResponse.json(
        { error: "Too many login attempts from this network. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(ipRateCheck.resetSeconds),
          },
        }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Key 2: 10 attempts per minute per account to prevent distributed credential stuffing
    const accountRateCheck = checkRateLimit(`login-account-${normalizedEmail}`, 10, 60000);
    if (!accountRateCheck.success) {
      return NextResponse.json(
        { error: "Too many login attempts for this account. Please wait before retrying." },
        {
          status: 429,
          headers: {
            "Retry-After": String(accountRateCheck.resetSeconds),
          },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Account deactivation defense
    if (user.isActive === false) {
      return NextResponse.json(
        { error: "This account has been deactivated. Please contact an administrator." },
        { status: 403 }
      );
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Set authenticated session cookie
    await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      learnerGroup: user.learnerGroup,
      organizationId: user.organizationId,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        learnerGroup: user.learnerGroup,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
