import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { DemoBanner } from "@/components/ui/DemoBanner";
import {
  BookOpen,
  Users,
  ShieldCheck,
  Code2,
  CheckCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Learn LMS | Learn LMS",
  description: "Learn about the mission, architecture, and credential verification principles behind Learn LMS.",
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

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="py-12 sm:py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF4FC] text-[#123E62] border border-[#3E9BDB]/30 mb-4">
            <Sparkles className="h-4 w-4 text-[#3E9BDB]" />
            <span>Empowering Grassroots Organizations</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A2E] tracking-tight">
            About {brand.name}
          </h1>
          <p className="mt-4 text-lg text-gray-600 leading-relaxed">
            {brand.tagline}
          </p>
        </div>

        {/* Phase 1 Notice */}
        <DemoBanner
          variant="demo"
          message="Learn LMS is currently in development. This demo showcases Phase 1 — the public website and course discovery experience."
        />

        {/* What is Learn LMS */}
        <section className="rounded-2xl border border-gray-200/90 bg-gray-50/50 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#EAF4FC] text-[#3E9BDB]">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A2E]">What is Learn LMS?</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            {brand.name} is a purpose-built learning management system created to deliver practical, accessible training for farmer producer organizations, community enterprises, and technical administrative teams.
          </p>
          <p className="text-gray-700 leading-relaxed">
            Unlike traditional academic platforms, our curriculum focuses directly on day-to-day statutory operations, digital tooling, statutory record-keeping, and governance best practices necessary for sustainable organizational growth.
          </p>
        </section>

        {/* Who it's for */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-50 text-[#1F9E94]">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A2E]">Who It's For</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            The platform is structured with specialized learning tracks designed for four key stakeholder groups across the rural enterprise ecosystem:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-2xs">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#3E9BDB]" />
                {brand.learnerGroups.FPO}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Board directors and farmer shareholder members mastering governance responsibilities, annual filings, member registers, and democratic decision-making.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-2xs">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#1F9E94]" />
                {brand.learnerGroups.FPC}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                CEOs, accountants, and field coordinators managing inventory, trading, post-harvest logistics, audit compliance, and accounting software.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-2xs">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#EE8A2B]" />
                {brand.learnerGroups.STUDENT}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Youth and agriculture graduates building digital literacy, supply-chain monitoring skills, and readiness for grassroots agribusiness careers.
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 p-5 bg-white shadow-2xs">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8E6BBF]" />
                {brand.learnerGroups.NAVAL_OFFICER}
              </h3>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                Naval and defense officers participating in operational application training, technical capacity building, and digital workflow certification.
              </p>
            </div>
          </div>
        </section>

        {/* Our approach to certification */}
        <section className="space-y-4 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A2E]">
              Our Approach to Certification
            </h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            Certificates issued on {brand.name} prove verified competency through rigorous modular assessments and end-of-course evaluations.
          </p>
          <div className="p-4 rounded-lg bg-white border border-amber-200 text-sm text-amber-950 space-y-2">
            <p className="font-semibold text-amber-900">
              Honest Disclosure: MockLedger Mode
            </p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Certificate verification is currently operating in demo mode using a simulated ledger (MockLedger). In this demonstration phase, no actual distributed ledger or blockchain transactions are created or recorded on public networks. Production deployments will configure dedicated enterprise ledger anchoring tailored to institutional compliance requirements.
            </p>
          </div>
        </section>

        {/* Technical approach */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-[#3E9BDB]">
              <Code2 className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A2E]">Technical Architecture</h2>
          </div>
          <p className="text-gray-700 leading-relaxed">
            {brand.name} is engineered with modern, robust web standards prioritizing speed, accessibility, and offline-friendliness for users with variable bandwidth:
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
            <li className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100">
              <CheckCircle className="h-5 w-5 text-[#1F9E94] shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900">Next.js 16 App Router:</strong> Server-side rendering and streaming architecture for instantaneous page loads.
              </div>
            </li>
            <li className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100">
              <CheckCircle className="h-5 w-5 text-[#1F9E94] shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900">TypeScript & Prisma:</strong> End-to-end type safety, structured relational schemas, and verifiable business logic.
              </div>
            </li>
            <li className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100">
              <CheckCircle className="h-5 w-5 text-[#1F9E94] shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900">Accessibility-First (WCAG AA):</strong> Full keyboard navigation, semantic markup, high color contrast, and screen-reader support.
              </div>
            </li>
            <li className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 border border-gray-100">
              <CheckCircle className="h-5 w-5 text-[#1F9E94] shrink-0 mt-0.5" />
              <div>
                <strong className="text-gray-900">Multilingual Ready:</strong> Native localization foundation supporting English, Hindi, and Marathi.
              </div>
            </li>
          </ul>
        </section>

        {/* CTA Banner */}
        <div className="rounded-2xl bg-linear-to-r from-[#1A1A2E] to-[#123E62] text-white p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <h3 className="text-2xl font-bold">Ready to explore courses?</h3>
            <p className="text-gray-300 text-sm max-w-md">
              Start browsing our curriculum of practical digital skills and governance training.
            </p>
          </div>
          <Link
            href={`/${locale}/courses`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#3E9BDB] text-white font-semibold hover:bg-[#3286bf] transition-colors shrink-0 shadow-md"
          >
            <span>Explore Courses</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
