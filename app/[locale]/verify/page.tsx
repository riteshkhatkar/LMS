import type { Metadata } from "next";
import { VerifyForm } from "@/components/verify/VerifyForm";
import { ShieldCheck, Lock, CheckCircle, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Verify a Course Certificate | Learn LMS",
  description: "Enter a certificate ID or scan the QR code to verify an authentic Learn LMS credential.",
  robots: {
    index: true,
    follow: true,
  },
};

export default async function VerifyPage() {
  return (
    <div className="py-12 sm:py-16 bg-gray-50/50 min-h-[calc(100vh-160px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF4FC] text-[#123E62] border border-[#3E9BDB]/30 mb-4">
            <ShieldCheck className="h-4 w-4 text-[#3E9BDB]" />
            <span>Official Credential Verification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A2E] tracking-tight">
            Verify a Course Certificate
          </h1>
          <p className="mt-3 text-base sm:text-lg text-gray-600">
            Enter a certificate ID or scan the QR code on a Learn LMS certificate.
          </p>
        </div>

        {/* Verification Form */}
        <VerifyForm />

        {/* What verification checks */}
        <div className="mt-16 max-w-2xl mx-auto border-t border-gray-200 pt-10">
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-6 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#1F9E94]" />
            What the verification checks
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-lg border border-gray-200/80 shadow-2xs">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#3E9BDB]" />
                Issuer Authenticity
              </h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Confirms the certificate was issued by an authorized Learn LMS organization or training programme partner.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200/80 shadow-2xs">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Lock className="h-4 w-4 text-[#3E9BDB]" />
                Tamper-Resistant Records
              </h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Validates the certificate record against the ledger to guarantee that course titles, dates, and grades have not been altered.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200/80 shadow-2xs">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-[#3E9BDB]" />
                Active Revocation Status
              </h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Checks that the credential has not expired, been replaced, or been revoked by administrators for compliance or review reasons.
              </p>
            </div>

            <div className="bg-white p-5 rounded-lg border border-gray-200/80 shadow-2xs">
              <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#3E9BDB]" />
                Privacy Safeguards
              </h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Verification displays course outcomes and credentials without exposing private learner personal identifiable information (PII).
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-lg bg-[#EAF4FC] border border-[#3E9BDB]/20 text-xs text-[#123E62] leading-relaxed">
            <span className="font-semibold">Note on ledger mode: </span>
            Learn LMS operates in MockLedger demo mode in this preview environment. Sample certificate IDs test validation pathways without contacting external blockchains.
          </div>
        </div>
      </div>
    </div>
  );
}
