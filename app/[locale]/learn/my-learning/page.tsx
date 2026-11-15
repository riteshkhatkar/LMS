import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { brand } from "@/lib/brand";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ArrowRight,
  GraduationCap,
  PlayCircle,
  Award,
  ShieldCheck,
} from "lucide-react";
import { LearnerCertificateCard, ClaimCertificateCard } from "@/components/certificates/LearnerCertificateCard";

export const metadata: Metadata = {
  title: "My Learning | Learn LMS",
  description: "Track your course enrollments, lesson progress, and certificate achievements.",
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
}

export default async function MyLearningPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { tab = "all" } = await searchParams;

  const session = await getSession();
  if (!session) {
    redirect(`/${locale}/login?redirect=/${locale}/learn/my-learning`);
  }

  // Fetch user's enrollments with courses, sections, lessons, and quizzes
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.id },
    include: {
      course: {
        include: {
          quizzes: {
            where: { isPublished: true },
          },
          sections: {
            orderBy: { sortOrder: "asc" },
            include: {
              lessons: {
                orderBy: { sortOrder: "asc" },
              },
            },
          },
        },
      },
    },
    orderBy: { enrolledAt: "desc" },
  });

  // Fetch user's certificates
  const certificates = await prisma.certificate.findMany({
    where: { userId: session.id },
    orderBy: { issueDate: "desc" },
    include: {
      course: true,
    },
  });

  // Fetch eligible courses that do not yet have an issued certificate
  const issuedCourseIdSet = new Set(certificates.map((c) => c.courseId));
  const eligibleRecords = await prisma.certificateEligibility.findMany({
    where: { userId: session.id },
    include: {
      course: true,
    },
  });
  const unclaimedEligible = eligibleRecords.filter((el) => !issuedCourseIdSet.has(el.courseId));

  // Fetch completed activity progresses for this user
  const progresses = await prisma.activityProgress.findMany({
    where: { userId: session.id, completed: true },
    select: { lessonId: true },
  });
  const completedLessonIdSet = new Set(progresses.map((p) => p.lessonId));

  // Compute stats: completed strictly requires both lessons and passed final assessment
  const totalEnrolled = enrollments.length;
  const completedCourses = enrollments.filter(
    (e) => e.isCompleted || (e.progressPct >= 100 && e.assessmentStatus === "PASSED")
  );
  const inProgressCourses = enrollments.filter(
    (e) => !e.isCompleted && !(e.progressPct >= 100 && e.assessmentStatus === "PASSED")
  );

  // Filter based on tab
  const displayedEnrollments =
    tab === "completed"
      ? completedCourses
      : tab === "in-progress"
      ? inProgressCourses
      : enrollments;

  // Organization info
  let orgName: string | null = null;
  if (session.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
    });
    orgName = org?.name || null;
  }

  const groupLabel = session.learnerGroup
    ? brand.learnerGroups[session.learnerGroup] || session.learnerGroup
    : "Learner";

  return (
    <div className="py-8 sm:py-12 bg-slate-50 min-h-[calc(100vh-160px)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Learner Profile Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#EAF4FC] text-[#3E9BDB] border border-[#3E9BDB]/20">
                {groupLabel}
              </span>
              {orgName && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {orgName}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E] tracking-tight">
              Welcome back, {session.name}
            </h1>
            <p className="text-sm text-slate-600">
              Continue your courses and track your path to verified certification.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 shrink-0">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-[#1A1A2E]">{totalEnrolled}</div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Enrolled
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-[#3E9BDB]">
                {inProgressCourses.length}
              </div>
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Active
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-black text-[#1F9E94]">
                {completedCourses.length}
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
              href={`/${locale}/learn/my-learning?tab=all`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "all"
                  ? "bg-[#3E9BDB] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              All Courses ({totalEnrolled})
            </Link>
            <Link
              href={`/${locale}/learn/my-learning?tab=in-progress`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "in-progress"
                  ? "bg-[#3E9BDB] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              In Progress ({inProgressCourses.length})
            </Link>
            <Link
              href={`/${locale}/learn/my-learning?tab=completed`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === "completed"
                  ? "bg-[#3E9BDB] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              Completed ({completedCourses.length})
            </Link>
            <Link
              href={`/${locale}/learn/my-learning?tab=certificates`}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-1.5 ${
                tab === "certificates"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white"
              }`}
            >
              <Award className="h-4 w-4" />
              <span>My Certificates ({certificates.length})</span>
            </Link>
          </div>

          <Link
            href={`/${locale}/courses`}
            className="text-sm font-semibold text-[#3E9BDB] hover:text-[#3286bf] flex items-center gap-1"
          >
            <span>Explore catalog</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Tab Content */}
        {tab === "certificates" ? (
          <div className="space-y-8">
            {/* Unclaimed Eligible Courses */}
            {unclaimedEligible.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <Award className="h-4 w-4 text-amber-600" />
                  <span>Eligible for Certificate Issuance ({unclaimedEligible.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unclaimedEligible.map((rec) => (
                    <ClaimCertificateCard
                      key={rec.id}
                      eligibilityId={rec.id}
                      courseId={rec.courseId}
                      courseTitle={rec.course.title}
                      finalScore={rec.finalScore}
                      grade={rec.grade}
                      completedAt={rec.completedAt.toISOString()}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Issued Certificates */}
            {certificates.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Official ORELSE Certificates ({certificates.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {certificates.map((cert) => (
                    <LearnerCertificateCard
                      key={cert.id}
                      certificate={{
                        id: cert.id,
                        courseTitle: cert.course.title,
                        issueDate: cert.issueDate.toISOString(),
                        grade: cert.grade,
                        scorePercent: cert.scorePercent,
                        status: cert.status,
                        provisional: cert.provisional,
                        ledgerMode: cert.ledgerMode,
                        issuer: cert.issuer,
                      }}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            ) : unclaimedEligible.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Award className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-[#1A1A2E]">
                    No certificates earned yet
                  </h2>
                  <p className="text-xs text-slate-500">
                    Complete all lessons in a course and pass the final assessment to earn an institutional ORELSE digital credential.
                  </p>
                </div>
                <Link
                  href={`/${locale}/learn/my-learning?tab=in-progress`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#3E9BDB] hover:bg-[#3286bf] text-white text-sm font-semibold transition-colors shadow-xs"
                >
                  <span>Continue Learning</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>
        ) : displayedEnrollments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedEnrollments.map((enr) => {
              const { course } = enr;
              const allLessons = course.sections.flatMap((s) => s.lessons);
              const totalLessons = allLessons.length;
              const completedLessons = allLessons.filter((l) =>
                completedLessonIdSet.has(l.id)
              ).length;

              // Find first incomplete lesson to resume, or fallback to first lesson
              const resumeLesson =
                allLessons.find((l) => !completedLessonIdSet.has(l.id)) || allLessons[0];

              const finalQuiz = course.quizzes.find((q) => q.type === "FINAL");

              const isCourseCompleted =
                enr.isCompleted || (enr.progressPct >= 100 && enr.assessmentStatus === "PASSED");
              const isAssessmentPassed = enr.assessmentStatus === "PASSED";
              const isAssessmentFailed = enr.assessmentStatus === "FAILED";
              const isReadyForAssessment =
                !isAssessmentPassed &&
                !isAssessmentFailed &&
                enr.progressPct >= course.requiredContentPercent;

              return (
                <div
                  key={enr.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                >
                  {/* Thumbnail Banner */}
                  <div className="relative h-44 w-full bg-slate-100">
                    <Image
                      src={course.thumbnail || "/images/course-app-training.svg"}
                      alt={course.title}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/95 text-slate-800 shadow-xs">
                        {course.category}
                      </span>
                    </div>

                    {/* Status Pill Badge */}
                    <div className="absolute top-3 right-3 shadow-xs">
                      {isCourseCompleted ? (
                        <div className="bg-emerald-600 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Completed {enr.finalGrade ? `· ${enr.finalGrade}` : ""}</span>
                        </div>
                      ) : isAssessmentPassed ? (
                        <div className="bg-teal-600 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                          Assessment Passed
                        </div>
                      ) : isAssessmentFailed ? (
                        <div className="bg-red-600 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                          Assessment Failed
                        </div>
                      ) : isReadyForAssessment ? (
                        <div className="bg-purple-600 text-white px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
                          Ready for Final Assessment
                        </div>
                      ) : (
                        <div className="bg-[#3E9BDB] text-white px-2.5 py-1 rounded-full text-xs font-bold">
                          In Progress
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-[#1A1A2E] leading-snug line-clamp-2">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {course.subtitle}
                      </p>
                    </div>

                    {/* Progress Bar & Details */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                          <span className="text-slate-600">Learning Progress</span>
                          <span className="text-[#3E9BDB] font-bold">
                            {Math.round(enr.progressPct)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#3E9BDB] h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.round(enr.progressPct)}%` }}
                          />
                        </div>
                        <div className="mt-1 text-[11px] text-slate-500 flex justify-between">
                          <span>
                            {completedLessons} of {totalLessons} lessons completed
                          </span>
                          {enr.finalScore !== null && (
                            <span className="font-bold text-purple-700">
                              Assessment Score: {Math.round(enr.finalScore)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action CTA */}
                      {isReadyForAssessment && finalQuiz ? (
                        <Link
                          href={`/${locale}/learn/course/${course.id}/quiz/${finalQuiz.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition-colors shadow-xs"
                        >
                          <PlayCircle className="h-4 w-4" />
                          <span>Take Final Assessment</span>
                        </Link>
                      ) : isAssessmentFailed && finalQuiz ? (
                        <Link
                          href={`/${locale}/learn/course/${course.id}/quiz/${finalQuiz.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-xs"
                        >
                          <PlayCircle className="h-4 w-4" />
                          <span>Retake Final Assessment</span>
                        </Link>
                      ) : resumeLesson ? (
                        <Link
                          href={`/${locale}/learn/course/${course.id}/lesson/${resumeLesson.id}`}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#3E9BDB] hover:bg-[#3286bf] text-white text-sm font-semibold transition-colors shadow-xs"
                        >
                          <PlayCircle className="h-4 w-4" />
                          <span>{isCourseCompleted ? "Review Lessons" : "Resume Learning"}</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/${locale}/courses/${course.slug}`}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold transition-colors"
                        >
                          <span>View Course Overview</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <BookOpen className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#1A1A2E]">
                {tab === "completed"
                  ? "No completed courses yet"
                  : tab === "in-progress"
                  ? "No in-progress courses"
                  : "You haven't enrolled in any courses yet"}
              </h2>
              <p className="text-xs text-slate-500">
                Browse our catalog of structured courses and start learning today.
              </p>
            </div>
            <Link
              href={`/${locale}/courses`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#3E9BDB] hover:bg-[#3286bf] text-white text-sm font-semibold transition-colors shadow-xs"
            >
              <span>Explore Courses</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
