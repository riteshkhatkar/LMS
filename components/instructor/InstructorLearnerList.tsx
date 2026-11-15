"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  RefreshCw,
  Award,
  CheckCircle2,
  Clock,
  Building,
  GraduationCap,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LearnerItem {
  id: string;
  name: string | null;
  email: string;
  learnerGroup: string | null;
  organization?: string | null;
  courseId: string;
  courseTitle: string;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  quizScore?: number | null;
  quizPassed?: boolean | null;
  certStatus?: string | null;
  enrolledAt: string;
}

interface Props {
  initialLearners?: LearnerItem[];
  courses: { id: string; title: string }[];
}

export function InstructorLearnerList({ initialLearners = [], courses = [] }: Props) {
  const [learners, setLearners] = useState<LearnerItem[]>(initialLearners);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("ALL");

  const fetchLearners = async () => {
    setLoading(true);
    try {
      const courseQuery = selectedCourseId !== "ALL" ? `?courseId=${selectedCourseId}` : "";
      const res = await fetch(`/api/instructor/courses/${selectedCourseId === "ALL" ? courses[0]?.id || "all" : selectedCourseId}/learners`);
      if (res.ok) {
        const data = await res.json();
        setLearners(data);
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const filtered = learners.filter((l) => {
    const matchesSearch =
      (l.name || "").toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.courseTitle.toLowerCase().includes(search.toLowerCase());

    const matchesCourse = selectedCourseId === "ALL" || l.courseId === selectedCourseId;

    return matchesSearch && matchesCourse;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#1A1A2E] flex items-center gap-2">
            <Users className="h-5 w-5 text-[#3E9BDB]" />
            Learner Progress &amp; Grade Book
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Monitor real-time lesson progress, assessment results, and qualification across enrolled personnel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLearners}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search learner name, email, or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#3E9BDB]"
          />
        </div>

        <div>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Enrolled Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Learners Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Learner</th>
                <th className="px-5 py-3.5">Course</th>
                <th className="px-5 py-3.5">Affiliation &amp; Group</th>
                <th className="px-5 py-3.5 text-center">Curriculum Progress</th>
                <th className="px-5 py-3.5 text-center">Assessment Result</th>
                <th className="px-5 py-3.5 text-center">Certificate</th>
                <th className="px-5 py-3.5 text-right">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((l, idx) => (
                  <tr key={`${l.id}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {l.name || "Learner"}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{l.email}</div>
                    </td>

                    <td className="px-5 py-4 text-xs font-semibold text-slate-800 max-w-[200px] truncate">
                      {l.courseTitle}
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-xs text-slate-800 font-medium">
                        {l.organization || "Independent"}
                      </div>
                      <div className="text-[10px] text-slate-400">{l.learnerGroup || "—"}</div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <div className="space-y-1">
                        <div className="text-xs font-bold text-slate-900">
                          {l.progressPercent}%
                        </div>
                        <div className="w-24 mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-[#1F9E94] h-full rounded-full"
                            style={{ width: `${l.progressPercent}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {l.completedLessons}/{l.totalLessons} lessons
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      {l.quizScore !== null && l.quizScore !== undefined ? (
                        <div>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              l.quizPassed
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {Math.round(l.quizScore)}% ({l.quizPassed ? "PASS" : "FAIL"})
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {l.certStatus ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <Award className="h-3 w-3" />
                          {l.certStatus}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-right text-xs text-slate-500">
                      {formatDate(l.enrolledAt)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-500">
                    No learners currently enrolled matching search.
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
