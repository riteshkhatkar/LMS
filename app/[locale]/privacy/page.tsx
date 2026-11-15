import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { ShieldCheck, Lock, Eye, FileText, Scale } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | Learn LMS",
  description: "Privacy policy, data collection principles, and credential verification privacy standards for Learn LMS.",
  robots: {
    index: true,
    follow: true,
  },
};

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="py-12 sm:py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="border-b border-gray-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF4FC] text-[#123E62] border border-[#3E9BDB]/30 mb-4">
            <ShieldCheck className="h-4 w-4 text-[#3E9BDB]" />
            <span>Data Protection & Privacy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A2E] tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Last updated: November 2026 • Demo Release
          </p>
        </div>

        {/* Legal Draft Notice */}
        <DemoBanner
          variant="warning"
          message="This policy is a draft placeholder. Final version requires formal legal review before launch. Reference to India's Digital Personal Data Protection (DPDP) Act 2023 applicability pending legal review."
        />

        {/* 1. Introduction */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2">
            <Scale className="h-5 w-5 text-[#3E9BDB]" />
            1. Overview & Commitment
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {brand.name} ("we", "our", or "the Platform") is committed to protecting the personal information of learners, instructors, FPO representatives, and institutional administrators. This Privacy Policy outlines what information we collect, how it is processed, and how your privacy rights are safeguarded under applicable data protection principles, including India's Digital Personal Data Protection (DPDP) Act 2023.
          </p>
        </section>

        {/* 2. Data We Collect */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#1F9E94]" />
            2. Information We Collect
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <strong className="block text-gray-900 font-semibold mb-1">
                A. Account & Registration Data (Phase 2+)
              </strong>
              <p className="text-xs text-gray-600 leading-relaxed">
                When learner registration is active, we collect: full name, email address, password hash, preferred language, learner group affiliation (e.g. FPO member, FPC employee, naval officer), and organizational affiliation.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <strong className="block text-gray-900 font-semibold mb-1">
                B. Learning Progress & Assessment Data
              </strong>
              <p className="text-xs text-gray-600 leading-relaxed">
                Module completion logs, video playback progress, quiz attempt scores, time spent per lesson, and final assessment grades required to determine certificate eligibility.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
              <strong className="block text-gray-900 font-semibold mb-1">
                C. Credential & Certificate Records
              </strong>
              <p className="text-xs text-gray-600 leading-relaxed">
                Unique certificate identifiers, issue timestamps, issuer identifiers, and grade outcomes recorded in the verification ledger.
              </p>
            </div>
          </div>
        </section>

        {/* 3. How Data Is Used */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2">
            <Eye className="h-5 w-5 text-[#EE8A2B]" />
            3. How We Use Your Information
          </h2>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
            <li>Delivering interactive course modules and assessment evaluation.</li>
            <li>Issuing tamper-verifiable completion certificates upon satisfying course criteria.</li>
            <li>Enabling aggregated reporting for Naval Officers and FPO managers on training completion rates (in Phase 5).</li>
            <li>Diagnosing platform performance, accessibility barriers, and user experience issues.</li>
          </ul>
        </section>

        {/* 4. Certificates and Public Verification */}
        <section className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-6">
          <h2 className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2">
            <Lock className="h-5 w-5 text-[#3E9BDB]" />
            4. Certificates & Public Verification Standards
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            A key feature of {brand.name} is the public certificate verification service (<code className="text-xs bg-white px-1.5 py-0.5 rounded-sm border">/verify</code>). To preserve learner privacy while ensuring third-party verifiability:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-gray-700">
            <li><strong>Minimum-Necessary Disclosure:</strong> Public verification reveals only the Certificate ID, issuing organization, course title, issuance date, and grade/outcome.</li>
            <li><strong>No PII Exposure:</strong> Learner personal names, email addresses, phone numbers, and physical locations are strictly excluded from public verification views in Phase 1.</li>
            <li><strong>No Public Indexing:</strong> Certificate result pages specify <code className="text-xs">noindex, nofollow</code> headers to prevent automated search engine web scrapers from cataloging individual records.</li>
          </ul>
        </section>

        {/* 5. Your Rights */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#1A1A2E]">5. Your Data Protection Rights</h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            In accordance with applicable privacy standards and the forthcoming enforcement of the DPDP Act, learners have rights regarding their personal data:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700">
            <li>Right to access summaries of personal data processed by the platform.</li>
            <li>Right to correction and updating of inaccurate demographic details.</li>
            <li>Right to grievance redressal through the designated Data Protection Officer.</li>
            <li>Right to request account deletion subject to statutory audit and credential retention regulations.</li>
          </ul>
        </section>

        {/* 6. Contact & Legal Review Notice */}
        <section className="border-t border-gray-200 pt-6 space-y-3 text-sm text-gray-600">
          <h2 className="text-base font-bold text-gray-900">Contact Information & Legal Review</h2>
          <p className="leading-relaxed">
            For inquiries regarding platform privacy practices or data governance during this preview phase, contact your assigned institutional administrator or naval training coordinator.
          </p>
          <p className="text-xs text-gray-500 italic">
            Notice: This document represents a structural draft intended for product demonstration purposes. Formal legal counsel will establish binding privacy terms prior to multi-state production deployment.
          </p>
        </section>
      </div>
    </div>
  );
}
