import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getPublicJWKS } from "@/lib/certification/keys";
import { ShieldCheck, Key, ExternalLink, ArrowLeft, CheckCircle2, AlertTriangle, FileCode } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "ORELSE — Certificate Issuing Authority & Profile | Learn LMS",
    description: "Public verification key and credentialing profile for ORELSE on Learn LMS.",
  };
}

export default async function OrelseIssuerProfilePage({ params }: Props) {
  const { locale } = await params;
  const jwks = await getPublicJWKS();
  const primaryKey = jwks.keys[0];

  return (
    <div className="py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Back Link */}
        <div>
          <Link
            href={`/${locale}/verify`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3E9BDB] hover:text-[#3286bf]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Certificate Verification</span>
          </Link>
        </div>

        {/* Hero Card with ORELSE Corporate Branding */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-bl from-[#3E9BDB]/10 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF4FC] text-[#3E9BDB]">
                <ShieldCheck className="h-4 w-4" />
                <span>Authorized Digital Credential Issuer</span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#1A1A2E] tracking-tight">
                ORELSE
              </h1>
              <p className="text-sm text-slate-600 max-w-xl">
                ORELSE is the authorized certifying organization for <strong>Learn LMS</strong>, powering institutional digital learning credentials, competency assessments, and trusted blockchain anchoring.
              </p>
            </div>

            <div className="shrink-0 bg-white p-4 rounded-xl border border-slate-100 shadow-2xs">
              <Image
                src="/brand/orelse-logo.png"
                alt="ORELSE Logo"
                width={160}
                height={48}
                className="h-10 w-auto object-contain"
                priority
              />
            </div>
          </div>

          {/* Quick Profile Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Credential Programme</div>
              <div className="text-sm font-bold text-[#1A1A2E] mt-0.5">ORELSE Learning Certification</div>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Official Website</div>
              <a
                href="https://www.orelse.ai"
                target="_blank"
                rel="noreferrer"
                className="text-sm font-bold text-[#3E9BDB] hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                <span>www.orelse.ai</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
              <div className="text-[11px] font-bold text-slate-500 uppercase">Issuer Identifier</div>
              <div className="text-sm font-mono font-bold text-slate-700 mt-0.5">ORELSE-DEMO-ISSUER-001</div>
            </div>
          </div>
        </div>

        {/* Credential Issuance Criteria & Standards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-base font-bold text-[#1A1A2E]">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h2>Issuance Requirements</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every digital certificate issued by ORELSE adheres to strict institutional criteria:
            </p>
            <ul className="text-xs text-slate-700 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span><strong>100% Curriculum Fulfilled:</strong> All required video, PDF, and interactive lessons verified complete.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span><strong>Proctored Final Exam:</strong> Passed with server-calculated score strictly exceeding the course pass threshold (&gt;60%).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                <span><strong>Cryptographic Integrity:</strong> Signed using ORELSE&apos;s digital key pair and anchored in the configured ledger.</span>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-base font-bold text-[#1A1A2E]">
              <FileCode className="h-5 w-5 text-purple-600" />
              <h2>Standardized Formats</h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Issued credentials conform to global open interoperability standards:
            </p>
            <ul className="text-xs text-slate-700 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                <span><strong>W3C Verifiable Credentials 2.0:</strong> Structured JSON-LD payload with machine-readable metadata.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                <span><strong>1EdTech Open Badges 3.0:</strong> Comprehensive educational achievement schema.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-600 mt-1.5 shrink-0" />
                <span><strong>High-Resolution Vector PDF:</strong> Printable A4 landscape certificate with scannable QR verification code.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Public Cryptographic Verification Keys (JWKS) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-base font-bold text-[#1A1A2E]">
              <Key className="h-5 w-5 text-[#3E9BDB]" />
              <h2>Public Cryptographic Verification Keys (JWKS)</h2>
            </div>
            <Button as="a" href="/api/issuer/orelse/jwks" target="_blank" variant="secondary" size="sm" className="text-xs">
              <span>View Raw JWKS</span>
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          </div>

          <p className="text-xs text-slate-600">
            The public key below is used by automated verifiers and the public verification portal to mathematically validate digital signatures on ORELSE credentials.
          </p>

          <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto space-y-2">
            <div className="text-slate-400 text-[11px]">// Active Key: {primaryKey?.kid || "orelse-demo-key-2026-v1"}</div>
            <div>Algorithm: {primaryKey?.alg || "ES256"} (ECDSA NIST P-256)</div>
            <div>Curve: {primaryKey?.crv || "P-256"}</div>
            <div>Key Use: Signature Verification (sig)</div>
            <div className="pt-2 text-slate-400 text-[11px]">// Public Coordinates</div>
            <div className="truncate text-emerald-400">x: {primaryKey?.x || "..."}</div>
            <div className="truncate text-emerald-400">y: {primaryKey?.y || "..."}</div>
          </div>
        </div>

        {/* Demo Environment Disclosure */}
        <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-900">Demo Environment Disclosure</div>
            <p className="text-xs text-amber-800 leading-relaxed">
              This instance of Learn LMS is operating in a development and demonstration environment. Digital credentials issued herein use locally generated cryptographic key pairs and are recorded in MockLedger or local EVM testnets. These demo records represent functional software workflows and are not accredited government certifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
