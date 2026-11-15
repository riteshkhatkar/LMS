"use client";

import React, { useState } from "react";
import { ChevronDown, Video, FileText, AlignLeft, PlayCircle, Eye, HelpCircle, Clock } from "lucide-react";
import type { SectionSummary, LessonSummary, LessonMediaType } from "@/lib/types";
import { formatDuration } from "@/lib/utils";

export interface CurriculumAccordionProps {
  sections: SectionSummary[];
}

function LessonIcon({ mediaType }: { mediaType: LessonMediaType }) {
  switch (mediaType) {
    case "video":
      return <PlayCircle className="w-4 h-4 text-[#3E9BDB] shrink-0" />;
    case "pdf":
      return <FileText className="w-4 h-4 text-[#EE8A2B] shrink-0" />;
    case "text":
    default:
      return <AlignLeft className="w-4 h-4 text-[#1F9E94] shrink-0" />;
  }
}

export function CurriculumAccordion({ sections }: CurriculumAccordionProps) {
  // By default, open the first section
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => {
    if (!sections || sections.length === 0) return {};
    return { [sections[0].id]: true };
  });

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const expandAll = () => {
    const allOpen = sections.reduce((acc, s) => ({ ...acc, [s.id]: true }), {});
    setOpenSections(allOpen);
  };

  const collapseAll = () => {
    setOpenSections({});
  };

  if (!sections || sections.length === 0) {
    return <p className="text-sm text-gray-500 italic">Curriculum details are being updated.</p>;
  }

  const allOpen = sections.every((s) => openSections[s.id]);

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between text-xs text-gray-500 pb-1">
        <span>
          {sections.length} section{sections.length === 1 ? "" : "s"} ·{" "}
          {sections.reduce((acc, s) => acc + s.lessons.length, 0)} lessons
        </span>
        <button
          type="button"
          onClick={allOpen ? collapseAll : expandAll}
          className="text-[#3E9BDB] hover:underline font-semibold focus:outline-none"
        >
          {allOpen ? "Collapse all sections" : "Expand all sections"}
        </button>
      </div>

      {/* Sections Accordion */}
      <div className="border border-gray-200 rounded-xl divide-y divide-gray-200 overflow-hidden bg-white shadow-2xs">
        {sections.map((section, idx) => {
          const isOpen = Boolean(openSections[section.id]);
          const sectionDuration = section.lessons.reduce((acc, l) => acc + (l.durationMinutes || 0), 0);

          return (
            <div key={section.id} className="group">
              {/* Section Header Button */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors focus:outline-none focus:bg-slate-50 focus:ring-2 focus:ring-inset focus:ring-[#3E9BDB]"
                aria-expanded={isOpen}
                aria-controls={`section-content-${section.id}`}
              >
                <div className="flex items-center gap-3 pr-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-snug">
                      {section.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {section.lessons.length} lesson{section.lessons.length === 1 ? "" : "s"}
                      {sectionDuration > 0 && ` · ${formatDuration(sectionDuration)}`}
                      {section.hasQuiz && ` · Quiz included`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-gray-700" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Collapsible Lessons List */}
              {isOpen && (
                <div
                  id={`section-content-${section.id}`}
                  className="bg-slate-50/70 divide-y divide-gray-100 border-t border-gray-100 px-4 py-2"
                >
                  {section.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="py-2.5 flex items-center justify-between text-xs hover:bg-white/80 rounded-md px-2 -mx-2 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                        <LessonIcon mediaType={lesson.mediaType} />
                        <span className="font-medium text-gray-800 truncate">
                          {lesson.title}
                        </span>

                        {lesson.isPreview && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#1d70a2] shrink-0 border border-blue-200">
                            <Eye className="w-3 h-3" />
                            Preview
                          </span>
                        )}

                        {lesson.hasQuiz && (
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 shrink-0 border border-amber-200">
                            <HelpCircle className="w-3 h-3" />
                            Quiz
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-gray-500 shrink-0">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span>{formatDuration(lesson.durationMinutes)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CurriculumAccordion;
