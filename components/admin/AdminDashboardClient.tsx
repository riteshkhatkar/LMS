"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AdminPortalLayout, AdminTab } from "./AdminPortalLayout";
import { AdminCourseManager } from "./AdminCourseManager";
import { AdminTrainingManager } from "./AdminTrainingManager";
import { AdminCategoryManager } from "./AdminCategoryManager";
import { AdminAssignmentManager } from "./AdminAssignmentManager";
import { AdminUserManager } from "./AdminUserManager";
import { AdminOrganizationManager } from "./AdminOrganizationManager";
import { AdminAnalyticsDashboard } from "./AdminAnalyticsDashboard";
import { AdminAuditViewer } from "./AdminAuditViewer";
import { GradingRuleManager } from "./GradingRuleManager";
import { AdminCertificateManager } from "./AdminCertificateManager";
import { AdminNewsletterManager } from "./AdminNewsletterManager";
import { AdminAnnouncementManager } from "./AdminAnnouncementManager";
import { AdminSupportManager } from "./AdminSupportManager";
import {
  Users,
  Building,
  BookOpen,
  GraduationCap,
  HelpCircle,
  Award,
  Shield,
  ArrowRight,
  Settings,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Props {
  userEmail: string;
  userName: string;
  locale: string;
  counts: {
    userCount: number;
    orgCount: number;
    courseCount: number;
    enrollmentCount: number;
    attemptCount: number;
    certEligibleCount: number;
    certIssuedCount: number;
  };
  courses: any[];
  certificates: any[];
  recentAttempts: any[];
}

export function AdminDashboardClient({
  userEmail,
  userName,
  locale,
  counts,
  courses,
  certificates,
  recentAttempts,
}: Props) {
  const [currentTab, setCurrentTab] = useState<AdminTab>("overview");

  return (
    <AdminPortalLayout
      currentTab={currentTab}
      onTabChange={setCurrentTab}
      userEmail={userEmail}
      userName={userName}
      locale={locale}
    >
      {/* 1. OVERVIEW TAB */}
      {currentTab === "overview" && (
        <div className="space-y-8">
          {/* Welcome Banner */}
          <div className="bg-white rounded-2xl border border-purple-200 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-[#8E6BBF] border border-[#8E6BBF]/30">
                  Institutional Governance
                </span>
                <span className="text-xs text-slate-500 font-mono">learnlms (PostgreSQL 18)</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E] tracking-tight">
                Platform Administration
              </h1>
              <p className="text-sm text-slate-600">
                Oversee curriculum deployments, user authorizations, organization clearances, and blockchain certificates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-900">{userName}</div>
                <div className="text-xs text-slate-500">{userEmail}</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-100 text-[#8E6BBF] flex items-center justify-center font-bold">
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Metric Cards (6 KPI tiles) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <button
              onClick={() => setCurrentTab("users")}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs text-left hover:border-[#3E9BDB] transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Users</span>
                <Users className="h-3.5 w-3.5 text-[#3E9BDB]" />
              </div>
              <div className="text-2xl font-black text-[#1A1A2E]">{counts.userCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">3 System Roles</div>
            </button>

            <button
              onClick={() => setCurrentTab("organizations")}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs text-left hover:border-[#1F9E94] transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Organizations</span>
                <Building className="h-3.5 w-3.5 text-[#1F9E94]" />
              </div>
              <div className="text-2xl font-black text-[#1A1A2E]">{counts.orgCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Naval &amp; FPO/FPC</div>
            </button>

            <button
              onClick={() => setCurrentTab("courses")}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs text-left hover:border-[#EE8A2B] transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Courses</span>
                <BookOpen className="h-3.5 w-3.5 text-[#EE8A2B]" />
              </div>
              <div className="text-2xl font-black text-[#1A1A2E]">{counts.courseCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Curriculum Units</div>
            </button>

            <button
              onClick={() => setCurrentTab("assignments")}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs text-left hover:border-[#8E6BBF] transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Enrollments</span>
                <GraduationCap className="h-3.5 w-3.5 text-[#8E6BBF]" />
              </div>
              <div className="text-2xl font-black text-[#1A1A2E]">{counts.enrollmentCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Active Learners</div>
            </button>

            <button
              onClick={() => setCurrentTab("analytics")}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs text-left hover:border-blue-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Assessments</span>
                <HelpCircle className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-[#1A1A2E]">{counts.attemptCount}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Quiz Attempts</div>
            </button>

            <button
              onClick={() => setCurrentTab("certificates")}
              className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs text-left hover:border-emerald-600 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase">Certificates</span>
                <Award className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-emerald-600">{counts.certIssuedCount}</span>
                <span className="text-[10px] text-slate-500">({counts.certEligibleCount})</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">ORELSE Anchored</div>
            </button>
          </div>

          {/* Quick Action Navigation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => setCurrentTab("courses")}
              className="p-5 bg-white rounded-2xl border border-slate-200/90 text-left hover:border-[#3E9BDB] hover:shadow-xs transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#3E9BDB] flex items-center justify-center mb-3">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#1A1A2E] group-hover:text-[#3E9BDB] flex items-center justify-between">
                <span>Manage Course Catalog</span>
                <ArrowRight className="h-4 w-4" />
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Create new learning paths, configure restricted naval modules, and publish lessons.
              </p>
            </button>

            <button
              onClick={() => setCurrentTab("assignments")}
              className="p-5 bg-white rounded-2xl border border-slate-200/90 text-left hover:border-[#1F9E94] hover:shadow-xs transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#1F9E94] flex items-center justify-center mb-3">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#1A1A2E] group-hover:text-[#1F9E94] flex items-center justify-between">
                <span>Assign Institutional Training</span>
                <ArrowRight className="h-4 w-4" />
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Deploy courses to Naval commands, FPO collective unions, or learner cohorts.
              </p>
            </button>

            <button
              onClick={() => setCurrentTab("analytics")}
              className="p-5 bg-white rounded-2xl border border-slate-200/90 text-left hover:border-[#8E6BBF] hover:shadow-xs transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#8E6BBF] flex items-center justify-center mb-3">
                <Award className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[#1A1A2E] group-hover:text-[#8E6BBF] flex items-center justify-between">
                <span>Analytics &amp; CSV Export</span>
                <ArrowRight className="h-4 w-4" />
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Inspect pass ratios, grade distribution, and download formula-safe CSV reports.
              </p>
            </button>
          </div>

          {/* Recent Assessment Attempts Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-[#1A1A2E]">
                  Recent Assessment Activity
                </h3>
                <p className="text-xs text-slate-500">
                  Latest quiz submissions and grade calculations across all courses.
                </p>
              </div>
              <button
                onClick={() => setCurrentTab("grading")}
                className="text-xs font-semibold text-[#8E6BBF] hover:underline"
              >
                Configure Grading Rules &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Learner</th>
                    <th className="px-5 py-3.5">Assessment</th>
                    <th className="px-5 py-3.5 text-center">Score</th>
                    <th className="px-5 py-3.5 text-center">Outcome</th>
                    <th className="px-5 py-3.5 text-center">Grade</th>
                    <th className="px-5 py-3.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentAttempts.length > 0 ? (
                    recentAttempts.map((att: any) => (
                      <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {att.user.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {att.user.organization?.name || att.user.email}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-800">
                          <div className="font-semibold">{att.quiz.title}</div>
                          <div className="text-[10px] text-slate-500">{att.quiz.course.title}</div>
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-xs">
                          {att.scorePercent !== null ? `${Math.round(att.scorePercent)}%` : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              att.passed
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {att.passed ? "PASS" : "FAIL"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-xs text-[#8E6BBF]">
                          {att.grade ? `Grade ${att.grade}` : att.passed ? "Pass" : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-right text-xs text-slate-500">
                          {formatDate(att.createdAt.toString())}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-500">
                        No recent assessments recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. COURSES TAB */}
      {currentTab === "courses" && <AdminCourseManager initialCourses={courses} locale={locale} />}

      {/* PHASE 7: TRAINING PROGRAMMES TAB */}
      {currentTab === "training" && <AdminTrainingManager />}

      {/* 3. CATEGORIES TAB */}
      {currentTab === "categories" && <AdminCategoryManager />}

      {/* 4. ASSIGNMENTS TAB */}
      {currentTab === "assignments" && <AdminAssignmentManager />}

      {/* 5. GRADING RULES TAB */}
      {currentTab === "grading" && <GradingRuleManager courses={courses} />}

      {/* 6. USERS TAB */}
      {currentTab === "users" && <AdminUserManager />}

      {/* 7. ORGANIZATIONS TAB */}
      {currentTab === "organizations" && <AdminOrganizationManager />}

      {/* 8. ANALYTICS TAB */}
      {currentTab === "analytics" && <AdminAnalyticsDashboard />}

      {/* 9. CERTIFICATES TAB */}
      {currentTab === "certificates" && (
        <AdminCertificateManager
          initialCertificates={certificates}
          courses={courses.map((c: any) => ({ id: c.id, title: c.title }))}
          locale={locale}
        />
      )}

      {/* PHASE 6: NEWSLETTERS TAB */}
      {currentTab === "newsletters" && <AdminNewsletterManager />}

      {/* PHASE 6: ANNOUNCEMENTS TAB */}
      {currentTab === "announcements" && <AdminAnnouncementManager />}

      {/* PHASE 6: SUPPORT & DISCUSSIONS TAB */}
      {currentTab === "support" && <AdminSupportManager />}

      {/* 10. AUDIT TAB */}
      {currentTab === "audit" && <AdminAuditViewer />}

      {/* 11. SETTINGS TAB */}
      {currentTab === "settings" && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <Settings className="h-6 w-6 text-[#3E9BDB]" />
            <div>
              <h2 className="text-lg font-bold text-[#1A1A2E]">Platform System Configuration</h2>
              <p className="text-xs text-slate-500">
                Institutional branding, digital credential authority, and cryptographic parameters.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block text-sm">Certificate Authority</span>
              <div>
                <span className="font-semibold text-slate-600">Issuer Name:</span> ORELSE
              </div>
              <div>
                <span className="font-semibold text-slate-600">Issuer URL:</span> https://www.orelse.ai
              </div>
              <div>
                <span className="font-semibold text-slate-600">Algorithm:</span> ES256 (ECDSA with P-256 and SHA-256)
              </div>
              <div>
                <span className="font-semibold text-slate-600">Ledger Support:</span> MockLedger &amp; Polygon Amoy / EVM
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block text-sm">System Governance</span>
              <div>
                <span className="font-semibold text-slate-600">Primary Roles:</span> LEARNER, INSTRUCTOR, ADMIN
              </div>
              <div>
                <span className="font-semibold text-slate-600">Learner Classifications:</span> FPO Members, FPC Teams, Students, Naval Officers
              </div>
              <div>
                <span className="font-semibold text-slate-600">Database Engine:</span> PostgreSQL 18 with Prisma ORM
              </div>
              <div>
                <span className="font-semibold text-slate-600">Security:</span> Server-Side JWT Validation (`jose`), CSRF mitigation
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPortalLayout>
  );
}
