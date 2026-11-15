"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Clock, BookOpen, User, Award, ChevronRight, GraduationCap } from "lucide-react";
import type { Course } from "@/lib/types";
import { brand } from "@/lib/brand";
import { formatDuration } from "@/lib/utils";

export interface CourseCardProps {
  course: Course;
  variant?: "default" | "compact";
}

export function CourseCard({ course, variant = "default" }: CourseCardProps) {
  const [imgError, setImgError] = useState(false);

  const categoryLabel =
    brand.categories.find((c) => c.id === course.category)?.label || course.category;

  const totalLessons =
    course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;
  const sectionCount = course.sections?.length || 0;

  const isCompact = variant === "compact";

  return (
    <article
      className="group relative flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#3E9BDB]"
      aria-labelledby={`course-title-${course.id}`}
    >
      {/* Thumbnail */}
      <div className={`relative w-full ${isCompact ? "aspect-[2/1]" : "aspect-[16/9]"} bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0`}>
        {!imgError && course.thumbnail ? (
          <Image
            src={course.thumbnail}
            alt={course.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#EAF4FC] to-[#d6ebfa] text-[#3E9BDB] p-4 text-center">
            <GraduationCap className="w-10 h-10 mb-1 opacity-80" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 line-clamp-1">
              {categoryLabel}
            </span>
          </div>
        )}

        {/* Category Pill Floating on Image */}
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/95 text-[#1F9E94] border border-[#1F9E94]/30 shadow-xs backdrop-blur-xs">
            {categoryLabel}
          </span>
        </div>

        {/* Level Badge Floating on Top Right */}
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold capitalize bg-white/90 text-slate-700 shadow-xs border border-gray-200 backdrop-blur-xs">
            {course.level}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className={`flex flex-col flex-1 ${isCompact ? "p-4" : "p-5"}`}>
        {/* Audience Group Badges */}
        {course.audienceGroups && course.audienceGroups.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {course.audienceGroups.slice(0, 3).map((group) => {
              const label =
                brand.learnerGroups[group as keyof typeof brand.learnerGroups] || group;
              return (
                <span
                  key={group}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-[#3E9BDB]/10 text-[#1d70a2] border border-[#3E9BDB]/20"
                >
                  {label}
                </span>
              );
            })}
            {course.audienceGroups.length > 3 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600">
                +{course.audienceGroups.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Course Title (Clickable card anchor) */}
        <h3
          id={`course-title-${course.id}`}
          className={`font-bold text-gray-900 group-hover:text-[#3E9BDB] transition-colors leading-snug mb-1.5 ${
            isCompact ? "text-base line-clamp-1" : "text-lg line-clamp-2"
          }`}
        >
          <Link href={`/courses/${course.slug}`} className="focus:outline-none">
            <span className="absolute inset-0 z-0" aria-hidden="true" />
            {course.title}
          </Link>
        </h3>

        {/* Subtitle (1 line, ellipsis overflow) */}
        <p className="text-xs text-gray-600 line-clamp-1 mb-3">
          {course.subtitle || course.excerpt}
        </p>

        {/* Instructor */}
        {course.instructor?.name && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-3">
            <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="line-clamp-1">{course.instructor.name}</span>
          </div>
        )}

        {/* Meta Stats Row */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 py-2.5 border-y border-gray-100 my-auto">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span>{formatDuration(course.durationMinutes)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">
              {sectionCount} {sectionCount === 1 ? "sec" : "secs"} · {totalLessons} {totalLessons === 1 ? "lesson" : "lessons"}
            </span>
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex items-center justify-between mt-3 pt-1 text-xs">
          {course.certificateAvailable ? (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Certificate available</span>
            </span>
          ) : (
            <span className="text-gray-400">Self-paced audit</span>
          )}

          <div
            className="inline-flex items-center gap-0.5 text-sm font-semibold text-[#3E9BDB] group-hover:text-[#2884c0] transition-colors relative z-10"
            aria-hidden="true"
          >
            <span>View Course</span>
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </article>
  );
}

export default CourseCard;
