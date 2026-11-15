import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { FileText, ShieldAlert, CheckCircle, Scale, AlertOctagon } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Use | Learn LMS",
  description: "Terms and conditions governing the use of the Learn LMS platform and demonstration materials.",
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

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="py-12 sm:py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="border-b border-gray-200 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF4FC] text-[#123E62] border border-[#3E9BDB]/30 mb-4">
            <Scale className="h-4 w-4 text-[#3E9BDB]" />
            <span>Legal Framework</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1A1A2E] tracking-tight">
            Terms of Use
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Effective Date: November 2026 • Demo Release
          </p>
        </div>

        {/* Legal Disclaimer */}
        <DemoBanner
          variant="warning"
          message="These terms are a placeholder pending comprehensive legal review prior to commercial or official public launch."
        />

        {/* 1. Acceptance */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#3E9BDB]" />
            1. Acceptance of Terms
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            By accessing or using the {brand.name} website, demonstration services, courses, and certificate verification portals, you agree to comply with and be bound by these Terms of Use. If you do not agree with any portion of these terms, you should refrain from using the platform.
          </p>
        </section>

        {/* 2. Platform Purpose & Demo Content Notice */}
        <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-6">
          <h2 className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-amber-600" />
            2. Platform Purpose & Demo Content Notice
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            {brand.name} is currently operating in a Phase 1 demonstration environment. All course descriptions, instructor personas, and sample certificates displayed are demonstration prototypes created to showcase technical capabilities and UI workflows.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-amber-900">
            <li>Sample certificate records run in MockLedger mode and do not constitute certified legal accreditation unless officially validated by an accredited institutional partner.</li>
            <li>System functionality and feature availability are subject to modification across developmental phases.</li>
          </ul>
        </section>

        {/* 3. Acceptable Use of the Platform */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-[#1F9E94]" />
            3. Permitted & Acceptable Use
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Learners, educators, and enterprise administrators may use {brand.name} for educational evaluation, capacity training, and authentic skill development. You agree not to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700">
            <li>Attempt to circumvent assessment security, cheat on quiz questions, or falsify score submissions.</li>
            <li>Scrape, index, or harvest personal details or verification records using automated robots or scripts.</li>
            <li>Impersonate any other individual, naval officer, or producer enterprise.</li>
            <li>Interfere with platform operations or attempt unauthorized access to server infrastructure.</li>
          </ul>
        </section>

        {/* 4. Account Responsibility */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#1A1A2E] flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-[#EE8A2B]" />
            4. Account Responsibility (Phase 2+)
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            When account creation is enabled in Phase 2, users are responsible for maintaining the confidentiality of their credentials and passwords. Any activity that occurs under an authenticated learner account remains the sole responsibility of the registered user.
          </p>
        </section>

        {/* 5. Certificate Usage and Sharing */}
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-[#1A1A2E]">
            5. Certificate Usage, Verification & Sharing
          </h2>
          <p className="text-sm text-gray-700 leading-relaxed">
            Earned certificates may be shared by learners with employers, financing bodies, or nodal agencies. However:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-sm text-gray-700">
            <li>Certificates may not be modified, graphically altered, or duplicated with false names or scores.</li>
            <li>The platform reserves the right to revoke or suspend any certificate found to have been issued through deceptive means or policy violations.</li>
            <li>Third parties relying on certificates must verify credentials exclusively through the official <code className="text-xs bg-gray-100 px-1 py-0.5 rounded-sm">/verify</code> endpoint.</li>
          </ul>
        </section>

        {/* 6. Legal Disclaimer */}
        <section className="border-t border-gray-200 pt-6 space-y-2 text-xs text-gray-500">
          <p>
            <strong>Legal Disclaimer:</strong> The platform and all associated content are provided on an "as-is" and "as-available" basis without warranties of any kind. Detailed indemnification, dispute resolution, and jurisdiction clauses will be incorporated following formal legal counsel before enterprise release.
          </p>
        </section>
      </div>
    </div>
  );
}
