"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CheckCircle2, HelpCircle, Save, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CourseOption {
  id: string;
  title: string;
  sections: Array<{ id: string; title: string }>;
}

interface QuizAuthorModalProps {
  courses: CourseOption[];
}

export function QuizAuthorModal({ courses }: QuizAuthorModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const [courseId, setCourseId] = useState(courses[0]?.id || "");
  const [sectionId, setSectionId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"IN_COURSE" | "FINAL">("IN_COURSE");
  const [passingPercent, setPassingPercent] = useState(60);
  const [timeLimitSec, setTimeLimitSec] = useState<number | "">("");
  const [maxAttempts, setMaxAttempts] = useState(3);

  const [questions, setQuestions] = useState<
    Array<{
      prompt: string;
      explanation: string;
      points: number;
      options: Array<{ text: string; isCorrect: boolean }>;
    }>
  >([
    {
      prompt: "",
      explanation: "",
      points: 1,
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedCourse = courses.find((c) => c.id === courseId) || courses[0];

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        prompt: "",
        explanation: "",
        points: 1,
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleQuestionChange = (idx: number, field: string, value: string | number) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q))
    );
  };

  const handleOptionChange = (qIdx: number, oIdx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((opt, j) => (j === oIdx ? { ...opt, text } : opt)),
            }
          : q
      )
    );
  };

  const handleSelectCorrectOption = (qIdx: number, oIdx: number) => {
    setQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? {
              ...q,
              options: q.options.map((opt, j) => ({
                ...opt,
                isCorrect: j === oIdx,
              })),
            }
          : q
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Frontend validation
    if (!title.trim()) {
      setError("Please provide an assessment title.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.prompt.trim()) {
        setError(`Question ${i + 1} prompt cannot be empty.`);
        return;
      }
      const filledOptions = q.options.filter((o) => o.text.trim().length > 0);
      if (filledOptions.length < 2) {
        setError(`Question ${i + 1} must have at least 2 non-empty options.`);
        return;
      }
      const correctOption = q.options.find((o) => o.isCorrect);
      if (!correctOption || !correctOption.text.trim()) {
        setError(`Question ${i + 1} correct answer cannot be empty.`);
        return;
      }
    }

    setSaving(true);

    try {
      const res = await fetch("/api/instructor/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          sectionId: type === "IN_COURSE" ? sectionId || null : null,
          title: title.trim(),
          description: description.trim() || null,
          type,
          passingPercent: Number(passingPercent),
          timeLimitSec: timeLimitSec ? Number(timeLimitSec) : null,
          maxAttempts: Number(maxAttempts),
          questions: questions.map((q) => ({
            prompt: q.prompt.trim(),
            explanation: q.explanation.trim() || null,
            points: Number(q.points),
            options: q.options
              .filter((o) => o.text.trim().length > 0)
              .map((o) => ({
                text: o.text.trim(),
                isCorrect: o.isCorrect,
              })),
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess("Assessment created and published successfully!");
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(null);
          router.refresh();
        }, 1200);
      } else {
        setError(data.error || "Failed to create assessment");
      }
    } catch {
      setError("Network error while submitting assessment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setIsOpen(true)}
        className="bg-[#1F9E94] hover:bg-[#188077] text-white"
      >
        <Plus className="h-4 w-4 mr-2" />
        Author New Quiz
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-[#1A1A2E]">Author New Assessment</h3>
                <p className="text-xs text-slate-500">
                  Create section-level MCQ quizzes or final course qualification assessments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Target Course & Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Course
                  </label>
                  <select
                    value={courseId}
                    onChange={(e) => setCourseId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assessment Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as "IN_COURSE" | "FINAL")}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="IN_COURSE">In-Course Section Quiz (Type A)</option>
                    <option value="FINAL">Final Course Assessment (Type B)</option>
                  </select>
                </div>
              </div>

              {type === "IN_COURSE" && selectedCourse?.sections && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Section (Optional)
                  </label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="">-- General In-Course Quiz --</option>
                    {selectedCourse.sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Assessment Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. FPO Board Governance & Financial Oversight Quiz"
                    required
                    className="w-full text-sm font-semibold px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F9E94]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instructions / Description
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide instructions for the learner..."
                    className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#1F9E94]"
                  />
                </div>
              </div>

              {/* Thresholds & Time Limit */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pass Score (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={passingPercent}
                    onChange={(e) => setPassingPercent(parseInt(e.target.value) || 60)}
                    className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Time Limit (Sec)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 1800 (30m)"
                    value={timeLimitSec}
                    onChange={(e) =>
                      setTimeLimitSec(e.target.value ? parseInt(e.target.value) : "")
                    }
                    className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={maxAttempts}
                    onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 3)}
                    className="w-full text-sm font-semibold px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              {/* Questions Authoring List */}
              <div className="space-y-4 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-[#1A1A2E]">
                    Questions ({questions.length})
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleAddQuestion}
                    className="text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Question
                  </Button>
                </div>

                <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                  {questions.map((q, qIdx) => (
                    <div
                      key={qIdx}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-bold text-slate-600">
                          Q{qIdx + 1}. Prompt
                        </span>
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveQuestion(qIdx)}
                            className="text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <input
                        type="text"
                        value={q.prompt}
                        onChange={(e) => handleQuestionChange(qIdx, "prompt", e.target.value)}
                        placeholder="Enter the question statement..."
                        className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 bg-white"
                      />

                      <div className="space-y-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">
                          Options (Select the radio to mark the correct answer)
                        </span>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-2">
                            <input
                              type="radio"
                              name={`correct_${qIdx}`}
                              checked={opt.isCorrect}
                              onChange={() => handleSelectCorrectOption(qIdx, oIdx)}
                              className="w-4 h-4 text-[#1F9E94]"
                            />
                            <input
                              type="text"
                              value={opt.text}
                              onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                              placeholder={`Option ${oIdx + 1}`}
                              className={`flex-1 text-xs px-2.5 py-1.5 rounded-lg border bg-white ${
                                opt.isCorrect
                                  ? "border-emerald-500 bg-emerald-50/50 font-semibold"
                                  : "border-slate-200"
                              }`}
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) =>
                            handleQuestionChange(qIdx, "explanation", e.target.value)
                          }
                          placeholder="Feedback / Pedagogical explanation for review..."
                          className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{success}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  className="bg-[#1F9E94] hover:bg-[#188077] text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Publishing..." : "Publish Assessment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
