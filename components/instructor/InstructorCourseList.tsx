"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertCircle,
  Lock,
  Globe,
  Loader2,
  Users,
  Layers,
} from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  durationMinutes: number;
  level: string;
  targetAudience: string;
  publishStatus: "draft" | "published" | "archived";
  isRestricted: boolean;
  createdAt: string;
  sections?: { id: string; lessons: any[] }[];
  quizzes?: any[];
  enrollments?: any[];
  _count?: {
    sections: number;
    enrollments: number;
    quizzes: number;
  };
}

interface Props {
  initialCourses?: CourseItem[];
  locale: string;
}

export function InstructorCourseList({ initialCourses = [], locale }: Props) {
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/instructor/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to reload courses." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCourses.length === 0) {
      fetchCourses();
    }
  }, []);

  const handleTogglePublish = async (course: CourseItem) => {
    const newStatus = course.publishStatus === "published" ? "draft" : "published";

    try {
      const res = await fetch(`/api/instructor/courses/${course.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishStatus: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update publication status");
      }

      setMessage({
        type: "success",
        text: `Course ${course.title} is now ${newStatus}.`,
      });
      await fetchCourses();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#1A1A2E] flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#1F9E94]" />
            Authorized Course Roster
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review, publish, and inspect curriculums and student enrollments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCourses}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh courses"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search your courses by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1F9E94]"
          />
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Course Title</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Target Audience</th>
                <th className="px-5 py-3.5 text-center">Curriculum Units</th>
                <th className="px-5 py-3.5 text-center">Publication Status</th>
                <th className="px-5 py-3.5 text-center">Learners</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((course) => {
                  const sectionCount =
                    course.sections?.length ?? course._count?.sections ?? 0;
                  const enrollmentCount =
                    course.enrollments?.length ?? course._count?.enrollments ?? 0;

                  return (
                    <tr key={course.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {course.title}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">/{course.slug}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {formatDuration(course.durationMinutes)} · {course.level}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                          {course.category}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-800">
                          {course.isRestricted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Lock className="h-3 w-3" />
                              Restricted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                              <Globe className="h-3 w-3 text-slate-400" />
                              {course.targetAudience}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-center font-bold text-xs text-slate-800">
                        {sectionCount} Modules
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            course.publishStatus === "published"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-amber-100 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {course.publishStatus}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center font-bold text-xs text-[#3E9BDB]">
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {enrollmentCount}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/${locale}/courses/${course.slug}`}
                            target="_blank"
                            className="p-1.5 text-slate-400 hover:text-[#1F9E94]"
                            title="Preview public course"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleTogglePublish(course)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors border ${
                              course.publishStatus === "published"
                                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {course.publishStatus === "published" ? "Unpublish" : "Publish"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-500">
                    No courses match the active query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
