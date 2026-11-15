import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Query counts of revoked certificates
  const revokedCerts = await prisma.certificate.findMany({
    where: { status: { in: ["REVOKED", "SUPERSEDED"] } },
    select: { id: true, revokedAt: true },
  });

  const statusListCredential = {
    "@context": [
      "https://www.w3.org/ns/credentials/v2",
      "https://w3id.org/vc/status-list/v1",
    ],
    id: `${baseUrl}/api/issuer/orelse/status-list`,
    type: ["VerifiableCredential", "StatusList2021Credential"],
    issuer: `${baseUrl}/issuer/orelse`,
    validFrom: new Date().toISOString(),
    credentialSubject: {
      id: `${baseUrl}/api/issuer/orelse/status-list#list`,
      type: "StatusList2021",
      statusPurpose: "revocation",
      encodedList: "H4sIC...", // GZIP/base64 representation
      revokedCount: revokedCerts.length,
      updatedAt: new Date().toISOString(),
    },
  };

  return NextResponse.json(statusListCredential, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300",
      "Content-Type": "application/vc+ld+json; charset=utf-8",
    },
  });
}
