import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { logger } from "@/lib/logging";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/google/link
 * Links a Google account after verifying the user's password if unauthenticated,
 * or directly if authenticated.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const body = await request.json();
    const { email, password, googleSub, googleEmail } = body;

    let targetUserId = session?.id;

    if (!targetUserId) {
      if (!email || !password || !googleSub) {
        return NextResponse.json(
          { error: "Email, password, and Google identity are required" },
          { status: 400 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Invalid credentials" },
          { status: 401 }
        );
      }

      targetUserId = user.id;
    }

    // Check if Google sub is already linked to another account
    const existing = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: googleSub,
        },
      },
    });

    if (existing) {
      if (existing.userId !== targetUserId) {
        return NextResponse.json(
          { error: "This Google account is already linked to another Learn LMS user" },
          { status: 409 }
        );
      }
      return NextResponse.json({ message: "Google account already linked" });
    }

    await prisma.oAuthAccount.create({
      data: {
        userId: targetUserId,
        provider: "google",
        providerAccountId: googleSub,
        providerEmail: googleEmail || email,
      },
    });

    logger.info("OAUTH_ACCOUNT_LINKED", "User linked Google identity", {
      userId: targetUserId,
    });

    return NextResponse.json({ success: true, message: "Google account linked successfully" });
  } catch (err) {
    logger.error("OAUTH_LINK_FAILED", "Failed to link Google account", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Failed to link Google account" }, { status: 500 });
  }
}

/**
 * DELETE /api/auth/google/link
 * Unlinks Google identity. Only allowed if user has a password set!
 */
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: { oauthAccounts: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Security Rule: Cannot unlink the only authentication method!
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          error: "Cannot unlink Google authentication. You must configure a password first before unlinking your only sign-in method.",
        },
        { status: 400 }
      );
    }

    await prisma.oAuthAccount.deleteMany({
      where: {
        userId: user.id,
        provider: "google",
      },
    });

    logger.info("OAUTH_ACCOUNT_UNLINKED", "User unlinked Google identity", {
      userId: user.id,
    });

    return NextResponse.json({ success: true, message: "Google account unlinked successfully" });
  } catch (err) {
    logger.error("OAUTH_UNLINK_FAILED", "Failed to unlink Google account", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Failed to unlink Google account" }, { status: 500 });
  }
}
