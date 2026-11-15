"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Award,
  RotateCcw,
  BookOpen,
  ArrowRight,
  AlertTriangle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface ReviewQuestion {
  id: string;
  prompt: string;
  points: number;
  explanation?: string | null;
  selectedOptionId: string | null;
  isCorrect: boolean;
  pointsAwarded: number;
  options: Array<{
    id: string;
    text: string;
    isCorrect?: boolean;
  }>;
}

export interface QuizResultData {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  quizType: "IN_COURSE" | "FINAL";
  courseId: string;
  courseTitle: string;
  scorePercent: number;
  pointsEarned: number;
  totalPoints: number;
  passed: boolean;
  grade: string | null;
  provisional: boolean;
  attemptNum: number;
  maxAttempts: number;
  questions: ReviewQuestion[];
  certificateEligibility?: {
    status: string;
    completedAt: string | Date;
  } | null;
}

interface QuizResultViewProps {
  locale: string;
  result: QuizResultData;
  onRetake?: () => void;
}

export function QuizResultView({ locale, result, onRetake }: QuizResultViewProps) {
  const isFinal = result.quizType === "FINAL";
  const attemptsRemaining = Math.max(0, result.maxAttempts - result.attemptNum);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      {/* Result Hero Header */}
      <div
        className={`rounded-2xl border p-6 sm:p-8 text-center space-y-4 shadow-xs ${
          result.passed
            ? "bg-emerald-50/70 border-emerald-200"
            : "bg-red-50/70 border-red-200"
        }`}
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mx-auto shadow-inner bg-white">
          {result.passed ? (
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          ) : (
            <XCircle className="h-10 w-10 text-red-500" />
          )}
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/80 text-slate-700">
            {isFinal ? "Final Course Assessment" : "In-Course Quiz"} · Attempt {result.attemptNum} of{" "}
            {result.maxAttempts}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1A2E]">
            {result.passed ? "Assessment Passed!" : "Assessment Incomplete / Not Passed"}
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            {result.passed
              ? "Congratulations! You have satisfied the assessment criteria and demonstrated subject proficiency."
              : "You did not achieve the required passing score on this attempt. Review the explanations below and try again."}
          </p>
        </div>

        {/* Score & Grade Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto pt-2">
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Final Score</div>
            <div
              className={`text-2xl font-black ${
                result.passed ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {Math.round(result.scorePercent)}%
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Points</div>
            <div className="text-2xl font-black text-[#1A1A2E]">
              {result.pointsEarned} / {result.totalPoints}
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Grade</div>
            <div className="text-2xl font-black text-[#8E6BBF]">
              {result.grade ? `Grade ${result.grade}` : result.passed ? "Pass" : "Fail"}
            </div>
          </div>

          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Outcome</div>
            <div
              className={`text-base font-extrabold mt-1.5 ${
                result.passed ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {result.passed ? "PASS" : "FAIL"}
            </div>
          </div>
        </div>

        {/* Provisional Note */}
        {result.provisional && result.passed && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs bg-amber-50 text-amber-800 border border-amber-200/80">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>Note:</strong> Passing label is provisional pending formal policy bracket confirmation.
            </span>
          </div>
        )}

        {/* Certificate Eligibility Callout */}
        {result.certificateEligibility && (
          <div className="bg-white rounded-xl p-4 border border-[#1F9E94]/40 max-w-xl mx-auto flex items-center gap-3 text-left shadow-xs">
            <div className="w-10 h-10 rounded-full bg-teal-50 text-[#1F9E94] flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-[#1A1A2E]">Certificate Eligibility Recorded</div>
              <div className="text-xs text-slate-600">
                You have satisfied all completion requirements. Your digital certificate will be available in Phase 4 verification.
              </div>
            </div>
          </div>
        )}

        {/* Navigation CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
          <Button
            as="a"
            href={`/${locale}/learn/my-learning`}
            variant="secondary"
            className="border-slate-300 bg-white"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            My Learning
          </Button>

          {!result.passed && attemptsRemaining > 0 && onRetake && (
            <Button variant="primary" onClick={onRetake} className="bg-[#3E9BDB] hover:bg-[#3286bf]">
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Assessment ({attemptsRemaining} remaining)
            </Button>
          )}

          <Button
            as="a"
            href={`/${locale}/courses/${result.courseId}`}
            variant="ghost"
            className="text-slate-700 hover:bg-slate-100"
          >
            Course Overview
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </div>
      </div>

      {/* Question Performance Review */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1A1A2E]">Question-by-Question Review</h2>
            <p className="text-xs text-slate-500">
              Review your answers, correct solutions, and pedagogical explanations.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-600">
            {result.questions.filter((q) => q.isCorrect).length} of {result.questions.length} Correct
          </span>
        </div>

        <div className="space-y-6">
          {result.questions.map((q, idx) => (
            <div
              key={q.id}
              className={`p-4 sm:p-5 rounded-xl border transition-all ${
                q.isCorrect
                  ? "border-emerald-200/80 bg-emerald-50/20"
                  : "border-red-200/80 bg-red-50/20"
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-start gap-2.5">
                  <span
                    className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      q.isCorrect
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="font-semibold text-sm text-[#1A1A2E] leading-snug">
                    {q.prompt}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      q.isCorrect
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {q.pointsAwarded} / {q.points} pt{q.points > 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 pl-8">
                {q.options.map((opt) => {
                  const isSelected = opt.id === q.selectedOptionId;
                  const isRightAnswer = opt.isCorrect === true;

                  let borderClass = "border-slate-200 bg-white text-slate-700";
                  if (isRightAnswer) {
                    borderClass = "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold";
                  } else if (isSelected && !isRightAnswer) {
                    borderClass = "border-red-400 bg-red-50 text-red-900";
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between ${borderClass}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] font-bold">
                          {isSelected ? "●" : "○"}
                        </span>
                        <span>{opt.text}</span>
                      </div>
                      <div>
                        {isRightAnswer && (
                          <span className="text-[11px] font-bold text-emerald-700">Correct Answer</span>
                        )}
                        {isSelected && !isRightAnswer && (
                          <span className="text-[11px] font-bold text-red-600">Your Choice</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Explanation / Feedback */}
              {q.explanation && (
                <div className="mt-3 ml-8 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2">
                  <HelpCircle className="h-4 w-4 text-[#3E9BDB] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">Explanation: </span>
                    <span>{q.explanation}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
