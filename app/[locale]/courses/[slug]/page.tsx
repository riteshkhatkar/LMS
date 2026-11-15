import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  Home,
  Clock,
  BookOpen,
  Award,
  Globe,
  BarChart,
  Calendar,
  CheckCircle2,
  Users,
  AlertCircle,
  FileCheck,
  Timer,
  RotateCcw,
  Sparkles,
  Info,
  GraduationCap,
} from "lucide-react";
import { brand } from "@/lib/brand";
import { mockDataProvider } from "@/lib/data/mock-provider";
import { formatDuration, formatDate } from "@/lib/utils";
import { CurriculumAccordion } from "@/components/courses/CurriculumAccordion";
import { ShareCourseButton } from "@/components/courses/ShareCourseButton";
import { EnrollButton } from "@/components/courses/EnrollButton";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateStaticParams() {
  const courses = await mockDataProvider.getCourses();
  return brand.supportedLocales.flatMap((locale) =>
    courses.map((course) => ({
      locale,
      slug: course.slug,
    }))
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = await mockDataProvider.getCourseBySlug(slug);

  if (!course) {
    return {
      title: "Course Not Found | Learn LMS",
    };
  }

  return {
    title: `${course.title} | Learn LMS`,
    description: course.excerpt || course.subtitle || course.description.slice(0, 160),
    robots: {
      index: true,
      follow: true,
    },
  };
}

function formatLanguage(lang: string): string {
  switch (lang) {
    case "en":
      return "English";
    case "hi":
      return "Hindi (हिंदी)";
    case "mr":
      return "Marathi (मराठी)";
    case "en-hi":
      return "Bilingual (English / Hindi)";
    case "en-mr":
      return "Bilingual (English / Marathi)";
    default:
      return lang;
  }
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const course = await mockDataProvider.getCourseBySlug(slug);

  if (!course) {
    notFound();
  }

  const session = await getSession();
  let isEnrolled = false;
  let firstLessonId = "";
  let dbCourseId = course.id;

  try {
    const dbCourse = await prisma.course.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
          include: {
            lessons: { orderBy: { sortOrder: "asc" } },
          },
        },
      },
    });

    if (dbCourse) {
      dbCourseId = dbCourse.id;
      firstLessonId = dbCourse.sections[0]?.lessons[0]?.id || "";
      if (session) {
        const enr = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId: session.id,
              courseId: dbCourse.id,
            },
          },
        });
        isEnrolled = !!enr;
      }
    }
  } catch (err) {
    console.error("Error checking db course enrollment:", err);
  }

  const categoryObj = brand.categories.find((c) => c.id === course.category);
  const categoryLabel = categoryObj ? categoryObj.label : course.category;

  const totalLessons = course.sections.reduce(
    (acc, s) => acc + (s.lessons?.length || 0),
    0
  );

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `${brand.domain}/${locale}`,
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Courses",
        "item": `${brand.domain}/${locale}/courses`,
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": course.title,
        "item": `${brand.domain}/${locale}/courses/${course.slug}`,
      },
    ],
  };

  const courseJsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.excerpt || course.subtitle,
    provider: {
      "@type": "Organization",
      name: brand.name,
      sameAs: brand.domain,
    },
    educationalLevel: course.level,
    inLanguage: course.language,
    timeRequired: `PT${course.durationMinutes}M`,
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />

      {/* Top Breadcrumb & Hero Area */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center flex-wrap gap-1.5 text-xs text-gray-500">
              <li>
                <Link
                  href={`/${locale}`}
                  className="flex items-center gap-1 hover:text-[#3E9BDB] transition-colors"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>Home</span>
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </li>
              <li>
                <Link
                  href={`/${locale}/courses`}
                  className="hover:text-[#3E9BDB] transition-colors"
                >
                  Courses
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              </li>
              <li className="font-semibold text-gray-900 truncate max-w-xs sm:max-w-md" aria-current="page">
                {course.title}
              </li>
            </ol>
          </nav>

          {/* Category & Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#1F9E94]/10 text-[#1F9E94] border border-[#1F9E94]/20">
              {categoryLabel}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize bg-slate-100 text-slate-700">
              {course.level}
            </span>
            {course.certificateAvailable && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Award className="w-3 h-3 text-emerald-600" />
                Certificate Available
              </span>
            )}
          </div>

          {/* Title & Subtitle */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-3">
            {course.title}
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl leading-relaxed mb-6">
            {course.subtitle || course.excerpt}
          </p>

          {/* Meta Row */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-gray-600 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-400">Instructor:</span>
              <strong className="font-semibold text-gray-800">{course.instructor.name}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-gray-400" />
              <span>{formatLanguage(course.language)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span>Last updated: {formatDate(course.lastUpdated)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Layout: 2 Columns on Desktop */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Main Course Information (8 cols) */}
          <main className="lg:col-span-8 space-y-10">
            {/* Overview / Description */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Course Overview</h2>
              <div className="prose prose-slate max-w-none text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {course.description}
              </div>
            </section>

            {/* What you'll learn */}
            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles className="w-5 h-5 text-[#3E9BDB]" />
                  <h2 className="text-xl font-bold text-gray-900">What You&apos;ll Learn</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {course.learningOutcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />
                      <span className="text-sm text-gray-700 leading-snug">{outcome}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Course Curriculum Accordion */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#1F9E94]" />
                  <h2 className="text-xl font-bold text-gray-900">Course Curriculum</h2>
                </div>
                <span className="text-xs font-medium text-gray-500">
                  {formatDuration(course.durationMinutes)} total
                </span>
              </div>
              <CurriculumAccordion sections={course.sections} />
            </section>

            {/* Who this course is for */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-[#EE8A2B]" />
                <h2 className="text-xl font-bold text-gray-900">Who This Course Is For</h2>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {course.audienceGroups.map((group) => {
                  const label =
                    brand.learnerGroups[group as keyof typeof brand.learnerGroups] || group;
                  return (
                    <span
                      key={group}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-[#3E9BDB]/10 text-[#1d70a2] border border-[#3E9BDB]/20"
                    >
                      {label}
                    </span>
                  );
                })}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                This curriculum is tailored to the operational needs of agricultural collective teams, producer groups, students, and supervisory naval officers seeking practical competencies and verifiable records of achievement.
              </p>
            </section>

            {/* Requirements / Prerequisites */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-bold text-gray-900">Requirements &amp; Prerequisites</h2>
              </div>
              {course.prerequisites && course.prerequisites.length > 0 ? (
                <ul className="space-y-2.5">
                  {course.prerequisites.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#3E9BDB] mt-2 shrink-0" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">
                  No prior experience required. Suitable for all registered participants.
                </p>
              )}
            </section>

            {/* About the Assessment */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold text-gray-900">About the Assessment</h2>
              </div>
              <p className="text-xs text-gray-500 mb-6">
                Understand the evaluation standards required to complete this course and unlock your digital credential.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Passing Score */}
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-600 mb-1">
                    <BarChart className="w-4 h-4 text-[#3E9BDB]" />
                    <span>Pass Mark</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {course.assessmentPolicy.passingScorePercent}% required
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Calculated across required assessment questions
                  </p>
                </div>

                {/* Allowed Attempts */}
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-600 mb-1">
                    <RotateCcw className="w-4 h-4 text-[#EE8A2B]" />
                    <span>Attempts Allowed</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {course.assessmentPolicy.maxAttempts} {course.assessmentPolicy.maxAttempts === 1 ? "attempt" : "attempts"} allowed
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Highest passing score recorded
                  </p>
                </div>

                {/* Time Limit */}
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-600 mb-1">
                    <Timer className="w-4 h-4 text-[#1F9E94]" />
                    <span>Time Limit</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {course.assessmentPolicy.timeLimitMinutes !== null && course.assessmentPolicy.timeLimitMinutes > 0
                      ? `${course.assessmentPolicy.timeLimitMinutes} minutes`
                      : "No time limit"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {course.assessmentPolicy.timeLimitMinutes !== null
                      ? "Paced countdown once started"
                      : "Work through questions at your own speed"}
                  </p>
                </div>

                {/* Certificate Policy */}
                <div className="p-4 rounded-xl bg-slate-50 border border-gray-200">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase text-gray-600 mb-1">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>Certification</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {course.assessmentPolicy.certificateOnPass
                      ? "Certificate issued on passing"
                      : "Self-paced audit only"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {course.assessmentPolicy.requiredContentPercent}% course completion required
                  </p>
                </div>
              </div>
            </section>

            {/* About the Instructor */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-gray-900">About the Instructor</h2>
                <span className="demo-badge">
                  (Demo persona — not a real person)
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4 pt-2">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#3E9BDB] to-[#1F9E94] flex items-center justify-center text-white font-bold text-xl shrink-0 shadow-xs">
                  {course.instructor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{course.instructor.name}</h3>
                  <p className="text-xs font-medium text-[#1F9E94] mb-2">{course.instructor.title}</p>
                  <p className="text-sm text-gray-600 leading-relaxed">{course.instructor.bio}</p>
                </div>
              </div>
            </section>

            {/* FAQs */}
            <section className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 mb-6">
                <Info className="w-5 h-5 text-[#3E9BDB]" />
                <h2 className="text-xl font-bold text-gray-900">Frequently Asked Questions</h2>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-100 rounded-xl p-4 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Who should take this course?
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    This course is designed for {course.audienceGroups.map((g) => brand.learnerGroups[g as keyof typeof brand.learnerGroups] || g).join(", ")}. Whether you are new to the subject or looking to standardize processes, this curriculum provides step-by-step guidance.
                  </p>
                </div>

                <div className="border border-gray-100 rounded-xl p-4 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    How do I earn the verifiable certificate?
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {course.assessmentPolicy.certificateOnPass
                      ? `You must complete at least ${course.assessmentPolicy.requiredContentPercent}% of the lesson materials and score ${course.assessmentPolicy.passingScorePercent}% or higher on the final quiz. Once passed, your certificate ID is issued and can be verified via the platform ledger.`
                      : "This course is offered as an informational audit module and does not issue a verified certificate upon completion."}
                  </p>
                </div>

                <div className="border border-gray-100 rounded-xl p-4 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Can I review lessons without enrolling?
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    Yes. Any lesson marked with the &quot;Preview&quot; badge in the curriculum outline can be accessed freely to help you evaluate if the course matches your training requirements.
                  </p>
                </div>

                <div className="border border-gray-100 rounded-xl p-4 bg-slate-50/50">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    What happens if I don&apos;t pass the quiz on my first try?
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    You have up to {course.assessmentPolicy.maxAttempts} attempts to achieve the {course.assessmentPolicy.passingScorePercent}% pass score. You can re-read the course materials and try again whenever you are ready.
                  </p>
                </div>
              </div>
            </section>
          </main>

          {/* RIGHT COLUMN: Sticky Sidebar Actions & Facts (4 cols) */}
          <aside className="lg:col-span-4 sticky top-6 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Thumbnail Container */}
              <div className="relative w-full aspect-video bg-gradient-to-br from-slate-100 to-slate-200">
                {course.thumbnail ? (
                  <Image
                    src={course.thumbnail}
                    alt={course.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 380px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EAF4FC] to-[#d6ebfa] text-[#3E9BDB]">
                    <GraduationCap className="w-12 h-12 mb-1" />
                    <span className="text-xs font-semibold uppercase">{categoryLabel}</span>
                  </div>
                )}
              </div>

              {/* Sidebar Action Block */}
              <div className="p-6">
                <EnrollButton
                  locale={locale}
                  courseId={dbCourseId}
                  courseSlug={course.slug}
                  firstLessonId={firstLessonId}
                  isEnrolled={isEnrolled}
                  isLoggedIn={!!session}
                />

                <p className="text-center text-xs text-gray-500 mt-2.5">
                  {isEnrolled ? "You are enrolled in this course" : "Free instant enrollment"}
                </p>

                {/* Course Quick Highlights Table */}
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3.5 text-xs text-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Duration
                    </span>
                    <strong className="font-semibold text-gray-900">
                      {formatDuration(course.durationMinutes)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-500">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      Curriculum
                    </span>
                    <strong className="font-semibold text-gray-900">
                      {course.sections.length} sections · {totalLessons} lessons
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-500">
                      <FileCheck className="w-4 h-4 text-gray-400" />
                      Quizzes &amp; Tests
                    </span>
                    <strong className="font-semibold text-gray-900">
                      {course.quizCount} assessments
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Award className="w-4 h-4 text-gray-400" />
                      Certificate
                    </span>
                    <strong className="font-semibold text-gray-900">
                      {course.certificateAvailable ? "Issued on passing" : "None"}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Globe className="w-4 h-4 text-gray-400" />
                      Language
                    </span>
                    <strong className="font-semibold text-gray-900">
                      {formatLanguage(course.language)}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-500">
                      <BarChart className="w-4 h-4 text-gray-400" />
                      Difficulty Level
                    </span>
                    <strong className="font-semibold text-gray-900 capitalize">
                      {course.level}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-gray-500">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      Last Updated
                    </span>
                    <strong className="font-semibold text-gray-900">
                      {formatDate(course.lastUpdated)}
                    </strong>
                  </div>
                </div>

                {/* Share Link Button */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <ShareCourseButton />
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
