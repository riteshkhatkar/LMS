import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { DemoBanner } from "@/components/ui/DemoBanner";
import {
  HelpCircle,
  Accessibility,
  Laptop,
  Mail,
  MessageSquare,
  Keyboard,
  Globe,
  CheckCircle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Help & Support | Learn LMS",
  description: "Find answers to frequently asked questions, accessibility guidelines, technical requirements, and support information.",
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

const FAQ_ITEMS = [
  {
    q: "What is Learn LMS?",
    a: "Learn LMS is a practical learning platform designed specifically for Farmer Producer Organisations (FPOs), Farmer Producer Companies (FPCs), students, and Naval Officers. It focuses on hands-on digital skills, compliance, governance, and operational training.",
  },
  {
    q: "How do I enrol in a course?",
    a: "In this Phase 1 preview, you can browse all published courses, review curriculum outlines, prerequisites, and lesson details freely without registering. Full account registration, self-enrollment, and progress tracking will be activated in Phase 2.",
  },
  {
    q: "Are the courses free to access?",
    a: "Yes. All public training content on Learn LMS is accessible without tuition or subscription fees during the demo and initial rollout phases.",
  },
  {
    q: "How does certificate verification work?",
    a: "Every issued certificate includes a unique verification identifier (and corresponding QR code). Anyone can navigate to the /verify page, enter the certificate ID, and confirm the authenticity, issuance date, and passing grade of the credential.",
  },
  {
    q: "What score is required to pass a course assessment?",
    a: "Passing thresholds are configured per course in the assessment policy. The standard default pass mark is 60%, with higher grade bands (e.g., Grade B at 70-75% and Grade A at 90% or higher). Exact passing criteria are listed on each course detail page.",
  },
  {
    q: "How many quiz attempts do I get?",
    a: "Each course clearly outlines its attempt policy. Typically, learners receive 2 to 3 attempts for modular quizzes and final assessments before a mandatory cooling-off period.",
  },
  {
    q: "What languages are courses offered in?",
    a: "The platform supports English (en), Hindi (hi), and Marathi (mr). Each course card and detail page indicates the languages available for video commentary, transcripts, and reading materials.",
  },
  {
    q: "What should I do if I fail an assessment?",
    a: "Learners can review course lessons, replay key modules, and retake the assessment if remaining attempts allow. Once course retake limits are reached, your naval training officer or instructor can provide remediation guidance.",
  },
  {
    q: "When will user login and profile tracking be active?",
    a: "User authentication, personal learning dashboards, and instructor grading management are scheduled for Phase 2 implementation.",
  },
  {
    q: "Can I access Learn LMS on my mobile smartphone?",
    a: "Yes. The entire platform is built with a responsive, mobile-first design that functions smoothly on smartphones, tablets, and low-bandwidth connections.",
  },
];

export default async function HelpPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="py-12 sm:py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF4FC] text-[#123E62] border border-[#3E9BDB]/30 mb-4">
            <HelpCircle className="h-4 w-4 text-[#3E9BDB]" />
            <span>Support & Documentation</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A2E] tracking-tight">
            Help & Support
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Answers to common questions about courses, certifications, accessibility, and platform requirements.
          </p>
        </div>

        {/* Demo Support Notice */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-lg bg-amber-100 text-amber-800 shrink-0">
              <MessageSquare className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-950">
                Contact & Support Channels
              </h2>
              <p className="mt-2 text-sm text-amber-900 leading-relaxed">
                During the demo phase, live phone and ticketing support is not yet active. Please check back after official public launch. If you have questions regarding regional training cohorts, please contact your local Naval Training Officer.
              </p>
            </div>
          </div>
        </div>

        {/* General FAQ */}
        <section className="space-y-6">
          <div className="border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-[#1A1A2E]">
              Frequently Asked Questions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Quick answers about our courses, certifications, and system features.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {FAQ_ITEMS.map((item, idx) => (
              <details
                key={idx}
                className="group rounded-xl border border-gray-200 bg-gray-50/50 p-5 open:bg-white open:shadow-xs transition-colors"
              >
                <summary className="font-semibold text-gray-900 text-base cursor-pointer flex items-center justify-between gap-4 select-none">
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#3E9BDB] bg-[#EAF4FC] px-2 py-0.5 rounded-md">
                      Q{idx + 1}
                    </span>
                    {item.q}
                  </span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform text-xl">
                    ↓
                  </span>
                </summary>
                <p className="mt-4 text-sm text-gray-700 leading-relaxed pl-8 border-l-2 border-[#3E9BDB]/30">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Accessibility Section */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 space-y-6 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-teal-50 text-[#1F9E94]">
              <Accessibility className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A2E]">
                Accessibility & Inclusivity
              </h2>
              <p className="text-sm text-gray-500">
                Designed to meet WCAG 2.1 AA accessibility guidelines.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm mb-2">
                <Keyboard className="h-4 w-4 text-[#3E9BDB]" />
                Keyboard Navigation
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                All buttons, links, form controls, and accordions are fully navigable using <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded-sm text-gray-800">Tab</kbd>, <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded-sm text-gray-800">Enter</kbd>, and <kbd className="px-1.5 py-0.5 bg-white border border-gray-300 rounded-sm text-gray-800">Space</kbd>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm mb-2">
                <CheckCircle className="h-4 w-4 text-[#1F9E94]" />
                Skip Links & Semantics
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Every page includes a "Skip to main content" link for screen reader users and structured ARIA landmark regions.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm mb-2">
                <Globe className="h-4 w-4 text-[#EE8A2B]" />
                Multilingual Support
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Platform headers allow switching between English, Hindi, and Marathi with appropriate <code className="text-xs">lang</code> tags for speech synthesizers.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Requirements */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-blue-50 text-[#3E9BDB]">
              <Laptop className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A2E]">
              Technical Requirements
            </h2>
          </div>
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-4 text-sm text-gray-700">
            <p>
              Learn LMS is engineered to function smoothly across modern web browsers without requiring browser extensions or plugins:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li><strong>Desktop Browsers:</strong> Google Chrome (v110+), Mozilla Firefox (v115+), Apple Safari (v16+), Microsoft Edge (v110+).</li>
              <li><strong>Mobile Browsers:</strong> Chrome for Android, Safari for iOS (iOS 16+), Samsung Internet.</li>
              <li><strong>Connectivity:</strong> Optimized lightweight assets allow effective operation over 3G/4G connections and rural broadband.</li>
              <li><strong>JavaScript:</strong> Enabled in the web browser for interactive quizzes, verification lookup, and filters.</li>
            </ul>
          </div>
        </section>

        {/* Newsletter Section */}
        <section id="newsletter" className="scroll-mt-20 rounded-2xl bg-linear-to-r from-[#1A1A2E] to-[#123E62] text-white p-8 sm:p-10 space-y-4">
          <div className="flex items-center gap-3">
            <Mail className="h-6 w-6 text-[#3E9BDB]" />
            <h2 className="text-2xl font-bold">Newsletter & Updates</h2>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed max-w-2xl">
            Stay informed about new course releases, statutory compliance deadlines, and regional training announcements.
          </p>
          <div className="p-4 rounded-lg bg-white/10 border border-white/20 text-xs text-gray-200">
            <span className="font-semibold text-white">Phase 6 Feature: </span>
            Automated email digest preferences will be activated during the Phase 6 notification service rollout. For now, check the platform announcement bar on the homepage for updates.
          </div>
        </section>
      </div>
    </div>
  );
}
