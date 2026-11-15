import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { Course } from "@/lib/types";
import { CourseCard } from "@/components/courses/CourseCard";

interface FeaturedCoursesProps {
  courses: Course[];
}

export function FeaturedCourses({ courses }: FeaturedCoursesProps) {
  // Show up to 4 or 6 featured courses
  const featuredList = courses.slice(0, 4);

  return (
    <section aria-labelledby="featured-courses-heading" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#3E9BDB] mb-2">
              <Sparkles className="h-4 w-4" />
              Handpicked Learning Paths
            </div>
            <h2
              id="featured-courses-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A2E] tracking-tight"
            >
              Featured Courses
            </h2>
            <p className="mt-2 text-base text-slate-600">
              Start building in-demand skills with our top-rated practical modules.
            </p>
          </div>

          <Link
            href="/courses"
            className="mt-4 sm:mt-0 inline-flex items-center text-sm font-semibold text-[#3E9BDB] hover:text-[#2b88c7] transition-colors group"
          >
            View all courses
            <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {featuredList.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
            <p className="text-slate-600">No courses available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredList.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
