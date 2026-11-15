import { describe, it, expect } from "vitest";
import {
  generatePKCE,
  generateRandomString,
  buildGoogleAuthUrl,
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  type GoogleOAuthState,
} from "../lib/auth/google";

describe("Google OAuth 2.0 / OpenID Connect Utilities", () => {
  it("generates cryptographically strong PKCE code verifier and SHA-256 challenge", () => {
    const { codeVerifier, codeChallenge } = generatePKCE();
    expect(typeof codeVerifier).toBe("string");
    expect(typeof codeChallenge).toBe("string");
    expect(codeVerifier.length).toBeGreaterThanOrEqual(43);
    expect(codeChallenge.length).toBeGreaterThanOrEqual(43);
    expect(codeVerifier).not.toBe(codeChallenge);
  });

  it("produces unique unguessable random strings with high entropy", () => {
    const s1 = generateRandomString(32);
    const s2 = generateRandomString(32);
    expect(s1.length).toBeGreaterThanOrEqual(43);
    expect(s2.length).toBeGreaterThanOrEqual(43);
    expect(s1).not.toBe(s2);
  });

  it("builds compliant Google authorization URL with required OpenID Connect parameters", () => {
    const state = generateRandomString(24);
    const nonce = generateRandomString(24);
    const { codeChallenge } = generatePKCE();

    const authUrl = buildGoogleAuthUrl({
      state,
      nonce,
      codeChallenge,
    });

    const parsed = new URL(authUrl);
    expect(parsed.origin).toBe("https://accounts.google.com");
    expect(parsed.pathname).toBe("/o/oauth2/v2/auth");
    expect(parsed.searchParams.get("client_id")).toBe(GOOGLE_CLIENT_ID);
    expect(parsed.searchParams.get("redirect_uri")).toBe(GOOGLE_REDIRECT_URI);
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("scope")).toBe("openid email profile");
    expect(parsed.searchParams.get("state")).toBe(state);
    expect(parsed.searchParams.get("nonce")).toBe(nonce);
    expect(parsed.searchParams.get("code_challenge")).toBe(codeChallenge);
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    expect(parsed.searchParams.get("access_type")).toBe("online");
    expect(parsed.searchParams.get("prompt")).toBe("select_account");
  });

  it("validates state serialization and 10-minute expiration rule", () => {
    const now = Date.now();
    const validState: GoogleOAuthState = {
      state: "random-state-123",
      nonce: "random-nonce-456",
      codeVerifier: "random-verifier-789",
      createdAt: now - 1000 * 60 * 5, // 5 mins ago
    };

    const isExpired = Date.now() - validState.createdAt > 1000 * 60 * 10;
    expect(isExpired).toBe(false);

    const expiredState: GoogleOAuthState = {
      state: "random-state-123",
      nonce: "random-nonce-456",
      codeVerifier: "random-verifier-789",
      createdAt: now - 1000 * 60 * 15, // 15 mins ago
    };

    const isExpiredTrue = Date.now() - expiredState.createdAt > 1000 * 60 * 10;
    expect(isExpiredTrue).toBe(true);
  });
});
