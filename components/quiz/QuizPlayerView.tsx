"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuizResultView, type QuizResultData } from "./QuizResultView";

export interface SanitizedQuestion {
  id: string;
  prompt: string;
  sortOrder: number;
  points: number;
  options: Array<{
    id: string;
    text: string;
    sortOrder: number;
  }>;
}

interface QuizPlayerViewProps {
  locale: string;
  attemptId: string;
  attemptNum: number;
  maxAttempts: number;
  quiz: {
    id: string;
    title: string;
    description: string | null;
    type: "IN_COURSE" | "FINAL";
    passingPercent: number;
    timeLimitSec: number | null;
    courseId: string;
    courseTitle: string;
  };
  questions: SanitizedQuestion[];
  initialAnswers: Record<string, string>; // questionId -> selectedOptionId
  initialRemainingSeconds: number | null;
}

export function QuizPlayerView({
  locale,
  attemptId,
  attemptNum,
  maxAttempts,
  quiz,
  questions,
  initialAnswers,
  initialRemainingSeconds,
}: QuizPlayerViewProps) {
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [savingAnswer, setSavingAnswer] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [result, setResult] = useState<QuizResultData | null>(null);

  // Timer state
  const [remainingSec, setRemainingSec] = useState<number | null>(initialRemainingSeconds);

  useEffect(() => {
    if (remainingSec === null || remainingSec <= 0 || result !== null) return;

    const interval = setInterval(() => {
      setRemainingSec((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          // Auto-submit on expiration
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSec, result]);

  const currentQuestion = questions[currentIndex];
  const selectedOptionId = currentQuestion ? answers[currentQuestion.id] : undefined;

  // Handle Option Select & Save
  const handleSelectOption = async (optionId: string) => {
    if (!currentQuestion || submitting || result !== null) return;

    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
    setSavingAnswer(true);

    try {
      await fetch(`/api/quiz/attempt/${attemptId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.id,
          selectedOptionId: optionId,
        }),
      });
    } catch (err) {
      console.error("Failed to auto-save answer:", err);
    } finally {
      setSavingAnswer(false);
    }
  };

  // Handle Final Submit
  const handleSubmit = async () => {
    if (submitting || result !== null) return;
    setSubmitting(true);
    setShowConfirmModal(false);

    try {
      const res = await fetch(`/api/quiz/attempt/${attemptId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        // Fetch full review result
        const resultRes = await fetch(`/api/quiz/attempt/${attemptId}/result`);
        if (resultRes.ok) {
          const resultData = await resultRes.json();
          setResult(resultData);
        } else {
          router.refresh();
        }
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // If result is ready, display QuizResultView
  if (result) {
    return (
      <QuizResultView
        locale={locale}
        result={result}
        onRetake={() => {
          router.push(`/${locale}/learn/course/${quiz.courseId}/quiz/${quiz.id}`);
          router.refresh();
        }}
      />
    );
  }

  // Format timer MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;
  const isFinal = quiz.type === "FINAL";

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      {/* Quiz Top Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                isFinal
                  ? "bg-purple-50 text-[#8E6BBF] border border-[#8E6BBF]/30"
                  : "bg-teal-50 text-[#1F9E94] border border-[#1F9E94]/30"
              }`}
            >
              {isFinal ? "Final Course Assessment" : "In-Course Quiz"}
            </span>
            <span className="text-xs text-slate-500">
              Attempt {attemptNum} of {maxAttempts}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#1A1A2E]">{quiz.title}</h1>
          <div className="text-xs text-slate-500 font-medium">{quiz.courseTitle}</div>
        </div>

        {/* Timer / Points Summary */}
        <div className="flex items-center gap-4">
          {remainingSec !== null && (
            <div
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm font-bold shadow-xs ${
                remainingSec < 300
                  ? "bg-red-50 text-red-600 border-red-200 animate-pulse"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatTime(remainingSec)}</span>
            </div>
          )}

          <div className="text-right hidden sm:block">
            <div className="text-xs font-bold text-slate-500 uppercase">Answered</div>
            <div className="text-base font-black text-[#3E9BDB]">
              {answeredCount} / {totalQuestions}
            </div>
          </div>
        </div>
      </div>

      {/* Question Question Matrix Tracker */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-2 px-1">
          <span>Question Navigation</span>
          <span>{Math.round((answeredCount / totalQuestions) * 100)}% Answered</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {questions.map((q, idx) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = idx === currentIndex;

            let btnStyle = "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200";
            if (isCurrent) {
              btnStyle = "bg-[#3E9BDB] text-white border-[#3E9BDB] ring-2 ring-[#3E9BDB]/20 font-bold";
            } else if (isAnswered) {
              btnStyle = "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold";
            }

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`w-8 h-8 rounded-lg text-xs border flex items-center justify-center transition-all ${btnStyle}`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6">
          {/* Question Prompt */}
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-[#3E9BDB] uppercase tracking-wider">
                Question {currentIndex + 1} of {totalQuestions}
              </span>
              <h2 className="text-base sm:text-lg font-bold text-[#1A1A2E] leading-snug">
                {currentQuestion.prompt}
              </h2>
            </div>
            <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
              {currentQuestion.points} Point{currentQuestion.points > 1 ? "s" : ""}
            </span>
          </div>

          {/* MCQ Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOptionId === option.id;

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelectOption(option.id)}
                  disabled={submitting}
                  className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? "border-[#3E9BDB] bg-[#EAF4FC] text-[#1A1A2E] shadow-xs"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected ? "border-[#3E9BDB] bg-[#3E9BDB]" : "border-slate-400"
                      }`}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span>{option.text}</span>
                  </div>

                  {isSelected && (
                    <span className="text-[11px] font-bold text-[#3E9BDB] uppercase">Selected</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={currentIndex === 0 || submitting}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1.5" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentIndex < totalQuestions - 1 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                  className="bg-[#3E9BDB] hover:bg-[#3286bf]"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1.5" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Assessment
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#1A1A2E]">Submit Assessment?</h3>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              You have answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions.
              {answeredCount < totalQuestions && (
                <span className="block mt-1 text-amber-700 font-semibold">
                  ⚠️ Unanswered questions will receive 0 marks.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                variant="ghost"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
              >
                Review Answers
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? "Submitting..." : "Confirm & Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
