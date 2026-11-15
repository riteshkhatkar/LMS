import React from "react";
import Link from "next/link";
import type { ExtendedVerifyResult } from "@/lib/certification/verification";
import { DemoBanner } from "@/components/ui/DemoBanner";
import {
  CheckCircle2,
  XCircle,
  Search,
  Clock,
  AlertTriangle,
  Award,
  Calendar,
  Building,
  FileCheck,
  ShieldCheck,
  ExternalLink,
  Lock,
} from "lucide-react";

export interface VerifyResultProps {
  result: ExtendedVerifyResult;
}

export function VerifyResult({ result }: VerifyResultProps) {
  const renderStatusCard = () => {
    switch (result.status) {
      case "VALID":
        return (
          <div className="rounded-xl border border-green-200 bg-green-50/50 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-green-100 p-2.5 text-green-700 shrink-0">
                <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 uppercase tracking-wide">
                    Valid Certificate
                  </span>
                  {result.signatureValid && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                      <ShieldCheck className="h-3 w-3" />
                      ES256 Signature Verified
                    </span>
                  )}
                </div>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Certificate is valid
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  This official digital credential was issued by ORELSE and verified against the institutional registry.
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-green-200/70 pt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
                Certificate Details
              </h3>
              <dl className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-6">
                <div>
                  <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <FileCheck className="h-3.5 w-3.5 text-gray-400" />
                    Certificate ID
                  </dt>
                  <dd className="mt-1 text-sm font-mono font-semibold text-gray-900 break-all">
                    {result.certificateId || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Building className="h-3.5 w-3.5 text-gray-400" />
                    Issuing Authority
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                    <span>{result.issuer || "ORELSE"}</span>
                    <Link
                      href="/en/issuer/orelse"
                      className="text-xs text-[#3E9BDB] hover:underline inline-flex items-center gap-0.5 font-normal"
                    >
                      <span>(Issuer Profile)</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-gray-400" />
                    Course
                  </dt>
                  <dd className="mt-1 text-base font-semibold text-gray-900">
                    {result.courseName || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    Issue Date
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">
                    {result.issueDate || "—"}
                  </dd>
                </div>

                {result.grade && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500">Grade</dt>
                    <dd className="mt-1">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-100 text-blue-800">
                        {result.grade}
                      </span>
                    </dd>
                  </div>
                )}

                <div>
                  <dt className="text-xs font-medium text-gray-500">Outcome</dt>
                  <dd className="mt-1">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold bg-green-100 text-green-800">
                      {result.outcome || "Pass"}
                    </span>
                    {result.scorePercent !== undefined && result.scorePercent !== null && (
                      <span className="ml-2 text-xs font-mono text-gray-500">
                        ({result.scorePercent.toFixed(1)}%)
                      </span>
                    )}
                  </dd>
                </div>
              </dl>

              {result.provisional && (
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Provisional Result: Passed meeting completion threshold. Grade classification is subject to final institutional policy confirmation.</span>
                </div>
              )}
            </div>
          </div>
        );

      case "SUPERSEDED":
        return (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-100 p-2.5 text-amber-700 shrink-0">
                <AlertTriangle className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 uppercase tracking-wide">
                  Superseded
                </span>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Certificate has been superseded
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  This credential was replaced by a reissued certificate. Historical audit record is preserved.
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-amber-200/70 pt-6 space-y-4">
              {result.revocationReason && (
                <div className="rounded-lg bg-white border border-amber-200 p-4">
                  <p className="text-xs font-semibold uppercase text-amber-700 tracking-wider">
                    Supercession Notes
                  </p>
                  <p className="mt-1 text-sm text-gray-800">
                    {result.revocationReason}
                  </p>
                </div>
              )}

              <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-6">
                <div>
                  <dt className="text-xs font-medium text-gray-500">Original Certificate ID</dt>
                  <dd className="mt-1 text-sm font-mono font-medium text-gray-900">
                    {result.certificateId || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500">Course</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">
                    {result.courseName || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        );

      case "REVOKED":
        return (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-100 p-2.5 text-red-700 shrink-0">
                <XCircle className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 uppercase tracking-wide">
                  Revoked
                </span>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Certificate has been revoked
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  This certificate was previously issued but has been formally marked as revoked by ORELSE.
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-red-200/70 pt-6 space-y-4">
              {result.revocationReason && (
                <div className="rounded-lg bg-white border border-red-200 p-4">
                  <p className="text-xs font-semibold uppercase text-red-600 tracking-wider">
                    Revocation Reason
                  </p>
                  <p className="mt-1 text-sm text-gray-800">
                    {result.revocationReason}
                  </p>
                </div>
              )}

              <dl className="grid grid-cols-1 gap-y-3 sm:grid-cols-2 sm:gap-x-6">
                <div>
                  <dt className="text-xs font-medium text-gray-500">Certificate ID</dt>
                  <dd className="mt-1 text-sm font-mono font-medium text-gray-900">
                    {result.certificateId || "—"}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium text-gray-500">Course</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">
                    {result.courseName || "—"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        );

      case "NOT_FOUND":
        return (
          <div className="rounded-xl border border-gray-200 bg-white p-6 sm:p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <Search className="h-7 w-7" aria-hidden="true" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Certificate not found
            </h2>
            <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
              No matching digital credential was found for identifier{" "}
              <span className="font-mono font-semibold text-gray-900">{result.certificateId}</span>. Please verify the ID or QR code and try again.
            </p>
          </div>
        );

      case "PENDING":
        return (
          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-amber-100 p-2.5 text-amber-700 shrink-0">
                <Clock className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 uppercase tracking-wide">
                  Pending Confirmation
                </span>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Certificate processing pending
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  This certificate has been generated and is awaiting blockchain ledger anchor confirmation.
                </p>
              </div>
            </div>
          </div>
        );

      case "VERIFY_ERROR":
      default:
        return (
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-red-100 p-2.5 text-red-700 shrink-0">
                <AlertTriangle className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 uppercase tracking-wide">
                  Integrity Verification Error
                </span>
                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  Verification failed
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  The digital signature or data commitment of this credential could not be authenticated.
                </p>
              </div>
            </div>
          </div>
        );
    }
  };

  const getLedgerBannerMessage = () => {
    if (result.ledgerMode === "local_evm") {
      return "Local EVM Blockchain Mode — Anchored to local development smart contract. Not on a public mainnet.";
    }
    if (result.ledgerMode === "public_testnet") {
      return "Polygon Amoy Public Testnet Mode — Anchored on testnet ledger. Test network only.";
    }
    return "Demo verification — MockLedger mode. Not anchored on a public blockchain.";
  };

  return (
    <div className="space-y-6">
      <DemoBanner
        message={getLedgerBannerMessage()}
        variant={result.ledgerMode === "public_testnet" ? "demo" : "mock-ledger"}
      />
      {renderStatusCard()}

      {/* Ledger Provenance Card */}
      {result.status !== "NOT_FOUND" && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-[#3E9BDB]" />
              <span>Ledger Provenance &amp; Verification Mode</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px]">
              {result.ledgerMode || "mock"}
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            {result.ledgerLabel}
          </p>

          {result.txHash && (
            <div className="pt-2 border-t border-slate-100 text-xs font-mono text-slate-600 break-all">
              <span className="text-slate-400 font-sans">Tx Hash: </span>{result.txHash}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
