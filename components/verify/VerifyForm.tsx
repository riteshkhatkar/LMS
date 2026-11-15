"use client";

import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Search, X, QrCode } from "lucide-react";

export interface VerifyFormProps {
  initialId?: string;
}

const DEMO_IDS = [
  "DEMO-VALID-001",
  "DEMO-GRADE-B-001",
  "DEMO-PASS-001",
  "DEMO-REVOKED-001",
  "DEMO-PENDING-001",
];

export function VerifyForm({ initialId = "" }: VerifyFormProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [certificateId, setCertificateId] = useState(initialId);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const cleaned = certificateId.trim().toUpperCase();
    if (!cleaned) {
      setError("Please enter a certificate ID.");
      return;
    }

    setError(null);
    setIsSubmitting(true);
    router.push(`/${locale}/verify/${encodeURIComponent(cleaned)}`);
  };

  const handleChipClick = (id: string) => {
    setCertificateId(id);
    setError(null);
    setIsSubmitting(true);
    router.push(`/${locale}/verify/${encodeURIComponent(id)}`);
  };

  const handleClear = () => {
    setCertificateId("");
    setError(null);
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-8">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label
            htmlFor="certificate-id-input"
            className="block text-sm font-semibold text-gray-900 mb-1.5"
          >
            Enter certificate ID
          </label>
          <div className="relative flex items-center rounded-lg shadow-xs">
            <input
              id="certificate-id-input"
              type="text"
              value={certificateId}
              onChange={(e) => {
                setCertificateId(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              placeholder="e.g. DEMO-VALID-001"
              aria-required="true"
              aria-invalid={!!error}
              aria-describedby={error ? "certificate-id-error" : "certificate-id-help"}
              className={`block w-full rounded-lg border px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB] focus:border-transparent uppercase font-mono transition-colors ${
                error ? "border-red-500 bg-red-50/30" : "border-gray-300 bg-white"
              } pr-20`}
            />

            <div className="absolute right-2 flex items-center gap-1">
              {certificateId && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Clear certificate ID"
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {error && (
            <p id="certificate-id-error" className="mt-1.5 text-sm text-red-600 font-medium" role="alert">
              {error}
            </p>
          )}

          <div id="certificate-id-help" className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <QrCode className="h-4 w-4 text-gray-400 shrink-0" aria-hidden="true" />
            <span>Or scan the QR code on your certificate using your device camera</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#3E9BDB] px-6 py-3 text-base font-semibold text-white shadow-xs hover:bg-[#3286bf] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3E9BDB] disabled:opacity-60 transition-colors cursor-pointer"
          >
            <Search className="h-4 w-4" />
            <span>{isSubmitting ? "Verifying..." : "Verify"}</span>
          </button>

          {certificateId && (
            <button
              type="button"
              onClick={handleClear}
              className="w-full sm:w-auto px-4 py-3 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Demo certificate IDs to try:
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO_IDS.map((demoId) => (
            <button
              key={demoId}
              type="button"
              onClick={() => handleChipClick(demoId)}
              className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-mono font-medium bg-[#EAF4FC] text-[#123E62] border border-[#3E9BDB]/30 hover:bg-[#3E9BDB]/20 hover:border-[#3E9BDB] transition-all cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]"
            >
              {demoId}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
