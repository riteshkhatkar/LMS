import type { Metadata } from "next";
import Link from "next/link";
import { mockDataProvider } from "@/lib/data/mock-provider";
import { CourseCard } from "@/components/courses/CourseCard";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { canUserAccessProgramme } from "@/lib/training/training";
import { brand } from "@/lib/brand";
import {
  Users,
  Compass,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  HelpCircle,
  GraduationCap,
  Sparkles,
  ClipboardCheck,
  Award,
  Layers,
  Clock,
  Lock,
} from "lucide-react";

export const metadata: Metadata = {
  title: "FPO and FPC Application Training | Learn LMS",
  description: "Dedicated onboarding and application skills training for FPOs, FPCs, and Naval Officers.",
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
    q: "Who should take this application training?",
    a: "This training is structured specifically for Farmer Producer Organisation (FPO) directors, Farmer Producer Company (FPC) operational teams, accounting staff, and designated Naval Officers tasked with operational platform execution.",
  },
  {
    q: "How long does the training programme take to complete?",
    a: "The core foundational modules are self-paced and typically take between 2 to 4 hours in total. Learners can pause at any step and resume at their convenience.",
  },
  {
    q: "What if our team members have slow internet connectivity?",
    a: "All guided lessons include downloadable PDF summaries and low-bandwidth reading materials, allowing learners to study offline or over rural cellular networks.",
  },
  {
    q: "How often is the application training curriculum updated?",
    a: "Programme content is actively refreshed whenever new software capabilities, regulatory requirements, or workflow updates are introduced to the main application.",
  },
];

