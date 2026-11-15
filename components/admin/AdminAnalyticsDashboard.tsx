"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Users,
  GraduationCap,
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Building,
  RefreshCw,
  Loader2,
  TrendingUp,
} from "lucide-react";

interface AnalyticsData {
  kpis: {
    totalUsers: number;
    totalEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
    totalAttempts: number;
    passedAttempts: number;
    passRate: number;
    certificatesIssued: number;
  };
  gradeDistribution: {
    A: number;
    B: number;
    C: number;
    D: number;
    F: number;
  };
  organizations: {
    id: string;
    name: string;
    code: string;
    totalUsers: number;
    totalEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
  }[];
  learnerGroups: {
    group: string;
    label: string;
    totalUsers: number;
    totalEnrollments: number;
    completedEnrollments: number;
    completionRate: number;
  }[];
}

export function AdminAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.ok) {
        const json = await res.json();
        const transformed: AnalyticsData = {
          kpis: {
            totalUsers: json.kpis.totalLearners ?? json.kpis.totalUsers ?? 0,
            totalEnrollments: json.kpis.activeEnrollments ?? json.kpis.totalEnrollments ?? 0,
            completedEnrollments: json.kpis.completedEnrollments ?? 0,
            completionRate: json.kpis.courseCompletionRate ?? json.kpis.completionRate ?? 0,
            totalAttempts: json.kpis.finalAttempts ?? json.kpis.totalAttempts ?? 0,
            passedAttempts: json.kpis.passedFinalAttempts ?? json.kpis.passedAttempts ?? 0,
            passRate: json.kpis.assessmentPassRate ?? json.kpis.passRate ?? 0,
            certificatesIssued: json.kpis.issuedCertCount ?? json.kpis.certificatesIssued ?? 0,
          },
          gradeDistribution: {
            A: json.grades?.gradeA ?? 0,
            B: json.grades?.gradeB ?? 0,
            C: json.grades?.provisional ?? 0,
            D: 0,
            F: json.grades?.failed ?? 0,
          },
          organizations: (json.organizationBreakdown || []).map((o: any) => ({
            id: o.id,
            name: o.name,
            code: o.code,
            totalUsers: o.userCount ?? 0,
            totalEnrollments: o.enrollmentCount ?? 0,
            completedEnrollments: o.completionCount ?? 0,
            completionRate:
              o.enrollmentCount > 0 ? Math.round((o.completionCount / o.enrollmentCount) * 100) : 0,
          })),
          learnerGroups: (json.learnerGroupBreakdown || []).map((g: any) => ({
            group: g.group,
            label: g.label,
            totalUsers: g.userCount ?? 0,
            totalEnrollments: g.enrollmentCount ?? 0,
            completedEnrollments: g.completionCount ?? 0,
            completionRate:
              g.enrollmentCount > 0 ? Math.round((g.completionCount / g.enrollmentCount) * 100) : 0,
          })),
        };
        setData(transformed);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleExport = (type: "enrollments" | "assessments" | "certificates") => {
    setExporting(type);
    window.location.href = `/api/admin/analytics/export?type=${type}`;
    setTimeout(() => setExporting(null), 1500);
  };

  if (loading || !data) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-[#3E9BDB] animate-spin" />
        <p className="text-xs text-slate-500 font-medium">
          Aggregating institutional metrics from PostgreSQL...
        </p>
      </div>
    );
  }

  const { kpis, gradeDistribution, organizations, learnerGroups } = data;

  // Compute donut chart angles for Pass / Fail
  const totalAttempts = kpis.totalAttempts || 1;
  const passPercent = Math.round((kpis.passedAttempts / totalAttempts) * 100);
  const failPercent = 100 - passPercent;
  const circumference = 2 * Math.PI * 40; // r = 40
  const passStrokeDash = (passPercent / 100) * circumference;

  // Find max count for grade distribution scaling
  const maxGradeCount = Math.max(
    gradeDistribution.A,
    gradeDistribution.B,
    gradeDistribution.C,
    gradeDistribution.D,
    gradeDistribution.F,
    1
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#1A1A2E] flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#3E9BDB]" />
            Learning Analytics &amp; Performance Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Real-time completion metrics, pass rates, grading distribution, and institutional exports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh metrics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleExport("enrollments")}
              disabled={!!exporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Enrollments CSV</span>
            </button>

            <button
              onClick={() => handleExport("assessments")}
              disabled={!!exporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Grades CSV</span>
            </button>

            <button
              onClick={() => handleExport("certificates")}
              disabled={!!exporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#3E9BDB] hover:bg-[#3286bf] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Certificates CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Learners</span>
            <Users className="h-4 w-4 text-[#3E9BDB]" />
          </div>
          <div className="text-3xl font-black text-[#1A1A2E]">{kpis.totalUsers}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 4 target groups</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Completion Rate</span>
            <GraduationCap className="h-4 w-4 text-[#1F9E94]" />
          </div>
          <div className="text-3xl font-black text-[#1F9E94]">{kpis.completionRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {kpis.completedEnrollments} of {kpis.totalEnrollments} enrollments
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Assessment Pass</span>
            <HelpCircle className="h-4 w-4 text-[#8E6BBF]" />
          </div>
          <div className="text-3xl font-black text-[#8E6BBF]">{kpis.passRate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            {kpis.passedAttempts} of {kpis.totalAttempts} attempts passed
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Certificates Issued</span>
            <Award className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{kpis.certificatesIssued}</div>
          <div className="text-[11px] text-slate-500 mt-1">Cryptographically anchored</div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pass vs Fail Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1A1A2E]">Assessment Success Ratio</h3>
            <span className="text-xs text-slate-500">{kpis.totalAttempts} Submissions</span>
          </div>

          <div className="flex items-center justify-around py-4">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Circle (Fail) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#FECACA"
                  strokeWidth="16"
                />
                {/* Foreground Circle (Pass) */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#10B981"
                  strokeWidth="16"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - passStrokeDash}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900">{passPercent}%</span>
                <span className="text-[10px] uppercase font-bold text-emerald-700">Passed</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-emerald-500" />
                <span className="font-semibold text-slate-700">Passed:</span>
                <span className="font-bold text-slate-900">{kpis.passedAttempts}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-md bg-red-300" />
                <span className="font-semibold text-slate-700">Failed:</span>
                <span className="font-bold text-slate-900">
                  {kpis.totalAttempts - kpis.passedAttempts}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Distribution Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1A1A2E]">Grade Tier Distribution</h3>
            <span className="text-xs text-slate-500">Relative Breakdown</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { grade: "Grade A", count: gradeDistribution.A, color: "bg-[#1F9E94]" },
              { grade: "Grade B", count: gradeDistribution.B, color: "bg-[#3E9BDB]" },
              { grade: "Grade C", count: gradeDistribution.C, color: "bg-[#8E6BBF]" },
              { grade: "Grade D", count: gradeDistribution.D, color: "bg-amber-400" },
              { grade: "Fail / Incomplete", count: gradeDistribution.F, color: "bg-red-400" },
            ].map((tier) => {
              const pct = Math.round((tier.count / maxGradeCount) * 100);
              return (
                <div key={tier.grade} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-slate-700">{tier.grade}</span>
                    <span className="font-bold text-slate-900">{tier.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${tier.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Breakdown by Learner Groups & Organizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learner Group Performance */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-[#1A1A2E]">Learner Group Breakdown</h3>
            <p className="text-xs text-slate-500">Progress across audience classifications</p>
          </div>

          <div className="p-4 space-y-3">
            {learnerGroups.map((lg) => (
              <div key={lg.group} className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">{lg.label}</span>
                  <span className="font-semibold text-[#1F9E94]">{lg.completionRate}% complete</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-[#1F9E94] rounded-full"
                    style={{ width: `${lg.completionRate}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                  <span>{lg.totalUsers} registered</span>
                  <span>
                    {lg.completedEnrollments}/{lg.totalEnrollments} finished
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Organization Performance Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-[#1A1A2E]">Command &amp; Collective Standing</h3>
            <p className="text-xs text-slate-500">Institutional training completion rates</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Organization</th>
                  <th className="px-4 py-3 text-center">Members</th>
                  <th className="px-4 py-3 text-center">Enrollments</th>
                  <th className="px-4 py-3 text-right">Completion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {organizations.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{org.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{org.code}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{org.totalUsers}</td>
                    <td className="px-4 py-3 text-center">{org.totalEnrollments}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-[#1F9E94] border border-teal-200">
                        {org.completionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
