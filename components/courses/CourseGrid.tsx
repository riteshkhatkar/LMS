import React from "react";
import Link from "next/link";
import { SearchX, RotateCcw } from "lucide-react";
import type { Course } from "@/lib/types";
import { CourseCard } from "./CourseCard";

export interface CourseGridProps {
  courses: Course[];
  loading?: boolean;
  clearFiltersHref?: string;
}

function CourseSkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs animate-pulse flex flex-col">
      <div className="w-full aspect-[16/9] bg-gray-200" />
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex gap-2 mb-3">
            <div className="h-5 w-20 bg-gray-200 rounded-full" />
            <div className="h-5 w-16 bg-gray-200 rounded-md" />
          </div>
          <div className="h-5 w-11/12 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-3/4 bg-gray-200 rounded mb-3" />
          <div className="h-3 w-1/3 bg-gray-200 rounded mb-4" />
        </div>
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="h-4 w-24 bg-gray-200 rounded" />
          <div className="h-4 w-20 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}

export function CourseGrid({ courses, loading = false, clearFiltersHref = "/courses" }: CourseGridProps) {
  if (loading) {
    return (
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        aria-busy="true"
        aria-label="Loading courses"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <CourseSkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center flex flex-col items-center justify-center my-6">
        <div className="w-16 h-16 rounded-full bg-[#EAF4FC] flex items-center justify-center text-[#3E9BDB] mb-4">
          <SearchX className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">No courses match your filters</h3>
        <p className="text-sm text-gray-600 max-w-md mb-6">
          We couldn&apos;t find any courses matching your current search or filter settings. Try broadening your criteria or reset all filters.
        </p>
        <Link
          href={clearFiltersHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#3E9BDB] hover:bg-[#2884c0] text-white text-sm font-semibold shadow-xs transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Clear all filters</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}

export default CourseGrid;
