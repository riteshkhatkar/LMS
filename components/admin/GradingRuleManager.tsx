"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sliders, Save, CheckCircle2, AlertCircle, History, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface GradingRuleItem {
  id: string;
  courseId: string;
  passThreshold: number;
  gradeAThreshold: number;
  gradeBMin: number;
  gradeBMax: number;
  version: number;
  isActive: boolean;
  createdAt: string | Date;
}

interface CourseWithRules {
  id: string;
  title: string;
  slug: string;
  gradingRules: GradingRuleItem[];
}

interface GradingRuleManagerProps {
  courses: CourseWithRules[];
}

export function GradingRuleManager({ courses }: GradingRuleManagerProps) {
  const router = useRouter();

  const [selectedCourseId, setSelectedCourseId] = useState(courses[0]?.id || "");
  const selectedCourse = courses.find((c) => c.id === selectedCourseId) || courses[0];
  const activeRule = selectedCourse?.gradingRules.find((r) => r.isActive) || selectedCourse?.gradingRules[0];

  const [passThreshold, setPassThreshold] = useState<number>(activeRule?.passThreshold ?? 60);
  const [gradeBMin, setGradeBMin] = useState<number>(activeRule?.gradeBMin ?? 70);
  const [gradeBMax, setGradeBMax] = useState<number>(activeRule?.gradeBMax ?? 75);
  const [gradeAThreshold, setGradeAThreshold] = useState<number>(activeRule?.gradeAThreshold ?? 90);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // When changing course selection
  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    const crs = courses.find((c) => c.id === courseId);
    const rule = crs?.gradingRules.find((r) => r.isActive) || crs?.gradingRules[0];
    if (rule) {
      setPassThreshold(rule.passThreshold);
      setGradeBMin(rule.gradeBMin);
      setGradeBMax(rule.gradeBMax);
      setGradeAThreshold(rule.gradeAThreshold);
    }
    setMessage(null);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/grading/${selectedCourseId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passThreshold,
          gradeBMin,
          gradeBMax,
          gradeAThreshold,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: "success", text: data.message });
        router.refresh();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to publish grading rule" });
      }
    } catch {
      setMessage({ type: "error", text: "Network error occurred while publishing rule" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-[#1A1A2E]">Course Grading Configuration</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
              Deterministic Integer Engine (§7.3)
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure passing criteria and grade thresholds per course. Completed attempts retain historical rule versions.
          </p>
        </div>

        {/* Course Selector */}
        <select
          value={selectedCourseId}
          onChange={(e) => handleSelectCourse(e.target.value)}
          className="text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]"
        >
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor Form */}
        <form onSubmit={handlePublish} className="lg:col-span-2 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pass Threshold (% strictly above)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="100"
                value={passThreshold}
                onChange={(e) => setPassThreshold(parseFloat(e.target.value))}
                required
                className="w-full text-sm font-semibold px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3E9BDB]"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard: &gt; 60.0% passes (60.0% fails)
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Grade A Threshold (% strictly above)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="100"
                value={gradeAThreshold}
                onChange={(e) => setGradeAThreshold(parseFloat(e.target.value))}
                required
                className="w-full text-sm font-semibold px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3E9BDB]"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Standard: &gt; 90.0% receives Grade A
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Grade B Minimum (% inclusive)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="100"
                value={gradeBMin}
                onChange={(e) => setGradeBMin(parseFloat(e.target.value))}
                required
                className="w-full text-sm font-semibold px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3E9BDB]"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Standard: 70.0%</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Grade B Maximum (% inclusive)
              </label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="100"
                value={gradeBMax}
                onChange={(e) => setGradeBMax(parseFloat(e.target.value))}
                required
                className="w-full text-sm font-semibold px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#3E9BDB]"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Standard: 75.0%</span>
            </div>
          </div>

          {message && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === "success"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                  : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-slate-500">
              Active Version: <strong>v{activeRule?.version ?? 1}</strong>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={saving}
              className="bg-[#8E6BBF] hover:bg-[#7b5ca8] text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Publishing..." : "Publish New Version"}
            </Button>
          </div>
        </form>

        {/* Visual Summary & Version History */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <History className="h-3.5 w-3.5 text-purple-600" />
            <span>Rule Version History</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {selectedCourse?.gradingRules.map((r) => (
              <div
                key={r.id}
                className={`p-2.5 rounded-lg border text-xs ${
                  r.isActive
                    ? "bg-white border-purple-300 shadow-xs"
                    : "bg-slate-100/70 border-slate-200 text-slate-500"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-800">
                    Version {r.version} {r.isActive && "(Active)"}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>Pass: &gt; {r.passThreshold}%</div>
                  <div>Grade B: {r.gradeBMin}% – {r.gradeBMax}%</div>
                  <div>Grade A: &gt; {r.gradeAThreshold}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
