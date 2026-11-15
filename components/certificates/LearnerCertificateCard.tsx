"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Award, Download, CheckCircle2, ShieldCheck, ExternalLink, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CertificateData {
  id: string;
  courseTitle: string;
  issueDate: string;
  grade?: string | null;
  scorePercent?: number | null;
  status: string;
  provisional?: boolean;
  ledgerMode?: string;
  issuer?: string;
}

interface LearnerCertificateCardProps {
  certificate: CertificateData;
  locale: string;
}

export function LearnerCertificateCard({ certificate, locale }: LearnerCertificateCardProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = () => {
    setDownloading(true);
    window.location.href = `/api/certificates/${certificate.id}/download`;
    setTimeout(() => setDownloading(false), 2000);
  };

  const isRevoked = certificate.status === "REVOKED";

  return (
    <div className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md ${
      isRevoked ? "border-red-200" : "border-slate-200"
    }`}>
      <div className="p-6 space-y-4">
        {/* Header with ORELSE Logo & Status Pill */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/brand/orelse-logo.png"
              alt="ORELSE Logo"
              width={80}
              height={24}
              className="h-6 w-auto object-contain"
            />
            <span className="text-[11px] font-semibold text-slate-500">• Learn LMS</span>
          </div>

          <div>
            {isRevoked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                <AlertTriangle className="h-3.5 w-3.5" />
                Revoked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Credential
              </span>
            )}
          </div>
        </div>

        {/* Certificate Title & Course */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Certificate of Completion
          </div>
          <h3 className="text-lg font-bold text-[#1A1A2E] mt-0.5 line-clamp-1">
            {certificate.courseTitle}
          </h3>
        </div>

        {/* Score, Grade & Date Badge Grid */}
        <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Score</div>
            <div className="font-bold text-purple-700">
              {certificate.scorePercent ? `${certificate.scorePercent.toFixed(1)}%` : "—"}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Grade</div>
            <div className="font-bold text-slate-900">
              {certificate.grade || (certificate.provisional ? "Pass" : "Passed")}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 font-medium">Issued</div>
            <div className="font-bold text-slate-700 truncate">
              {certificate.issueDate.split("T")[0]}
            </div>
          </div>
        </div>

        {/* Certificate ID */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <span>ID: {certificate.id}</span>
          <span className="capitalize text-[10px] bg-slate-100 px-2 py-0.5 rounded-sm">
            {certificate.ledgerMode || "mock"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleDownload}
            disabled={downloading || isRevoked}
            className="flex-1 bg-[#3E9BDB] hover:bg-[#3286bf] text-white text-xs"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {downloading ? "Downloading..." : "Download PDF"}
          </Button>

          <Button
            as="a"
            href={`/${locale}/verify/${certificate.id}`}
            target="_blank"
            variant="secondary"
            size="sm"
            className="text-xs"
          >
            <span>Verify</span>
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ClaimCertificateCardProps {
  eligibilityId: string;
  courseId: string;
  courseTitle: string;
  finalScore: number;
  grade: string;
  completedAt: string;
  locale: string;
}

export function ClaimCertificateCard({
  courseId,
  courseTitle,
  finalScore,
  grade,
  completedAt,
  locale,
}: ClaimCertificateCardProps) {
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    setClaiming(true);
    setError(null);
    try {
      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue certificate");
      }
      // Reload page to reflect newly issued certificate
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setClaiming(false);
    }
  };

  return (
    <div className="bg-linear-to-br from-amber-50 to-white rounded-2xl border border-amber-200/80 p-6 shadow-xs space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900">
            <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
            <span>Eligible for Official Certificate</span>
          </div>
          <h3 className="text-base font-bold text-[#1A1A2E]">{courseTitle}</h3>
          <p className="text-xs text-slate-600">
            You completed all course lessons and passed the final assessment with a score of{" "}
            <strong>{finalScore.toFixed(1)}% ({grade})</strong>.
          </p>
        </div>

        <div className="shrink-0 w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
          <Award className="h-6 w-6" />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-lg text-xs">
          {error}
        </div>
      )}

      <div className="pt-2 border-t border-amber-100 flex items-center justify-end">
        <Button
          type="button"
          variant="primary"
          onClick={handleClaim}
          disabled={claiming}
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs"
        >
          {claiming ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              <span>Generating ORELSE Certificate...</span>
            </>
          ) : (
            <>
              <Award className="h-3.5 w-3.5 mr-1.5" />
              <span>Claim ORELSE Certificate</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
