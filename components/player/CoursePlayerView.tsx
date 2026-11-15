"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  Video,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  ArrowLeft,
  HelpCircle,
  Download,
  AlertCircle,
  Award,
  Lock,
  Trophy,
  Compass,
} from "lucide-react";
import { GuidedTrainingSteps, TrainingStepItem } from "./GuidedTrainingSteps";

export interface QuizSummaryItem {
  id: string;
  title: string;
  type: "IN_COURSE" | "FINAL";
  sectionId?: string | null;
  passed?: boolean;
  scorePercent?: number | null;
}

interface LessonItem {
  id: string;
  title: string;
  mediaType: "video" | "pdf" | "text";
  durationMinutes: number;
  textContent: string | null;
  contentUrl: string | null;
  sortOrder: number;
  completed: boolean;
  trainingSteps?: TrainingStepItem[];
}

interface SectionItem {
  id: string;
  title: string;
  sortOrder: number;
  hasQuiz: boolean;
  quiz?: QuizSummaryItem | null;
  lessons: LessonItem[];
}

interface CoursePlayerViewProps {
  locale: string;
  course: {
    id: string;
    title: string;
    slug: string;
    sections: SectionItem[];
  };
  currentLesson: LessonItem;
  currentSection: SectionItem;
  prevLesson: { id: string; title: string } | null;
  nextLesson: { id: string; title: string } | null;
  initialProgressPct: number;
  finalQuiz?: QuizSummaryItem | null;
  requiredContentPercent?: number;
}

