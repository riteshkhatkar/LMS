import type { Metadata } from "next";
import Link from "next/link";
import { verifyCertificateById } from "@/lib/certification/verification";
import { VerifyResult } from "@/components/verify/VerifyResult";
import { ArrowLeft, ShieldAlert } from "lucide-react";

interface Props {
  params: Promise<{
    locale: string;
    certificateId: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { certificateId } = await params;
  return {
    title: `Certificate Verification - ${certificateId} | Learn LMS`,
    description: "Certificate verification outcome record.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function CertificateResultPage({ params }: Props) {
  const { locale, certificateId } = await params;
  const decodedId = decodeURIComponent(certificateId);
  const result = await verifyCertificateById(decodedId);

  return (
    <div className="py-12 sm:py-16 bg-gray-50/50 min-h-[calc(100vh-160px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation back */}
        <div className="max-w-2xl mx-auto mb-6 flex items-center justify-between">
          <Link
            href={`/${locale}/verify`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3E9BDB] hover:text-[#3286bf] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Verify another certificate</span>
          </Link>
          <span className="text-xs font-mono text-gray-500 uppercase">
            ID: {decodedId}
          </span>
        </div>

        {/* Verification Result */}
        <VerifyResult result={result} />

        {/* Action & Privacy Note */}
        <div className="max-w-2xl mx-auto mt-8 space-y-4">
          <div className="flex items-center justify-center">
            <Link
              href={`/${locale}/verify`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Verify another certificate</span>
            </Link>
          </div>

          <div className="p-4 rounded-lg bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 leading-relaxed">
              <span className="font-semibold">Privacy notice: </span>
              Certificate-specific URLs should not be shared publicly as they may contain identifiable record information. In production, public verifications show minimum-necessary details to prevent unsolicited identity harvesting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
