import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  generatePKCE,
  generateRandomString,
  buildGoogleAuthUrl,
  type GoogleOAuthState,
} from "@/lib/auth/google";

export const dynamic = "force-dynamic";

const STATE_COOKIE_NAME = "learn_oauth_state";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const returnTo = searchParams.get("returnTo") || "/en/learn/my-learning";

  const state = generateRandomString(24);
  const nonce = generateRandomString(24);
  const { codeVerifier, codeChallenge } = generatePKCE();

  const authState: GoogleOAuthState = {
    state,
    nonce,
    codeVerifier,
    returnTo,
    createdAt: Date.now(),
  };

  const authUrl = buildGoogleAuthUrl({
    state,
    nonce,
    codeChallenge,
  });

  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE_NAME, JSON.stringify(authState), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10, // 10 minutes
  });

  return NextResponse.redirect(authUrl);
}