export function CoursePlayerView({
  locale,
  course,
  currentLesson,
  currentSection,
  prevLesson,
  nextLesson,
  initialProgressPct,
  finalQuiz,
  requiredContentPercent = 80,
}: CoursePlayerViewProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(currentLesson.completed);
  const [progressPct, setProgressPct] = useState(initialProgressPct);
  const [marking, setMarking] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasGuidedSteps = (currentLesson.trainingSteps?.length ?? 0) > 0;
  const [activeTab, setActiveTab] = useState<"content" | "walkthrough" | "resources">(
    hasGuidedSteps ? "walkthrough" : "content"
  );

  const handleMarkComplete = async () => {
    if (completed || marking) return;
    setMarking(true);

    try {
      const res = await fetch("/api/progress/complete-lesson", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          lessonId: currentLesson.id,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCompleted(true);
        setProgressPct(data.progressPct);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to mark complete:", err);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100">
      {/* Player Top Navigation Bar */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/learn/my-learning`}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Back to My Learning"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="h-5 w-px bg-slate-800 hidden sm:block" />
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide hidden sm:block">
              {course.title}
            </span>
            <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[240px] sm:max-w-md">
              {currentLesson.title}
            </h1>
          </div>
        </div>

        {/* Right: Progress Indicator & Curriculum Toggle */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Progress</span>
            <div className="w-28 bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#3E9BDB] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#3E9BDB]">{progressPct}%</span>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
            aria-label="Toggle curriculum"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-slate-900 overflow-y-auto">
          {/* Media / Reading Viewport */}
          <div className="w-full bg-slate-950 flex flex-col items-center justify-center border-b border-slate-800">
            {currentLesson.mediaType === "video" && (
              <div className="w-full max-w-4xl aspect-video bg-black flex flex-col items-center justify-center p-6 text-center relative group">
                <div className="w-16 h-16 rounded-full bg-[#3E9BDB]/20 text-[#3E9BDB] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <PlayCircle className="h-10 w-10" />
                </div>
                <h2 className="text-lg font-bold text-white">{currentLesson.title}</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-md">
                  Interactive video lesson ({currentLesson.durationMinutes} min). Watch the video instruction and mark complete when finished.
                </p>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-500 bg-slate-900/80 px-3 py-1.5 rounded-md">
                  <span>HTML5 Video Stream (720p HD)</span>
                  <span>Audio: English / Hindi</span>
                </div>
              </div>
            )}

            {currentLesson.mediaType === "pdf" && (
              <div className="w-full max-w-3xl p-8 sm:p-12 my-6 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-teal-500/10 text-teal-400 mx-auto flex items-center justify-center">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{currentLesson.title}</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Structured operational guide and compliance reference document.
                  </p>
                </div>
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-left text-xs space-y-2 max-w-lg mx-auto">
                  <div className="font-semibold text-slate-200">Key Document Highlights:</div>
                  <ul className="list-disc pl-4 text-slate-400 space-y-1">
                    <li>Step-by-step statutory registers and records maintenance rules</li>
                    <li>Audit preparation checklist and administrative guidelines</li>
                    <li>Official templates for compliance resolutions</li>
                  </ul>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Document (PDF - 1.2 MB)</span>
                </button>
              </div>
            )}

            {currentLesson.mediaType === "text" && (
              <div className="w-full max-w-3xl p-6 sm:p-10 my-4 text-left space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-950 text-sky-400 border border-sky-800">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Reading Lesson · {currentLesson.durationMinutes} min read</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  {currentLesson.title}
                </h2>
                <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-4">
                  {currentLesson.textContent ? (
                    <div className="whitespace-pre-line bg-slate-950/60 p-6 rounded-xl border border-slate-800">
                      {currentLesson.textContent}
                    </div>
                  ) : (
                    <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800 space-y-3">
                      <p>
                        Welcome to this instructional unit in <strong>{currentSection.title}</strong>.
                      </p>
                      <p>
                        In this module, you will learn the operational concepts, terminology, and practical guidelines needed to complete your responsibilities with accuracy and confidence.
                      </p>
                      <h4 className="font-bold text-white text-base pt-2">Core Principles:</h4>
                      <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
                        <li>Verify all record identifiers prior to making permanent modifications</li>
                        <li>Follow designated authorization hierarchies for high-value transactions</li>
                        <li>Maintain audit trails and meeting minutes in accordance with regulations</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Bar: Completion & Navigation */}
          <div className="bg-slate-950 p-4 sm:p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Mark as Complete Button */}
            <div className="flex items-center gap-3">
              {completed ? (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>Lesson Completed</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  disabled={marking}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#3E9BDB] hover:bg-[#3286bf] text-white text-sm font-semibold transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{marking ? "Saving Progress..." : "Mark as Complete"}</span>
                </button>
              )}
              <span className="text-xs text-slate-500 hidden sm:inline">
                Completion persists to your permanent learner profile.
              </span>
            </div>

            {/* Prev / Next Navigation */}
            <div className="flex items-center gap-2">
              {prevLesson ? (
                <Link
                  href={`/${locale}/learn/course/${course.id}/lesson/${prevLesson.id}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800/40 text-xs font-semibold text-slate-600 cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>
              )}

              {nextLesson ? (
                <Link
                  href={`/${locale}/learn/course/${course.id}/lesson/${nextLesson.id}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#3E9BDB] hover:bg-[#3286bf] text-xs font-semibold text-white transition-colors shadow-xs"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <Link
                  href={`/${locale}/learn/my-learning`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
                >
                  <span>Finish Course</span>
                  <Award className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          {/* Lower Tabs Area */}
          <div className="p-6 sm:p-8 max-w-4xl space-y-6">
            <div className="flex items-center gap-4 border-b border-slate-800 pb-2 flex-wrap">
              {hasGuidedSteps && (
                <button
                  type="button"
                  onClick={() => setActiveTab("walkthrough")}
                  className={`text-sm font-semibold pb-2 border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeTab === "walkthrough"
                      ? "border-amber-400 text-amber-300"
                      : "border-transparent text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Compass className="h-4 w-4 text-amber-400" />
                  <span>Guided Walkthrough ({currentLesson.trainingSteps?.length})</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab("content")}
                className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                  activeTab === "content"
                    ? "border-[#3E9BDB] text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Overview &amp; Takeaways
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("resources")}
                className={`text-sm font-semibold pb-2 border-b-2 transition-colors ${
                  activeTab === "resources"
                    ? "border-[#3E9BDB] text-white"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Resources &amp; Downloads
              </button>
            </div>

            {activeTab === "walkthrough" && currentLesson.trainingSteps && (
              <GuidedTrainingSteps steps={currentLesson.trainingSteps} />
            )}

            {activeTab === "content" && (
              <div className="space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <h3 className="font-bold text-white text-base">Section: {currentSection.title}</h3>
                  <p className="text-slate-400">
                    This unit is part of the accredited syllabus designed for cooperative operational readiness and digital skill validation. Complete every required lesson to unlock the modular assessment.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "resources" && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="font-bold text-white text-sm">Downloadable Lesson Assets</div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <FileText className="h-4 w-4 text-[#3E9BDB]" />
                    <span className="text-xs font-medium text-slate-200">
                      Operational_Checklist_{currentLesson.id}.pdf
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">PDF · 480 KB</span>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Curriculum Sidebar (Desktop & Mobile Drawer) */}
        <aside
          className={`fixed lg:static inset-y-0 right-0 z-40 w-80 sm:w-96 bg-slate-950 border-l border-slate-800 flex flex-col transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
          }`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <h2 className="font-bold text-sm text-white">Course Curriculum</h2>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {course.sections.length} Sections · {course.sections.flatMap((s) => s.lessons).length} Lessons
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Curriculum Tree */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {course.sections.map((section, sIdx) => (
              <div key={section.id} className="space-y-1.5">
                <div className="px-2 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>
                    Section {sIdx + 1}: {section.title}
                  </span>
                </div>

                <div className="space-y-1">
                  {section.lessons.map((lesson) => {
                    const isCurrent = lesson.id === currentLesson.id;
                    const isDone = isCurrent ? completed : lesson.completed;

                    return (
                      <Link
                        key={lesson.id}
                        href={`/${locale}/learn/course/${course.id}/lesson/${lesson.id}`}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-start gap-3 p-2.5 rounded-lg text-xs transition-colors ${
                          isCurrent
                            ? "bg-[#3E9BDB]/15 text-white border border-[#3E9BDB]/40 font-semibold"
                            : "text-slate-300 hover:bg-slate-900 hover:text-white"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isDone ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : isCurrent ? (
                            <div className="w-4 h-4 rounded-full border-2 border-[#3E9BDB] flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-[#3E9BDB]" />
                            </div>
                          ) : (
                            <Circle className="h-4 w-4 text-slate-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="truncate leading-tight">{lesson.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                            {lesson.mediaType === "video" && <Video className="h-3 w-3" />}
                            {lesson.mediaType === "pdf" && <FileText className="h-3 w-3" />}
                            {lesson.mediaType === "text" && <FileText className="h-3 w-3" />}
                            <span>{lesson.durationMinutes} min</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}

                  {/* Section Quiz */}
                  {section.hasQuiz && section.quiz ? (
                    <Link
                      href={`/${locale}/learn/course/${course.id}/quiz/${section.quiz.id}`}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 p-2.5 rounded-lg text-xs transition-colors border ${
                        section.quiz.passed
                          ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-300"
                          : "bg-purple-950/30 border-purple-800/60 text-purple-300 hover:bg-purple-900/40"
                      }`}
                    >
                      <HelpCircle className="h-4 w-4 shrink-0 text-purple-400" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{section.quiz.title}</div>
                        <div className="text-[10px] opacity-75">
                          {section.quiz.passed
                            ? `Completed · Score: ${Math.round(section.quiz.scorePercent ?? 0)}%`
                            : "Section MCQ Quiz · Required"}
                        </div>
                      </div>
                      {section.quiz.passed && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      )}
                    </Link>
                  ) : section.hasQuiz ? (
                    <div className="flex items-center gap-3 p-2.5 rounded-lg text-xs text-slate-500 bg-slate-900/40 border border-dashed border-slate-800">
                      <HelpCircle className="h-4 w-4 text-purple-400 shrink-0" />
                      <div className="flex-1 truncate">
                        <div className="font-semibold text-slate-400">Section Quiz</div>
                        <div className="text-[10px] text-slate-600">Pending Instructor Authoring</div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}

            {/* Final Course Assessment Card */}
            {finalQuiz && (
              <div className="pt-2 border-t border-slate-800/80">
                <div className="px-2 py-1 text-xs font-bold text-[#8E6BBF] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Final Examination</span>
                </div>

                {progressPct >= requiredContentPercent ? (
                  <Link
                    href={`/${locale}/learn/course/${course.id}/quiz/${finalQuiz.id}`}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                      finalQuiz.passed
                        ? "bg-emerald-950/40 border-emerald-700 text-emerald-200"
                        : "bg-purple-900/30 hover:bg-purple-900/50 border-purple-600/70 text-white shadow-xs"
                    }`}
                  >
                    <Award className="h-5 w-5 text-amber-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate">{finalQuiz.title}</div>
                      <div className="text-[11px] text-purple-300">
                        {finalQuiz.passed
                          ? `Passed · Score: ${Math.round(finalQuiz.scorePercent ?? 0)}%`
                          : "Unlocked · Certificate Qualifying Assessment"}
                      </div>
                    </div>
                    {finalQuiz.passed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-600 text-white uppercase">
                        Start
                      </span>
                    )}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-800/80 bg-slate-900/40 text-slate-500">
                    <Lock className="h-5 w-5 text-slate-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-slate-400 truncate">
                        {finalQuiz.title}
                      </div>
                      <div className="text-[10px] text-slate-600">
                        Locked (Requires {requiredContentPercent}% course progress · Currently{" "}
                        {Math.round(progressPct)}%)
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
