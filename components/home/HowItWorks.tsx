import { Search, BookOpen, Award, CheckCircle } from "lucide-react";

interface Step {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    icon: Search,
    title: "Choose a course",
    description: "Browse for your role and goals",
  },
  {
    number: 2,
    icon: BookOpen,
    title: "Learn and practice",
    description: "Follow lessons, watch videos and take quizzes",
  },
  {
    number: 3,
    icon: Award,
    title: "Complete the assessment",
    description: "Show what you've learned in the final test",
  },
  {
    number: 4,
    icon: CheckCircle,
    title: "Verify your certificate",
    description: "Share and verify your achievement anywhere",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works-heading" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#3E9BDB]">
            Clear Path to Mastery
          </span>
          <h2
            id="how-it-works-heading"
            className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A2E] tracking-tight"
          >
            How learning works
          </h2>
          <p className="mt-3 text-base text-slate-600">
            A structured, transparent learning experience from your first lesson to a verifiable credential.
          </p>
        </div>

        <div className="relative">
          {/* Connecting line on desktop */}
          <div
            aria-hidden="true"
            className="hidden lg:block absolute top-12 left-1/8 right-1/8 h-0.5 bg-gradient-to-r from-[#3E9BDB]/30 via-[#1F9E94]/40 to-[#3E9BDB]/30 z-0"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {STEPS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className="flex flex-col items-center text-center p-6 rounded-2xl bg-white border border-slate-100 shadow-xs hover:border-slate-200 transition-all"
                >
                  <div className="relative mb-6">
                    {/* Icon container */}
                    <div className="w-16 h-16 rounded-2xl bg-[#EAF4FC] text-[#3E9BDB] flex items-center justify-center shadow-xs">
                      <Icon className="h-8 w-8" />
                    </div>
                    {/* Step number badge */}
                    <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[#1F9E94] text-white text-xs font-bold flex items-center justify-center shadow-xs border-2 border-white">
                      {step.number}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-xs">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
