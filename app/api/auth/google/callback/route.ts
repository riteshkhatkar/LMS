import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";
import { logger } from "@/lib/logging";
import {
  exchangeGoogleCode,
  verifyGoogleIdToken,
  type GoogleOAuthState,
} from "@/lib/auth/google";

export const dynamic = "force-dynamic";

const STATE_COOKIE_NAME = "learn_oauth_state";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const cookieStore = await cookies();
  const rawSavedState = cookieStore.get(STATE_COOKIE_NAME)?.value;
  cookieStore.delete(STATE_COOKIE_NAME);

  if (oauthError) {
    logger.warn("OAUTH_GOOGLE_ERROR", `Google authorization returned error: ${oauthError}`);
    return NextResponse.redirect(
      new URL(`/en/login?error=google_cancelled`, request.url)
    );
  }

  if (!code || !state || !rawSavedState) {
    logger.warn("OAUTH_GOOGLE_INVALID", "Missing code, state, or state cookie");
    return NextResponse.redirect(
      new URL(`/en/login?error=invalid_oauth_state`, request.url)
    );
  }

  let savedState: GoogleOAuthState;
  try {
    savedState = JSON.parse(rawSavedState);
  } catch {
    return NextResponse.redirect(
      new URL(`/en/login?error=invalid_oauth_state`, request.url)
    );
  }

  if (savedState.state !== state) {
    logger.security("OAUTH_STATE_MISMATCH", "OAuth state token mismatch detected");
    return NextResponse.redirect(
      new URL(`/en/login?error=state_mismatch`, request.url)
    );
  }

  if (Date.now() - savedState.createdAt > 1000 * 60 * 10) {
    logger.warn("OAUTH_STATE_EXPIRED", "OAuth transaction expired");
    return NextResponse.redirect(
      new URL(`/en/login?error=oauth_timeout`, request.url)
    );
  }

  try {
    // 1. Exchange code for Google ID token via PKCE
    const tokenResponse = await exchangeGoogleCode({
      code,
      codeVerifier: savedState.codeVerifier,
    });

    // 2. Cryptographically verify Google ID Token with Google JWKS
    const claims = await verifyGoogleIdToken(tokenResponse.id_token, {
      nonce: savedState.nonce,
    });

    if (!claims.email_verified) {
      logger.security("OAUTH_UNVERIFIED_EMAIL", "Google account email is not verified", {
        email: claims.email,
      });
      return NextResponse.redirect(
        new URL(`/en/login?error=unverified_email`, request.url)
      );
    }

    // 3. Check for existing linked OAuth Account
    const existingOAuth = await prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "google",
          providerAccountId: claims.sub,
        },
      },
      include: {
        user: true,
      },
    });

    if (existingOAuth) {
      const user = existingOAuth.user;

      // Check account active status
      if (user.isActive === false) {
        logger.security("AUTH_DEACTIVATED_ATTEMPT", "Deactivated user attempted Google login", {
          userId: user.id,
        });
        return NextResponse.redirect(
          new URL(`/en/login?error=account_deactivated`, request.url)
        );
      }

      // Update provider email snapshot if changed
      if (existingOAuth.providerEmail !== claims.email) {
        await prisma.oAuthAccount.update({
          where: { id: existingOAuth.id },
          data: { providerEmail: claims.email },
        });
      }

      // Create authenticated session
      await createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        learnerGroup: user.learnerGroup,
        organizationId: user.organizationId,
      });

      logger.info("AUTH_GOOGLE_SUCCESS", "Existing user logged in via Google", {
        userId: user.id,
        role: user.role,
      });

      // Role-specific redirect
      if (user.role === "ADMIN") {
        return NextResponse.redirect(new URL("/en/admin", request.url));
      } else if (user.role === "INSTRUCTOR") {
        return NextResponse.redirect(new URL("/en/instructor", request.url));
      }
      return NextResponse.redirect(new URL("/en/learn/my-learning", request.url));
    }

    // 4. Collision check: Does an unlinked User with this email exist?
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: claims.email },
    });

    if (existingEmailUser) {
      // Security Policy: Never silently link unlinked accounts based on email alone
      logger.security("OAUTH_ACCOUNT_COLLISION", "Google email matches existing unlinked user account", {
        email: claims.email,
        existingUserId: existingEmailUser.id,
        existingRole: existingEmailUser.role,
      });
      return NextResponse.redirect(
        new URL(
          `/en/login?error=account_exists_link_required&email=${encodeURIComponent(claims.email)}`,
          request.url
        )
      );
    }

    // 5. New User Creation: Always assign LEARNER role strictly
    const newUser = await prisma.user.create({
      data: {
        email: claims.email,
        name: claims.name || claims.given_name || "Learner",
        role: "LEARNER", // Strict enforcement: Google logins start as LEARNER
        isActive: true,
        oauthAccounts: {
          create: {
            provider: "google",
            providerAccountId: claims.sub,
            providerEmail: claims.email,
          },
        },
      },
    });

    // Create authenticated session
    await createSession({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      learnerGroup: newUser.learnerGroup,
      organizationId: newUser.organizationId,
    });

    logger.info("AUTH_GOOGLE_REGISTER", "New learner registered via Google OAuth", {
      userId: newUser.id,
    });

    return NextResponse.redirect(new URL("/en/learn/my-learning", request.url));
  } catch (err) {
    logger.error("OAUTH_CALLBACK_FAILED", "Google OAuth callback processing failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.redirect(
      new URL(`/en/login?error=oauth_exchange_failed`, request.url)
    );
  }
}
