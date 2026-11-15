import type { Metadata } from "next";
import Link from "next/link";
import { DemoBanner } from "@/components/ui/DemoBanner";
import {
  GraduationCap,
  BookOpen,
  CheckCircle,
  FileCheck,
  ShieldCheck,
  UserCheck,
  Layers,
  Award,
  ArrowRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  QrCode,
  Sliders,
} from "lucide-react";

export const metadata: Metadata = {
  title: "How It Works | Learn LMS",
  description: "Understand the end-to-end learning path, grading criteria, and verified credential lifecycle in Learn LMS.",
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

export default async function HowItWorksPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="py-12 sm:py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF4FC] text-[#123E62] border border-[#3E9BDB]/30 mb-4">
            <Sparkles className="h-4 w-4 text-[#3E9BDB]" />
            <span>Platform Architecture & Journey</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A2E] tracking-tight">
            How Learn LMS works
          </h1>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            From initial discovery and self-paced study to rigorous assessment and tamper-verifiable credentials.
          </p>
        </div>

        {/* 1. For Learners */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#EAF4FC] text-[#3E9BDB]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A2E]">
                1. For Learners: The Learning Journey
              </h2>
              <p className="text-sm text-gray-500">
                A simple 6-step path to master practical skills and achieve verified certification.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                title: "Discovery",
                desc: "Explore course catalogs filtered by role (FPO Member, FPC Team, Student, Naval Officer) and domain topic.",
              },
              {
                step: "02",
                title: "Enrolment",
                desc: "Get instant access to course materials, curriculum outlines, prerequisites, and evaluation expectations.",
              },
              {
                step: "03",
                title: "Study",
                desc: "Watch video tutorials, read field guides, and download PDF checklists at your own schedule.",
              },
              {
                step: "04",
                title: "Practice Quizzes",
                desc: "Test knowledge after each module with untimed concept checks and immediate feedback.",
              },
              {
                step: "05",
                title: "Assessment",
                desc: "Complete comprehensive course examinations adhering to specified time limits and passing thresholds.",
              },
              {
                step: "06",
                title: "Certificate",
                desc: "Earn a tamper-verifiable digital credential complete with unique verification ID and QR code.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-xl border border-gray-200/90 bg-gray-50/50 p-5 hover:bg-white hover:shadow-xs transition-all"
              >
                <span className="font-mono text-xs font-bold text-[#3E9BDB] bg-[#EAF4FC] px-2 py-0.5 rounded-md">
                  Step {item.step}
                </span>
                <h3 className="mt-3 text-base font-bold text-gray-900">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. For Instructors (Phase 2) */}
        <section className="rounded-2xl border border-teal-200/80 bg-teal-50/30 p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-teal-100 text-[#1F9E94]">
                <Layers className="h-6 w-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A2E]">
                2. For Instructors
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-[#1F9E94] border border-teal-300">
              Phase 2 Feature
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            Content creators and master trainers will use a dedicated authoring suite to build and publish courses:
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-medium text-gray-800">
            <span className="px-3 py-1.5 rounded-lg bg-white border border-teal-200">
              1. Create Course Shell
            </span>
            <span className="text-teal-600 font-bold">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-white border border-teal-200">
              2. Add Sections & Lessons
            </span>
            <span className="text-teal-600 font-bold">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-white border border-teal-200">
              3. Configure Quizzes & Rubrics
            </span>
            <span className="text-teal-600 font-bold">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-white border border-teal-200">
              4. Review Policy
            </span>
            <span className="text-teal-600 font-bold">→</span>
            <span className="px-3 py-1.5 rounded-lg bg-white border border-teal-200">
              5. Publish to Catalog
            </span>
          </div>
        </section>

        {/* 3. For Admins (Phase 5) */}
        <section className="rounded-2xl border border-purple-200/80 bg-purple-50/30 p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-100 text-[#8E6BBF]">
                <UserCheck className="h-6 w-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1A1A2E]">
                3. For Admins & Naval Officers
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-[#8E6BBF] border border-purple-300">
              Phase 5 Feature
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            Institutional leaders and naval training divisions will have comprehensive management oversight:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <div className="font-semibold text-gray-900 mb-1">Manage Users</div>
              <div className="text-gray-500">Roster management across FPOs and cohorts.</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <div className="font-semibold text-gray-900 mb-1">Assign Courses</div>
              <div className="text-gray-500">Targeted curriculum deployment for roles.</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <div className="font-semibold text-gray-900 mb-1">Monitor Progress</div>
              <div className="text-gray-500">Real-time completion dashboards and drop-off alerts.</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <div className="font-semibold text-gray-900 mb-1">View Reports</div>
              <div className="text-gray-500">Exportable statutory compliance transcripts.</div>
            </div>
          </div>
        </section>

        {/* 4. Assessment and Grading */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orange-50 text-[#EE8A2B]">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A2E]">
                4. Assessment and Grading
              </h2>
              <p className="text-sm text-gray-500">
                Transparent evaluation thresholds ensure verifiable competence.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-2xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Minimum Standard
              </span>
              <div className="text-2xl font-black text-gray-900 mt-1">60%+</div>
              <div className="text-sm font-semibold text-gray-800 mt-1">Pass Threshold</div>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Standard baseline score required across final evaluations to earn certificate eligibility.
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 p-5 bg-blue-50/40 shadow-2xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Merit Band
              </span>
              <div className="text-2xl font-black text-blue-900 mt-1">70% – 75%</div>
              <div className="text-sm font-semibold text-blue-950 mt-1">Grade B Band</div>
              <p className="mt-2 text-xs text-blue-800 leading-relaxed">
                Awarded for proficient mastery of practical procedures and operational standards.
              </p>
            </div>

            <div className="rounded-xl border border-green-200 p-5 bg-green-50/40 shadow-2xs">
              <span className="text-xs font-semibold uppercase tracking-wider text-green-600">
                Distinction Band
              </span>
              <div className="text-2xl font-black text-green-900 mt-1">90%+</div>
              <div className="text-sm font-semibold text-green-950 mt-1">Grade A Distinction</div>
              <p className="mt-2 text-xs text-green-800 leading-relaxed">
                Recognizes outstanding technical knowledge, accuracy, and statutory problem solving.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 italic">
            Note: Exact grade requirements and attempt limits are shown on each individual course page under the "Assessment Policy" section.
          </div>
        </section>

        {/* 5. Blockchain / Ledger Honest Disclosure */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#EAF4FC] text-[#3E9BDB]">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A2E]">
                5. Ledger & Verification Infrastructure
              </h2>
              <p className="text-sm text-gray-500">
                Transparent cryptographic record architecture.
              </p>
            </div>
          </div>

          <DemoBanner
            variant="mock-ledger"
            message="Certificate verification is currently in demo mode (MockLedger). Real blockchain anchoring is configured per deployment environment. In the demo, no real transactions are created."
          />

          <div className="p-6 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 leading-relaxed space-y-3">
            <p>
              In production setups, enterprise deployments integrate with permissioned or public ledger networks to anchor hash commitments of certificate IDs and issuance events.
            </p>
            <p>
              During this interactive demo, all cryptographic queries resolve against our in-memory <strong>MockLedger</strong> provider to illustrate the user verification journey without requiring crypto wallets, gas fees, or network transaction latency.
            </p>
          </div>
        </section>

        {/* 6. Certificate Lifecycle */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-green-50 text-green-700">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A2E]">
                6. Complete Certificate Lifecycle
              </h2>
              <p className="text-sm text-gray-500">
                End-to-end credential state management from issuance to potential revocation.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-[#3E9BDB] flex items-center justify-center font-bold text-xs">
                1
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Earned</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Learner completes all required lessons and achieves the qualifying score on the final assessment.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-2">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-[#1F9E94] flex items-center justify-center font-bold text-xs">
                2
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Issued</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                System signs credential record, mints unique Certificate ID, and embeds secure verification QR code.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-gray-200 bg-white space-y-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 text-[#8E6BBF] flex items-center justify-center font-bold text-xs">
                3
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Verified</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                Employers and defense agencies verify authenticity anytime via ID search or QR scan on /verify.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-red-100 bg-red-50/30 space-y-2">
              <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs">
                4
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Revocable</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                If credentials expire or fail compliance audits, issuers can flag records as Revoked with stated reasons.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center pt-8 border-t border-gray-200">
          <Link
            href={`/${locale}/courses`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#3E9BDB] text-white font-semibold hover:bg-[#3286bf] transition-colors shadow-xs"
          >
            <span>Explore Available Courses</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
