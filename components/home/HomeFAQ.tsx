"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: "Who can learn on Learn LMS?",
    answer:
      "Anyone can browse. FPO, FPC, Naval Officers and Students can enroll after registering.",
  },
  {
    question: "How do quizzes work?",
    answer:
      "Each section has short MCQ practice quizzes. A final assessment unlocks after completing all required lessons.",
  },
  {
    question: "What score is needed to pass?",
    answer:
      "The passing score is set per course and displayed on the course detail page. The default is above 60%.",
  },
  {
    question: "When do certificates become available?",
    answer:
      "After completing all required lessons and passing the final assessment.",
  },
  {
    question: "How are certificates verified?",
    answer:
      "Each certificate has a unique ID and QR code. Anyone can check it at /verify.",
  },
  {
    question: "Can FPO admins monitor their group?",
    answer:
      "Yes. Organisation admins and Naval Training Officers have access to an onboarding tracker showing completion and scores.",
  },
  {
    question: "Do you offer accreditations?",
    answer:
      "Learn LMS issues its own verifiable certificates. We do not claim external accreditations or government recognition.",
  },
];

export function HomeFAQ() {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0]);

  const toggleItem = (index: number) => {
    setOpenIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section aria-labelledby="home-faq-heading" className="py-16 md:py-24 bg-slate-50 border-t border-slate-100">
      {/* FAQPage JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#3E9BDB]">
            Clear Answers
          </span>
          <h2
            id="home-faq-heading"
            className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A2E] tracking-tight"
          >
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Everything you need to know about our courses, assessments, and verified certificates.
          </p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openIndexes.includes(index);
            const contentId = `faq-answer-${index}`;
            const headerId = `faq-header-${index}`;

            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs transition-colors"
              >
                <h3>
                  <button
                    id={headerId}
                    type="button"
                    onClick={() => toggleItem(index)}
                    aria-expanded={isOpen}
                    aria-controls={contentId}
                    className="w-full flex items-center justify-between p-5 text-left text-base sm:text-lg font-semibold text-[#1A1A2E] hover:text-[#3E9BDB] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3E9BDB] transition-colors"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 ml-4 ${
                        isOpen ? "transform rotate-180 text-[#3E9BDB]" : ""
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                </h3>
                {isOpen && (
                  <div
                    id={contentId}
                    role="region"
                    aria-labelledby={headerId}
                    className="px-5 pb-5 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 pt-3"
                  >
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
