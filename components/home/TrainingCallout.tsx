import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck, BarChart3, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";

export function TrainingCallout() {
  const benefits = [
    "Role-specific curriculum tailored for board directors, managers, and field officers",
    "Administrative cohort tracking to monitor member completion and score benchmarks",
    "Practical digital workflows for governance compliance, accounting, and statutory filing",
    "Standardized verifiable certifications across cluster-wide learning programs",
  ];

  return (
    <section aria-labelledby="training-callout-heading" className="py-16 md:py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-8 sm:p-12 lg:p-16">
            {/* Left Column: Text & Features */}
            <div className="lg:col-span-7 flex flex-col items-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide bg-teal-50 text-[#1F9E94] border border-[#1F9E94]/30 mb-4">
                Enterprise &amp; Collective Onboarding
              </span>

              <h2
                id="training-callout-heading"
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A2E] tracking-tight leading-snug mb-4"
              >
                Training for FPOs, FPCs and Naval Officers
              </h2>

              <p className="text-base text-slate-600 leading-relaxed mb-8">
                Empower your entire collective with structured onboarding tracks, compliance-ready coursework, and administrative oversight to monitor progress across all participating members.
              </p>

              <ul className="space-y-3.5 mb-8 w-full">
                {benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-[#1F9E94] shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="text-sm sm:text-base text-slate-700">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/training"
                className={buttonVariants({
                  variant: "primary",
                  size: "lg",
                  className: "bg-[#1F9E94] hover:bg-[#168178] focus-visible:ring-[#1F9E94] text-white shadow-sm",
                })}
              >
                Explore Training
                <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
              </Link>
            </div>

            {/* Right Column: Visual / Graphic */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-md bg-gradient-to-br from-[#EAF4FC] to-teal-50/50 p-6 sm:p-8 rounded-2xl border border-teal-100/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-teal-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white rounded-xl shadow-xs text-[#1F9E94]">
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#1A1A2E]">Cohort Progress Hub</h4>
                      <p className="text-xs text-slate-500">Live Collective Metrics</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                    Active
                  </span>
                </div>

                {/* Stat cards */}
                <div className="space-y-3">
                  <div className="p-3.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-[#3E9BDB]" />
                      <span className="text-xs font-medium text-slate-700">Enrolled Members</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">42 Leaders</span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-4 w-4 text-[#1F9E94]" />
                      <span className="text-xs font-medium text-slate-700">Assessments Completed</span>
                    </div>
                    <span className="text-xs font-bold text-slate-900">88% Pass Rate</span>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-100">
                    <div className="flex justify-between text-xs mb-1.5 font-medium">
                      <span className="text-slate-600">Statutory Governance Completion</span>
                      <span className="text-[#1F9E94] font-bold">92%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-[#1F9E94] h-2 rounded-full w-[92%]" />
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 text-center pt-2 italic">
                  Integrated with administrative oversight &amp; compliance reporting.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
