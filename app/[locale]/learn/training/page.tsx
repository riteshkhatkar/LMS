import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { brand } from "@/lib/brand";
import { canUserAccessProgramme, calculateProgrammeProgress } from "@/lib/training/training";
import { TrainingProgrammeStatus } from "@prisma/client";
import {
  Compass,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  BookOpen,
  Award,
  ShieldCheck,
  Lock,
  Layers,
  HelpCircle,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "My Training Programmes | Learn LMS",
  description: "Dedicated application onboarding and structured training tracks.",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function LearnerTrainingPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { tab = "all" } = await searchParams;

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login?redirect=/${locale}/learn/training`);
  }

  // 1. Fetch user assignments
  const assignmentWhereOr: any[] = [{ userId: session.id }];
  if (session.organizationId) {
    assignmentWhereOr.push({ organizationId: session.organizationId });
  }
  if (session.learnerGroup) {
    assignmentWhereOr.push({ learnerGroup: session.learnerGroup as any });
  }

  const userAssignments = await prisma.trainingProgrammeAssignment.findMany({
    where: { OR: assignmentWhereOr },
    select: { programmeId: true, dueDate: true, status: true },
  });
  const assignedProgrammeIds = new Set(userAssignments.map((a) => a.programmeId));

  // 2. Fetch programmes
  const programmes = await prisma.trainingProgramme.findMany({
    where: {
      OR: [
        { id: { in: Array.from(assignedProgrammeIds) } },
        { status: TrainingProgrammeStatus.PUBLISHED },
      ],
    },
    include: {
      courses: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              durationMinutes: true,
              thumbnail: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
      organization: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // 3. Apply Confidentiality & Clearance Guard
  const accessibleProgrammes = programmes.filter((p) =>
    canUserAccessProgramme(
      { role: session.role, learnerGroup: session.learnerGroup },
      { isRestricted: p.isRestricted, targetGroup: p.targetGroup }
    )
  );

  // 4. Fetch enrollments & certificates
  const allCourseIds = Array.from(
    new Set(accessibleProgrammes.flatMap((p) => p.courses.map((c) => c.courseId)))
  );

  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: session.id,
      courseId: { in: allCourseIds },
    },
    select: {
      courseId: true,
      progressPct: true,
      isCompleted: true,
      assessmentStatus: true,
      finalScore: true,
      finalGrade: true,
    },
  });

  const certificates = await prisma.certificate.findMany({
    where: {
      userId: session.id,
      status: "VALID",
    },
    select: {
      id: true,
      programmeId: true,
      courseId: true,
      grade: true,
      issueDate: true,
    },
  });

  // Calculate progress for each programme
  const programmesWithProgress = accessibleProgrammes.map((p) => {
    const isAssigned = assignedProgrammeIds.has(p.id);
    const assignmentMeta = userAssignments.find((a) => a.programmeId === p.id);
    const progress = calculateProgrammeProgress(p.courses, enrollments);

    const pCourseIds = p.courses.map((c) => c.courseId);
    const matchingCert = certificates.find(
      (c) => c.programmeId === p.id || (pCourseIds.includes(c.courseId) && progress.isCompleted)
    );

    return {
      ...p,
      isAssigned,
      dueDate: assignmentMeta?.dueDate || null,
      progress,
      certificate: matchingCert || null,
    };
  });

  const totalProgrammes = programmesWithProgress.length;
  const completedProgrammes = programmesWithProgress.filter((p) => p.progress.isCompleted);
  const inProgressProgrammes = programmesWithProgress.filter(
    (p) => !p.progress.isCompleted && p.progress.overallProgressPct > 0
  );
  const assignedProgrammes = programmesWithProgress.filter((p) => p.isAssigned);

  const displayedProgrammes =
    tab === "completed"
      ? completedProgrammes
      : tab === "in-progress"
      ? inProgressProgrammes
      : tab === "assigned"
      ? assignedProgrammes
      : programmesWithProgress;

  const groupLabel = session.learnerGroup
    ? brand.learnerGroups[session.learnerGroup] || session.learnerGroup
    : "Learner";

  return (
    <div className="py-8 sm:py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAF4FC] text-[#3E9BDB] border border-[#3E9BDB]/20 flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5" />
                <span>Application Training Tracks</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                {groupLabel}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E] tracking-tight">
              Dedicated Application Training
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
              Step-by-step procedural walkthroughs, in-course quizzes, and modular assessments
              designed for cooperative directors, operations teams, and operational officers.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-[#1A1A2E]">{totalProgrammes}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Tracks
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-[#3E9BDB]">
                {inProgressProgrammes.length}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Active
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-[#1F9E94]">
                {completedProgrammes.length}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Completed
              </div>
            </div>
          </div>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/learn/training?tab=all`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "all"
                  ? "bg-[#3E9BDB] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              All Tracks ({totalProgrammes})
            </Link>
            <Link
              href={`/${locale}/learn/training?tab=assigned`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "assigned"
                  ? "bg-[#3E9BDB] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              Assigned ({assignedProgrammes.length})
            </Link>
            <Link
              href={`/${locale}/learn/training?tab=in-progress`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "in-progress"
                  ? "bg-[#3E9BDB] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              In Progress ({inProgressProgrammes.length})
            </Link>
            <Link
              href={`/${locale}/learn/training?tab=completed`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "completed"
                  ? "bg-[#3E9BDB] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              Completed ({completedProgrammes.length})
            </Link>
          </div>

          <Link
            href={`/${locale}/learn/my-learning`}
            className="text-xs font-semibold text-slate-600 hover:text-[#3E9BDB] flex items-center gap-1"
          >
            <span>View All Enrolled Courses</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Programmes Grid */}
        {displayedProgrammes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
            <Compass className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">No training tracks found</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              There are no training programmes matching the selected filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {displayedProgrammes.map((prog) => {
              const firstIncompleteCourse = prog.progress.coursesProgress.find((c) => !c.isCompleted);
              const nextCourseSlug =
                firstIncompleteCourse?.slug || prog.courses[0]?.course.slug || "";

              return (
                <div
                  key={prog.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6 sm:p-7 space-y-4">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {prog.targetGroup && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF4FC] text-[#3E9BDB] border border-[#3E9BDB]/20">
                            {brand.learnerGroups[prog.targetGroup] || prog.targetGroup}
                          </span>
                        )}
                        {prog.isRestricted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            <span>Naval Clearance Restricted</span>
                          </span>
                        )}
                        {prog.isAssigned && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Assigned Cohort
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{prog.estimatedDurationMinutes} mins</span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="space-y-1.5">
                      <h3 className="text-xl font-bold text-[#1A1A2E] leading-snug">
                        {prog.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                        {prog.description}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Track Completion</span>
                        <span className="font-bold text-slate-900">
                          {prog.progress.overallProgressPct}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 rounded-full ${
                            prog.progress.isCompleted
                              ? "bg-emerald-500"
                              : prog.progress.overallProgressPct > 0
                              ? "bg-[#3E9BDB]"
                              : "bg-slate-300"
                          }`}
                          style={{ width: `${prog.progress.overallProgressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Constituent Courses Breakdown */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                        <span>Constituent Modules ({prog.courses.length})</span>
                        <span>
                          {prog.progress.completedCoursesCount} / {prog.courses.length} Completed
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {prog.progress.coursesProgress.map((cp, cIdx) => (
                          <div
                            key={cp.courseId}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {cp.isCompleted ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                              ) : (
                                <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                              )}
                              <span
                                className={`truncate font-medium ${
                                  cp.isCompleted ? "text-slate-600" : "text-slate-900"
                                }`}
                              >
                                {cIdx + 1}. {cp.title}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 shrink-0 ml-2">
                              {cp.progressPct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-4 sm:px-7 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    {prog.progress.isCompleted && prog.certificate ? (
                      <Link
                        href={`/${locale}/verify/${prog.certificate.id}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Award className="h-4 w-4" />
                        <span>View ORELSE Certificate</span>
                      </Link>
                    ) : (
                      <Link
                        href={`/${locale}/courses/${nextCourseSlug}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3E9BDB] hover:bg-[#3286bf] text-white text-xs font-semibold shadow-xs transition-colors"
                      >
                        <span>{prog.progress.overallProgressPct > 0 ? "Resume Module" : "Start Module"}</span>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}

                    <Link
                      href={`/${locale}/learn/messages`}
                      className="text-xs font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                      <span>Instructor Support</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
