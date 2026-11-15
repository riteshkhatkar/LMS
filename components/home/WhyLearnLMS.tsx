import { Layers, TrendingUp, Scale, ShieldCheck, Languages } from "lucide-react";

interface Pillar {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  tag?: string;
}

const PILLARS: Pillar[] = [
  {
    icon: Layers,
    title: "Structured lessons",
    description: "Step-by-step content built for practical learners, designed around actionable agricultural and business skills.",
  },
  {
    icon: TrendingUp,
    title: "Clear progress",
    description: "See exactly where you are, track section milestones, and know what learning path comes next.",
  },
  {
    icon: Scale,
    title: "Fair assessments",
    description: "Transparent scoring with configurable grade rules, timed quizzes, and objective criteria for certificate eligibility.",
  },
  {
    icon: ShieldCheck,
    title: "Verifiable results",
    description: "Certificates you can share across professional networks, allowing employers and partners to verify authenticity.",
  },
  {
    icon: Languages,
    title: "Regional languages",
    description: "Available in English, Hindi, and Marathi to ensure accessibility across regional farming and business communities.",
    tag: "Hindi & Marathi in preview",
  },
];

export function WhyLearnLMS() {
  return (
    <section aria-labelledby="why-learn-heading" className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#3E9BDB]">
            Built for Practical Impact
          </span>
          <h2
            id="why-learn-heading"
            className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A2E] tracking-tight"
          >
            Why Learn LMS?
          </h2>
          <p className="mt-4 text-base text-slate-600">
            A purpose-built learning management system combining rigorous instruction with dependable credential verification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon;
            const isWide = idx === 4; // 5th item can stretch across columns or center on large screens
            return (
              <div
                key={pillar.title}
                className={`relative flex flex-col p-8 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-[#3E9BDB]/40 transition-all ${
                  isWide ? "md:col-span-2 lg:col-span-1" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-xl bg-[#EAF4FC] text-[#3E9BDB] flex items-center justify-center">
                    <Icon className="h-6 w-6" />
                  </div>
                  {pillar.tag && (
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {pillar.tag}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-[#1A1A2E] mb-2">{pillar.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
