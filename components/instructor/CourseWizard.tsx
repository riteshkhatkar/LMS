"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Users,
  Layers,
  HelpCircle,
  Rocket,
  Plus,
  Trash2,
  MoveRight,
  MoveLeft,
  Lock,
  Globe,
  Loader2,
  FileText,
  Video,
  FileCode,
  Award,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface LessonInput {
  title: string;
  type: "video" | "text" | "pdf";
  durationMinutes: number;
  content: string;
  isRequired: boolean;
}

interface SectionInput {
  title: string;
  lessons: LessonInput[];
}

interface Props {
  onCourseCreated?: (courseId: string) => void;
  categories?: Category[];
}

export function CourseWizard({ onCourseCreated, categories: initialCategories = [] }: Props) {
  const [stage, setStage] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  // Stage 1: Basic Info
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [level, setLevel] = useState("Intermediate");
  const [language, setLanguage] = useState("English");
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [thumbnailUrl, setThumbnailUrl] = useState("");

  // Stage 2: Audience & Security
  const [targetAudience, setTargetAudience] = useState("ALL");
  const [prerequisites, setPrerequisites] = useState("");
  const [isRestricted, setIsRestricted] = useState(false);

  // Stage 3: Curriculum Builder
  const [sections, setSections] = useState<SectionInput[]>([
    {
      title: "Module 1: Orientation & Foundations",
      lessons: [
        {
          title: "Introduction and Course Overview",
          type: "text",
          durationMinutes: 15,
          content: "Welcome to this module. Review the syllabus and core objectives.",
          isRequired: true,
        },
      ],
    },
  ]);

  // Stage 4: Assessments
  const [hasFinalAssessment, setHasFinalAssessment] = useState(true);
  const [passingPercent, setPassingPercent] = useState(70);
  const [assessmentTitle, setAssessmentTitle] = useState("Final Comprehensive Examination");
  const [timeLimitMin, setTimeLimitMin] = useState(30);

  // Stage 5: State tracking
  const [createdCourseId, setCreatedCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (categories.length === 0) {
      fetch("/api/admin/categories")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setCategories(data);
          if (data.length > 0 && !categoryId) {
            setCategoryId(data[0].id);
          }
        })
        .catch(() => {});
    }
  }, []);

  const totalLessons = sections.reduce((acc, s) => acc + s.lessons.length, 0);

  // Curriculum Helpers
  const addSection = () => {
    setSections([
      ...sections,
      {
        title: `Module ${sections.length + 1}: Core Concepts`,
        lessons: [
          {
            title: "Lesson 1: Key Topic",
            type: "text",
            durationMinutes: 20,
            content: "Lesson details and instructional material.",
            isRequired: true,
          },
        ],
      },
    ]);
  };

  const removeSection = (index: number) => {
    if (sections.length <= 1) return;
    setSections(sections.filter((_, i) => i !== index));
  };

  const addLesson = (sectionIndex: number) => {
    const updated = [...sections];
    updated[sectionIndex].lessons.push({
      title: `Lesson ${updated[sectionIndex].lessons.length + 1}: Study Guide`,
      type: "text",
      durationMinutes: 15,
      content: "",
      isRequired: true,
    });
    setSections(updated);
  };

  const removeLesson = (sectionIndex: number, lessonIndex: number) => {
    const updated = [...sections];
    if (updated[sectionIndex].lessons.length <= 1) return;
    updated[sectionIndex].lessons = updated[sectionIndex].lessons.filter(
      (_, i) => i !== lessonIndex
    );
    setSections(updated);
  };

  // Validation Checks for Stage 5
  const isBasicValid = title.trim().length > 3 && slug.trim().length > 3 && description.trim().length > 10;
  const isAudienceValid = !!targetAudience;
  const isCurriculumValid = sections.length >= 1 && totalLessons >= 1;
  const isAssessmentValid = !hasFinalAssessment || (passingPercent >= 40 && passingPercent <= 100);
  const canPublish = isBasicValid && isAudienceValid && isCurriculumValid && isAssessmentValid;

  const handleSaveOrPublish = async (publish: boolean) => {
    setLoading(true);
    setMessage(null);

    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);

      // Step 1: Create the course draft
      const coursePayload = {
        title,
        slug,
        subtitle,
        description,
        category: selectedCategory ? selectedCategory.name : "Maritime Studies",
        categoryId: categoryId || undefined,
        level,
        targetAudience,
        durationMinutes: Number(durationMinutes),
        isRestricted,
        publishStatus: "draft",
      };

      const res = await fetch("/api/instructor/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coursePayload),
      });

      const courseData = await res.json();
      if (!res.ok) {
        throw new Error(courseData.error || "Failed to create course");
      }

      const courseId = courseData.id;
      setCreatedCourseId(courseId);

      // Step 2: Build and attach curriculum sections & lessons
      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const sec = sections[sIdx];
        const secRes = await fetch(`/api/instructor/courses/${courseId}/curriculum`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_section",
            title: sec.title,
            sortOrder: (sIdx + 1) * 10,
          }),
        });

        if (secRes.ok) {
          const secData = await secRes.json();
          for (let lIdx = 0; lIdx < sec.lessons.length; lIdx++) {
            const les = sec.lessons[lIdx];
            await fetch(`/api/instructor/courses/${courseId}/curriculum`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "create_lesson",
                sectionId: secData.id,
                title: les.title,
                type: les.type,
                durationMinutes: Number(les.durationMinutes),
                content: les.content || "Lesson instructional material.",
                isRequired: les.isRequired,
                sortOrder: (lIdx + 1) * 10,
              }),
            });
          }
        }
      }

      // Step 3: If final assessment is enabled, create Quiz
      if (hasFinalAssessment) {
        await fetch(`/api/instructor/courses/${courseId}/curriculum`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create_final_quiz",
            title: assessmentTitle,
            passingPercent: Number(passingPercent),
            timeLimitSec: Number(timeLimitMin) * 60,
          }),
        });
      }

      // Step 4: If publishing requested, flip publishStatus
      if (publish) {
        const pubRes = await fetch(`/api/instructor/courses/${courseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publishStatus: "published" }),
        });

        if (!pubRes.ok) {
          const pErr = await pubRes.json();
          throw new Error(pErr.error || "Failed to publish course");
        }
      }

      setMessage({
        type: "success",
        text: publish
          ? "Course published successfully! It is now live to eligible learners."
          : "Course draft and curriculum structure saved successfully.",
      });

      if (onCourseCreated) {
        onCourseCreated(courseId);
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to finalize course" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Wizard Steps Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="grid grid-cols-5 gap-2 text-center">
          {[
            { s: 1, label: "Basic Info", icon: BookOpen },
            { s: 2, label: "Audience & Policy", icon: Users },
            { s: 3, label: "Curriculum", icon: Layers },
            { s: 4, label: "Assessments", icon: HelpCircle },
            { s: 5, label: "Review & Publish", icon: Rocket },
          ].map((step) => {
            const Icon = step.icon;
            const isCurrent = stage === step.s;
            const isDone = stage > step.s;
            return (
              <button
                key={step.s}
                onClick={() => setStage(step.s as any)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all ${
                  isCurrent
                    ? "bg-teal-50 text-[#1F9E94] font-bold"
                    : isDone
                    ? "text-slate-700 hover:bg-slate-50 font-medium"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${
                    isCurrent
                      ? "bg-[#1F9E94] text-white"
                      : isDone
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {isDone ? "✓" : step.s}
                </div>
                <span className="text-[11px] hidden sm:block truncate">{step.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
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

      {/* STAGE 1: BASIC INFO */}
      {stage === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#1A1A2E]">Stage 1: Basic Course Information</h3>
            <p className="text-xs text-slate-500">
              Define course nomenclature, description, taxonomy category, and metadata.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Course Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (!slug || slug === title.toLowerCase().replace(/[^a-z0-9]+/g, "-")) {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
                  }
                }}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1F9E94]"
                placeholder="e.g. Coastal Navigation & Seamanship"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">URL Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1F9E94]"
                placeholder="coastal-navigation-seamanship"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1F9E94]"
              placeholder="A concise summary of key skills taught"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Course Description *
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1F9E94]"
              placeholder="In-depth overview of curriculum, learning objectives, and institutional applications..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Marathi">Marathi</option>
                <option value="Tamil">Tamil</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estimated Duration (Min)
              </label>
              <input
                type="number"
                min={15}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => setStage(2)}
              disabled={!isBasicValid}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1F9E94] hover:bg-[#1a857d] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              <span>Next: Audience &amp; Access Policy</span>
              <MoveRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: AUDIENCE & SECURITY */}
      {stage === 2 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#1A1A2E]">
              Stage 2: Target Audience &amp; Access Policy
            </h3>
            <p className="text-xs text-slate-500">
              Configure which learner classifications are eligible and whether military clearance is required.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Primary Learner Group
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "ALL", label: "Open / All Groups", desc: "Public catalogue" },
                { id: "FPO", label: "FPO Members", desc: "Farmer Producer Orgs" },
                { id: "FPC", label: "FPC Teams", desc: "Producer Companies" },
                { id: "STUDENT", label: "Students", desc: "Higher education" },
                { id: "NAVAL_OFFICER", label: "Naval Officers", desc: "Maritime & Command" },
              ].map((grp) => (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => setTargetAudience(grp.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    targetAudience === grp.id
                      ? "border-[#1F9E94] bg-teal-50/70"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-bold text-xs text-slate-900">{grp.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{grp.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Prerequisites &amp; Required Prior Knowledge
            </label>
            <input
              type="text"
              value={prerequisites}
              onChange={(e) => setPrerequisites(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
              placeholder="e.g. Basic Navigation Fundamentals or Seamanship Certification"
            />
          </div>

          {/* Security Clearance Switch */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-amber-700" />
                <span className="text-xs font-bold text-amber-900">
                  Restricted Course Policy (Naval / Institutional Clearance)
                </span>
              </div>
              <input
                type="checkbox"
                checked={isRestricted}
                onChange={(e) => setIsRestricted(e.target.checked)}
                className="h-4 w-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
              />
            </div>
            <p className="text-[11px] text-amber-800">
              When checked, learners cannot self-enroll or view lesson contents unless their account
              has an administratively approved organizational clearance.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStage(1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <MoveLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStage(3)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1F9E94] hover:bg-[#1a857d] text-white rounded-xl text-xs font-bold transition-all"
            >
              <span>Next: Curriculum Builder</span>
              <MoveRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: CURRICULUM BUILDER */}
      {stage === 3 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#1A1A2E]">Stage 3: Curriculum Builder</h3>
              <p className="text-xs text-slate-500">
                Organize learning units into modules and sequential lessons.
              </p>
            </div>
            <button
              onClick={addSection}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-[#1F9E94] hover:bg-teal-100 border border-teal-200 rounded-lg text-xs font-bold transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Module / Section</span>
            </button>
          </div>

          <div className="space-y-6">
            {sections.map((section, sIdx) => (
              <div
                key={sIdx}
                className="p-4 sm:p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-6 h-6 rounded-md bg-teal-600 text-white font-bold text-xs flex items-center justify-center">
                      {sIdx + 1}
                    </span>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => {
                        const updated = [...sections];
                        updated[sIdx].title = e.target.value;
                        setSections(updated);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs font-bold border border-slate-300 rounded-lg bg-white"
                      placeholder="Section / Module Title"
                    />
                  </div>
                  {sections.length > 1 && (
                    <button
                      onClick={() => removeSection(sIdx)}
                      className="p-1.5 text-slate-400 hover:text-red-600"
                      title="Delete module"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Lessons in this section */}
                <div className="space-y-2 pl-4 sm:pl-8 border-l-2 border-teal-200">
                  {section.lessons.map((lesson, lIdx) => (
                    <div
                      key={lIdx}
                      className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={lesson.title}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[sIdx].lessons[lIdx].title = e.target.value;
                            setSections(updated);
                          }}
                          className="flex-1 px-2.5 py-1 text-xs font-semibold border border-slate-200 rounded"
                          placeholder="Lesson Title"
                        />
                        <select
                          value={lesson.type}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[sIdx].lessons[lIdx].type = e.target.value as any;
                            setSections(updated);
                          }}
                          className="px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50"
                        >
                          <option value="text">Text Lesson</option>
                          <option value="video">Video</option>
                          <option value="pdf">Document / PDF</option>
                        </select>
                        <input
                          type="number"
                          min={5}
                          value={lesson.durationMinutes}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[sIdx].lessons[lIdx].durationMinutes = Number(e.target.value);
                            setSections(updated);
                          }}
                          className="w-16 px-2 py-1 text-xs border border-slate-200 rounded"
                          title="Minutes"
                        />
                        {section.lessons.length > 1 && (
                          <button
                            onClick={() => removeLesson(sIdx, lIdx)}
                            className="p-1 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      <textarea
                        rows={2}
                        value={lesson.content}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[sIdx].lessons[lIdx].content = e.target.value;
                          setSections(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-[11px] border border-slate-200 rounded"
                        placeholder="Content outline or learning material markdown..."
                      />
                    </div>
                  ))}

                  <button
                    onClick={() => addLesson(sIdx)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1F9E94] hover:underline pt-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Lesson to Module</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStage(2)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <MoveLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStage(4)}
              disabled={!isCurriculumValid}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1F9E94] hover:bg-[#1a857d] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              <span>Next: Assessments</span>
              <MoveRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: ASSESSMENTS */}
      {stage === 4 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#1A1A2E]">Stage 4: Course Assessments</h3>
            <p className="text-xs text-slate-500">
              Configure passing criteria and final assessment required for certificate generation.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-[#8E6BBF]" />
                <span className="text-xs font-bold text-slate-900">
                  Mandatory Final Course Assessment
                </span>
              </div>
              <input
                type="checkbox"
                checked={hasFinalAssessment}
                onChange={(e) => setHasFinalAssessment(e.target.checked)}
                className="h-4 w-4 text-[#8E6BBF] rounded border-slate-300 focus:ring-[#8E6BBF]"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              When enabled, a passing grade on the final assessment is required before an ORELSE
              blockchain credential can be minted.
            </p>

            {hasFinalAssessment && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Assessment Title
                  </label>
                  <input
                    type="text"
                    value={assessmentTitle}
                    onChange={(e) => setAssessmentTitle(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Passing Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={40}
                    max={100}
                    value={passingPercent}
                    onChange={(e) => setPassingPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Time Limit (Minutes)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={timeLimitMin}
                    onChange={(e) => setTimeLimitMin(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStage(3)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <MoveLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
            <button
              onClick={() => setStage(5)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1F9E94] hover:bg-[#1a857d] text-white rounded-xl text-xs font-bold transition-all"
            >
              <span>Next: Review &amp; Validation</span>
              <MoveRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* STAGE 5: REVIEW, VALIDATION & PUBLISH */}
      {stage === 5 && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-xs space-y-6">
          <div>
            <h3 className="text-lg font-bold text-[#1A1A2E]">
              Stage 5: Curriculum Review &amp; Publication
            </h3>
            <p className="text-xs text-slate-500">
              Verify compliance invariants before saving or publishing the course live to learners.
            </p>
          </div>

          {/* Validation Checklist */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-900 mb-2">Publishing Invariants Checklist:</div>
            <div className="flex items-center gap-2">
              {isBasicValid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={isBasicValid ? "text-slate-800" : "text-red-700 font-semibold"}>
                Basic course metadata (Title, Slug, Description)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isAudienceValid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={isAudienceValid ? "text-slate-800" : "text-red-700 font-semibold"}>
                Target audience configured: {targetAudience}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isCurriculumValid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={isCurriculumValid ? "text-slate-800" : "text-red-700 font-semibold"}>
                Curriculum has {sections.length} module(s) and {totalLessons} lesson(s) (Minimum: 1
                module, 1 lesson)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isAssessmentValid ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className={isAssessmentValid ? "text-slate-800" : "text-red-700 font-semibold"}>
                Assessment configuration (Passing score: {passingPercent}%)
              </span>
            </div>
          </div>

          {/* Summary Preview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl">
            <div>
              <span className="text-slate-500 block">Title:</span>
              <span className="font-bold text-slate-900">{title}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Audience:</span>
              <span className="font-bold text-slate-900">{targetAudience}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Modules:</span>
              <span className="font-bold text-slate-900">{sections.length} Modules</span>
            </div>
            <div>
              <span className="text-slate-500 block">Restricted:</span>
              <span className="font-bold text-slate-900">{isRestricted ? "Yes (Naval)" : "No"}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setStage(4)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
            >
              <MoveLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveOrPublish(false)}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save as Draft"}
              </button>
              <button
                onClick={() => handleSaveOrPublish(true)}
                disabled={loading || !canPublish}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#1F9E94] hover:bg-[#1a857d] text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                <span>Publish Course Live</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
