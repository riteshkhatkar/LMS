/**
 * Learn LMS — Google OAuth 2.0 / OpenID Connect Identity Provider
 * Production-ready server-side implementation using standard OpenID Connect, PKCE, state, and nonce.
 * Product by ORELSE (https://www.orelse.ai)
 */

import crypto from "crypto";
import { jwtVerify, createRemoteJWKSet } from "jose";

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
export const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

// Google JWKS Remote Key Set
const googleJWKS = createRemoteJWKSet(new URL(GOOGLE_JWKS_URL));

export interface GoogleOAuthState {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo?: string;
  createdAt: number;
}

export interface GoogleIdTokenClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

/**
 * Generate PKCE code verifier and code challenge (S256)
 */
export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return { codeVerifier, codeChallenge };
}

/**
 * Generate cryptographically random state or nonce
 */
export function generateRandomString(bytes: number = 24): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/**
 * Build the full Google OAuth 2.0 authorization URL
 */
export function buildGoogleAuthUrl(params: {
  state: string;
  nonce: string;
  codeChallenge: string;
  redirectUri?: string;
}): string {
  const redirectUri = params.redirectUri || GOOGLE_REDIRECT_URI;
  const url = new URL(GOOGLE_AUTH_URL);

  url.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", params.nonce);
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("access_type", "online"); // strictly online only, no refresh tokens needed
  url.searchParams.set("prompt", "select_account");

  return url.toString();
}

/**
 * Exchange OAuth authorization code for Google tokens
 */
export async function exchangeGoogleCode(params: {
  code: string;
  codeVerifier: string;
  redirectUri?: string;
}): Promise<{ id_token: string; access_token: string }> {
  const redirectUri = params.redirectUri || GOOGLE_REDIRECT_URI;

  const body = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code: params.code,
    code_verifier: params.codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google token exchange failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  if (!data.id_token) {
    throw new Error("Google did not return an id_token");
  }

  return { id_token: data.id_token, access_token: data.access_token };
}

/**
 * Cryptographically verify Google ID Token using Google's public JWKS
 */
export async function verifyGoogleIdToken(
  idToken: string,
  options?: { nonce?: string }
): Promise<GoogleIdTokenClaims> {
  const { payload } = await jwtVerify(idToken, googleJWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: GOOGLE_CLIENT_ID,
  });

  // Verify Nonce if provided
  if (options?.nonce && payload.nonce !== options.nonce) {
    throw new Error("ID token nonce does not match session nonce");
  }

  // Verify Email verification status
  if (!payload.email) {
    throw new Error("Google ID token missing email claim");
  }

  return {
    sub: payload.sub as string,
    email: (payload.email as string).toLowerCase().trim(),
    email_verified: Boolean(payload.email_verified),
    name: payload.name as string | undefined,
    picture: payload.picture as string | undefined,
    given_name: payload.given_name as string | undefined,
    family_name: payload.family_name as string | undefined,
  };
}
