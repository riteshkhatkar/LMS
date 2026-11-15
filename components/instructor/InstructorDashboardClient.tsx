"use client";

import React, { useState } from "react";
import Link from "next/link";
import { InstructorPortalLayout, InstructorTab } from "./InstructorPortalLayout";
import { CourseWizard } from "./CourseWizard";
import { InstructorCourseList } from "./InstructorCourseList";
import { InstructorTrainingViewer } from "./InstructorTrainingViewer";
import { InstructorLearnerList } from "./InstructorLearnerList";
import { QuizAuthorModal } from "./QuizAuthorModal";
import { InstructorCommunicationManager } from "./InstructorCommunicationManager";
import {
  GraduationCap,
  BookOpen,
  Users,
  HelpCircle,
  Award,
  ArrowRight,
  Eye,
  PlusCircle,
} from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";

interface Props {
  userEmail: string;
  userName: string;
  userRole: string;
  locale: string;
  courses: any[];
  recentStudentAttempts: any[];
  categories: any[];
}

export function InstructorDashboardClient({
  userEmail,
  userName,
  userRole,
  locale,
  courses,
  recentStudentAttempts,
  categories,
}: Props) {
  const [currentTab, setCurrentTab] = useState<InstructorTab>("overview");

  const totalCourses = courses.length;
  const totalLearners = courses.reduce((acc, c) => acc + (c.enrollments?.length ?? 0), 0);
  const totalQuizzes = courses.reduce((acc, c) => acc + (c.quizzes?.length ?? 0), 0);

  // Prepare flattened learners list for the learner tab
  const initialLearners = courses.flatMap((c) =>
    (c.enrollments || []).map((en: any) => ({
      id: en.user.id,
      name: en.user.name,
      email: en.user.email,
      learnerGroup: en.user.learnerGroup,
      organization: en.user.organization?.name,
      courseId: c.id,
      courseTitle: c.title,
      progressPercent: Math.round(en.progressPercent || 0),
      completedLessons: 0,
      totalLessons: c.sections?.flatMap((s: any) => s.lessons).length || 0,
      enrolledAt: en.enrolledAt.toString(),
    }))
  );

  return (
    <InstructorPortalLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      userEmail={userEmail}
      userName={userName}
      locale={locale}
    >
      {/* 1. OVERVIEW TAB */}
      {currentTab === "overview" && (
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl border border-teal-200/80 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-[#1F9E94] border border-[#1F9E94]/30">
                  Instructor Studio
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {userRole}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E] tracking-tight">
                {userName}
              </h1>
              <p className="text-sm text-slate-600">
                Manage training curriculums, author assessments, and inspect learner performance.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentTab("wizard")}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1F9E94] hover:bg-[#1a857d] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Create Course</span>
              </button>

              <QuizAuthorModal
                courses={courses.map((c) => ({
                  id: c.id,
                  title: c.title,
                  sections: (c.sections || []).map((s: any) => ({ id: s.id, title: s.title })),
                }))}
              />
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setCurrentTab("courses")}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs text-left hover:border-[#1F9E94] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Courses</span>
                <BookOpen className="h-4 w-4 text-[#1F9E94]" />
              </div>
              <div className="text-3xl font-black text-[#1F9E94]">{totalCourses}</div>
              <div className="text-xs text-slate-500 mt-1">Authorized Curriculums</div>
            </button>

            <button
              onClick={() => setCurrentTab("quizzes")}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs text-left hover:border-[#8E6BBF] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Assessments</span>
                <HelpCircle className="h-4 w-4 text-[#8E6BBF]" />
              </div>
              <div className="text-3xl font-black text-[#8E6BBF]">{totalQuizzes}</div>
              <div className="text-xs text-slate-500 mt-1">In-Course &amp; Final Exams</div>
            </button>

            <button
              onClick={() => setCurrentTab("learners")}
              className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs text-left hover:border-[#3E9BDB] transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Learners</span>
                <Users className="h-4 w-4 text-[#3E9BDB]" />
              </div>
              <div className="text-3xl font-black text-[#3E9BDB]">{totalLearners}</div>
              <div className="text-xs text-slate-500 mt-1">Active Course Enrollments</div>
            </button>
          </div>

          {/* Recent Learner Submissions */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1A1A2E]">
                  Recent Learner Assessment Submissions
                </h3>
                <p className="text-xs text-slate-500">
                  Scores recorded across your courses and quizzes.
                </p>
              </div>
              <span className="text-xs text-slate-500">
                {recentStudentAttempts.length} Recent Submissions
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Learner</th>
                    <th className="px-5 py-3.5">Assessment</th>
                    <th className="px-5 py-3.5 text-center">Score</th>
                    <th className="px-5 py-3.5 text-center">Result</th>
                    <th className="px-5 py-3.5 text-center">Grade</th>
                    <th className="px-5 py-3.5 text-right">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentStudentAttempts.length > 0 ? (
                    recentStudentAttempts.map((att: any) => (
                      <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {att.user.name}
                          </div>
                          <div className="text-[11px] text-slate-500">{att.user.email}</div>
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-slate-800">
                          <div>{att.quiz.title}</div>
                          <div className="text-[10px] text-slate-500">
                            {att.quiz.course?.title}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-xs">
                          {att.scorePercent !== null ? `${Math.round(att.scorePercent)}%` : "—"}
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              att.passed
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {att.passed ? "PASSED" : "FAILED"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center text-xs font-bold text-[#8E6BBF]">
                          {att.grade ? `Grade ${att.grade}` : att.passed ? "Pass" : "—"}
                        </td>
                        <td className="px-5 py-4 text-right text-xs text-slate-500">
                          {formatDate(att.createdAt.toString())}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-500">
                        No learner assessments submitted yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. COURSE WIZARD TAB */}
      {currentTab === "wizard" && (
        <CourseWizard
          categories={categories}
          onCourseCreated={() => {
            setCurrentTab("courses");
          }}
        />
      )}

      {/* 3. COURSES TAB */}
      {currentTab === "courses" && (
        <InstructorCourseList initialCourses={courses} locale={locale} />
      )}

      {/* PHASE 7: ASSIGNED TRAINING TRACKS TAB */}
      {currentTab === "training" && <InstructorTrainingViewer />}

      {/* 4. LEARNERS TAB */}
      {currentTab === "learners" && (
        <InstructorLearnerList
          initialLearners={initialLearners}
          courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        />
      )}

      {/* 5. QUIZZES TAB */}
      {currentTab === "quizzes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div>
              <h2 className="text-xl font-extrabold text-[#1A1A2E] flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-[#8E6BBF]" />
                Course Assessment Registry
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Author and manage question banks for quizzes and final qualification exams.
              </p>
            </div>

            <QuizAuthorModal
              courses={courses.map((c) => ({
                id: c.id,
                title: c.title,
                sections: (c.sections || []).map((s: any) => ({ id: s.id, title: s.title })),
              }))}
            />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Assessment Title</th>
                    <th className="px-5 py-3.5">Course</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5 text-center">Questions</th>
                    <th className="px-5 py-3.5 text-center">Passing %</th>
                    <th className="px-5 py-3.5 text-center">Timer</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.flatMap((c) =>
                    (c.quizzes || []).map((q: any) => (
                      <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4 font-bold text-slate-900 text-xs sm:text-sm">
                          {q.title}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-600 truncate max-w-[200px]">
                          {c.title}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                              q.type === "FINAL"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-teal-100 text-teal-800"
                            }`}
                          >
                            {q.type === "FINAL" ? "Final Exam" : "In-Course"}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center font-bold text-xs">
                          {q.questions?.length ?? 0}
                        </td>
                        <td className="px-5 py-4 text-center text-xs font-semibold">
                          {q.passingPercent}%
                        </td>
                        <td className="px-5 py-4 text-center text-xs text-slate-500">
                          {q.timeLimitSec ? `${Math.floor(q.timeLimitSec / 60)} min` : "No limit"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/${locale}/learn/course/${c.id}/quiz/${q.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F9E94] hover:underline"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>Preview</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 6. COMMUNICATION & Q&A TAB */}
      {currentTab === "communication" && (
        <InstructorCommunicationManager
          courses={courses.map((c) => ({ id: c.id, title: c.title, slug: c.slug }))}
        />
      )}
    </InstructorPortalLayout>
  );
}
