import { NextResponse } from "next/server";
import { getPublicJWKS } from "@/lib/certification/keys";

export async function GET() {
  try {
    const jwks = await getPublicJWKS();
    return NextResponse.json(jwks, {
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("JWKS retrieval error:", error);
    return NextResponse.json({ error: "Failed to retrieve public keys" }, { status: 500 });
  }
}