export default async function TrainingPage({ params }: Props) {
  const { locale } = await params;
  const session = await getSession();
  const recommendedCourse = await mockDataProvider.getCourseBySlug(
    "getting-started-main-application"
  );

  const dbProgrammes = await prisma.trainingProgramme.findMany({
    where: { status: "PUBLISHED" },
    include: {
      courses: {
        include: {
          course: {
            select: { id: true, title: true, slug: true, durationMinutes: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      organization: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const accessibleProgrammes = dbProgrammes.filter((p) =>
    session
      ? canUserAccessProgramme(
          { role: session.role, learnerGroup: session.learnerGroup },
          { isRestricted: p.isRestricted, targetGroup: p.targetGroup }
        )
      : !p.isRestricted
  );

  return (
    <div className="py-12 sm:py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Section 1: Hero */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAF4FC] text-[#123E62] border border-[#3E9BDB]/30">
            <Compass className="h-4 w-4 text-[#3E9BDB]" />
            <span>FPO & FPC Capacity Building</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1A1A2E] tracking-tight">
            Training that helps your team get started
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 font-medium">
            Dedicated onboarding for FPOs, FPCs and Naval Officers
          </p>

          {/* 4-step visual path */}
          <div className="mt-8 pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-left">
              {[
                { num: "1", title: "Register / Be assigned", desc: "Enrol directly or receive cohort access via your Naval Training Officer" },
                { num: "2", title: "Follow guided lessons", desc: "Step-by-step videos and interactive walkthroughs" },
                { num: "3", title: "Check understanding", desc: "Short practical quizzes to reinforce day-to-day routines" },
                { num: "4", title: "Complete training", desc: "Receive an authentic, verifiable certificate of completion" },
              ].map((step, idx) => (
                <div
                  key={step.num}
                  className="relative p-4 rounded-xl border border-gray-200 bg-gray-50/70 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-6 h-6 rounded-full bg-[#3E9BDB] text-white flex items-center justify-center text-xs font-bold font-mono">
                      {step.num}
                    </span>
                    {idx < 3 && (
                      <span className="hidden sm:inline text-gray-300 font-bold">→</span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 pt-1">
                    {step.title}
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Programme Overview */}
        <section className="rounded-2xl border border-gray-200/90 bg-gray-50/50 p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#EAF4FC] text-[#3E9BDB]">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A2E]">
                Programme Overview
              </h2>
              <p className="text-xs text-gray-500">
                Practical, job-aligned digital onboarding
              </p>
            </div>
          </div>

          <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
            This onboarding programme equips participants with the operational knowledge needed to navigate and utilize the primary digital application supporting your organization's workflow. Through structured modules, your team will learn core routines, record management, data entry best practices, and reporting procedures.
          </p>

          <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200/80 text-xs sm:text-sm text-blue-950 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-[#3E9BDB] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="font-semibold">Ongoing curriculum updates: </span>
              Programme content is updated as new application features are released, ensuring your organization stays synchronized with the latest tools and regulatory compliance guidelines.
            </p>
          </div>
        </section>

        {/* Section 3: Audience Chips */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A2E]">
                Tailored for Your Role
              </h2>
              <p className="text-sm text-gray-500">
                Select your group to explore role-specific learning paths.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href={`/${locale}/courses?audience=FPO`}
              className="group block p-6 rounded-xl border border-gray-200 bg-white hover:border-[#3E9BDB] hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#EAF4FC] text-[#3E9BDB] flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#3E9BDB] flex items-center justify-between">
                <span>FPO Members</span>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#3E9BDB] group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Foundational governance, member record maintenance, and core navigation for farmer directors.
              </p>
            </Link>

            <Link
              href={`/${locale}/courses?audience=FPC`}
              className="group block p-6 rounded-xl border border-gray-200 bg-white hover:border-[#1F9E94] hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-teal-50 text-[#1F9E94] flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#1F9E94] flex items-center justify-between">
                <span>FPC Teams</span>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#1F9E94] group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Operational data entry, transaction logs, inventory tracking, and statutory compliance management.
              </p>
            </Link>

            <Link
              href={`/${locale}/courses?audience=NAVAL_OFFICER`}
              className="group block p-6 rounded-xl border border-gray-200 bg-white hover:border-[#EE8A2B] hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-orange-50 text-[#EE8A2B] flex items-center justify-center font-bold mb-3 group-hover:scale-110 transition-transform">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#EE8A2B] flex items-center justify-between">
                <span>Naval Officers</span>
                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#EE8A2B] group-hover:translate-x-1 transition-all" />
              </h3>
              <p className="mt-2 text-xs text-gray-600 leading-relaxed">
                Naval cohort oversight, operational readiness modules, and secure platform execution.
              </p>
            </Link>
          </div>
        </section>

        {/* Section 4: Recommended Course Card */}
        {recommendedCourse && (
          <section className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#3E9BDB]">
                  Featured Starting Point
                </span>
                <h2 className="text-2xl font-bold text-[#1A1A2E]">
                  Recommended Course
                </h2>
              </div>
              <Link
                href={`/${locale}/courses/${recommendedCourse.slug}`}
                className="text-sm font-semibold text-[#3E9BDB] hover:text-[#3286bf] flex items-center gap-1"
              >
                <span>View course details</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="max-w-md">
              <CourseCard course={recommendedCourse} />
            </div>
          </section>
        )}

        {/* Section 4b: Institutional Training Programmes */}
        {accessibleProgrammes.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#3E9BDB]">
                  Structured Curriculum Tracks
                </span>
                <h2 className="text-2xl font-bold text-[#1A1A2E]">
                  Institutional Training Programmes
                </h2>
                <p className="text-sm text-gray-500">
                  Comprehensive role-based syllabi orchestrating guided lessons, procedural walkthroughs, and verified assessments.
                </p>
              </div>
              {session && (
                <Link
                  href={`/${locale}/learn/training`}
                  className="text-sm font-semibold text-[#3E9BDB] hover:text-[#3286bf] flex items-center gap-1"
                >
                  <span>My Training Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accessibleProgrammes.map((prog) => {
                const targetLabel = prog.targetGroup
                  ? brand.learnerGroups[prog.targetGroup] || prog.targetGroup
                  : "All Cohorts";
                const firstCourseSlug = prog.courses[0]?.course.slug || "getting-started-main-application";

                return (
                  <div
                    key={prog.id}
                    className="p-6 rounded-2xl border border-gray-200 bg-white hover:border-[#3E9BDB] hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF4FC] text-[#3E9BDB] border border-[#3E9BDB]/20">
                            {targetLabel}
                          </span>
                          {prog.isRestricted && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <Lock className="h-3 w-3" />
                              <span>Naval Clearance Restricted</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{prog.estimatedDurationMinutes} mins</span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 leading-snug">
                        {prog.title}
                      </h3>
                      <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                        {prog.description}
                      </p>

                      <div className="pt-2 border-t border-gray-100 space-y-1.5">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          Constituent Modules ({prog.courses.length})
                        </div>
                        <ul className="space-y-1">
                          {prog.courses.map((c, idx) => (
                            <li
                              key={c.courseId}
                              className="text-xs text-gray-700 flex items-center gap-2"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">
                                {idx + 1}. {c.course.title}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                      <span className="text-[11px] font-medium text-gray-500">
                        Accredited ORELSE Credential
                      </span>
                      <Link
                        href={`/${locale}/courses/${firstCourseSlug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3E9BDB] hover:bg-[#3286bf] text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <span>Start Programme</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 5: What Admins & Naval Officers Can Track */}
        <section className="rounded-2xl border border-purple-200/80 bg-purple-50/30 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-purple-100 text-[#8E6BBF]">
                <BarChart3 className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-[#1A1A2E]">
                  What Admins and Naval Officers Can Track
                </h2>
                <p className="text-sm text-gray-500">
                  Real-time analytics and cohort performance indicators
                </p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-[#8E6BBF] border border-purple-300">
              Phase 5 Features
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white border border-purple-100 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">
                  Cohort Completion Rate
                </span>
                <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  (Coming soon)
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Percentage of registered team members who have completed all required lessons and modular checkpoints.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-purple-100 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">
                  Quiz Scores & Accuracy
                </span>
                <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  (Coming soon)
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Average comprehension scores across quizzes, highlighting specific topics that may require further field instruction.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-purple-100 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">
                  Certificates Issued
                </span>
                <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  (Coming soon)
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Total verified certificates earned per FPO cohort with direct links to the ledger verification registry.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-purple-100 shadow-2xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">
                  Remediation & Drop-off Alerts
                </span>
                <span className="text-[11px] font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
                  (Coming soon)
                </span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Early detection of learners who stalled on specific lessons, enabling proactive mentor outreach.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: FAQ */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-[#1F9E94]">
              <HelpCircle className="h-5 w-5" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A2E]">
              Training Programme FAQ
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FAQ_ITEMS.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-gray-200 bg-gray-50/50 p-5 space-y-2"
              >
                <h3 className="font-semibold text-gray-900 text-sm">
                  {item.q}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 7: CTA */}
        <section className="rounded-2xl bg-linear-to-r from-[#1A1A2E] to-[#123E62] text-white p-8 sm:p-12 text-center space-y-6">
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold">
              Ready to start?
            </h2>
            <p className="text-gray-300 text-sm sm:text-base">
              Contact your Naval Training Officer or enrol directly to begin your guided training journey today.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={`/${locale}/courses`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#3E9BDB] text-white font-semibold hover:bg-[#3286bf] transition-colors shadow-md"
            >
              <span>Browse All Courses</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href={`/${locale}/help`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-colors"
            >
              <span>Contact Naval Officer</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
