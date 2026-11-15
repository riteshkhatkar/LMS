import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home, BookOpen } from "lucide-react";
import { brand } from "@/lib/brand";
import { mockDataProvider } from "@/lib/data/mock-provider";
import type { CourseFilters as CourseFiltersType, LearnerGroup, CourseLevel, CourseLanguage } from "@/lib/types";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { CourseFilters } from "@/components/courses/CourseFilters";
import { CourseFilterDrawer } from "@/components/courses/CourseFilterDrawer";
import { CourseSearchInput } from "@/components/courses/CourseSearchInput";

export const metadata: Metadata = {
  title: "Explore Online Courses | Learn LMS",
  description: "Find structured courses for FPOs, FPCs, students and Naval Officers.",
  robots: {
    index: true,
    follow: true,
  },
};

interface CoursesPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CoursesPage({ params, searchParams }: CoursesPageProps) {
  const { locale } = await params;
  const rawQuery = await searchParams;

  const search = typeof rawQuery.search === "string" ? rawQuery.search : undefined;
  const category = typeof rawQuery.category === "string" ? rawQuery.category : undefined;
  const level = typeof rawQuery.level === "string" ? (rawQuery.level as CourseLevel) : undefined;
  const language = typeof rawQuery.language === "string" ? (rawQuery.language as CourseLanguage) : undefined;
  const cert =
    typeof rawQuery.cert === "string"
      ? rawQuery.cert === "true" || rawQuery.cert === "1"
      : undefined;

  let audience: LearnerGroup[] | undefined = undefined;
  if (typeof rawQuery.audience === "string") {
    audience = rawQuery.audience.split(",").map((s) => s.trim()) as LearnerGroup[];
  } else if (Array.isArray(rawQuery.audience)) {
    audience = rawQuery.audience.flatMap((s) => s.split(",")).map((s) => s.trim()) as LearnerGroup[];
  }

  const currentFilters: CourseFiltersType = {
    search,
    audience,
    category,
    level,
    language,
    certificateAvailable: cert,
  };

  const courses = await mockDataProvider.getCourses(currentFilters);

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
    ],
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16">
      {/* Schema.org Breadcrumb JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Header & Hero Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-gray-500">
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
              <li className="font-semibold text-gray-800" aria-current="page">
                Courses
              </li>
            </ol>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#1F9E94] mb-2 bg-[#1F9E94]/10 px-2.5 py-0.5 rounded-full">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Course Catalog</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                Explore Courses
              </h1>
              <p className="mt-2 text-base text-gray-600 max-w-2xl">
                Find the right learning path for your role and goals.
              </p>
            </div>

            {/* Search Input Bar */}
            <div className="w-full md:w-auto shrink-0">
              <CourseSearchInput defaultValue={search} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Mobile Filter Trigger & Results Count Bar */}
        <div className="flex items-center justify-between gap-4 mb-6 lg:hidden">
          <CourseFilterDrawer currentFilters={currentFilters} />
          <p className="text-xs font-medium text-gray-600">
            Showing <strong className="text-gray-900">{courses.length}</strong> {courses.length === 1 ? "course" : "courses"}
          </p>
        </div>

        {/* Layout: Sidebar Filters + Results Grid */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0 sticky top-6">
            <CourseFilters currentFilters={currentFilters} />
          </aside>

          {/* Courses Results Column */}
          <main className="flex-1 w-full">
            <div className="hidden lg:flex items-center justify-between pb-4 mb-6 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <strong className="text-gray-900 font-bold">{courses.length}</strong> available {courses.length === 1 ? "course" : "courses"}
              </p>
              {currentFilters.category && (
                <span className="text-xs text-gray-500">
                  Filtered by Category: <span className="font-semibold text-gray-800">{brand.categories.find(c => c.id === currentFilters.category)?.label || currentFilters.category}</span>
                </span>
              )}
            </div>

            <CourseGrid courses={courses} clearFiltersHref={`/${locale}/courses`} />
          </main>
        </div>
      </div>
    </div>
  );
}
