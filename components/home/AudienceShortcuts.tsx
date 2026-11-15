import Link from "next/link";
import { Users, Building2, GraduationCap, UserCheck, ArrowRight } from "lucide-react";

interface AudienceCardData {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  bgColor: string;
}

const AUDIENCE_CARDS: AudienceCardData[] = [
  {
    title: "FPO Members",
    description: "Governance, member mobilization, and practical agricultural cooperative leadership.",
    href: "/courses?audience=FPO",
    icon: Users,
    accentColor: "text-[#3E9BDB]",
    bgColor: "bg-[#EAF4FC]",
  },
  {
    title: "FPC Teams",
    description: "Statutory compliance, financial operations, marketing, and business planning.",
    href: "/courses?audience=FPC",
    icon: Building2,
    accentColor: "text-[#1F9E94]",
    bgColor: "bg-teal-50",
  },
  {
    title: "Students",
    description: "Foundational digital skills, agricultural data literacy, and career readiness.",
    href: "/courses?audience=STUDENT",
    icon: GraduationCap,
    accentColor: "text-[#8E6BBF]",
    bgColor: "bg-purple-50",
  },
  {
    title: "Naval Officers",
    description: "Naval training workflows, platform operations, and performance tracking.",
    href: "/courses?audience=NAVAL_OFFICER",
    icon: UserCheck,
    accentColor: "text-[#EE8A2B]",
    bgColor: "bg-orange-50",
  },
];

export function AudienceShortcuts() {
  return (
    <section aria-labelledby="audience-shortcuts-heading" className="py-16 md:py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2
            id="audience-shortcuts-heading"
            className="text-2xl sm:text-3xl font-bold text-[#1A1A2E] tracking-tight"
          >
            Who are you learning for?
          </h2>
          <p className="mt-3 text-base text-slate-600">
            Tailored learning tracks designed for roles across the agricultural collective ecosystem.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {AUDIENCE_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.title}
                href={card.href}
                className="group relative flex flex-col justify-between p-6 bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-[#3E9BDB]/50 transition-all duration-200"
              >
                <div>
                  <div
                    className={`inline-flex items-center justify-center p-3 rounded-lg ${card.bgColor} ${card.accentColor} mb-4 transition-transform group-hover:scale-105`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#1A1A2E] group-hover:text-[#3E9BDB] transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center text-sm font-semibold text-[#3E9BDB] group-hover:translate-x-1 transition-transform">
                  <span>Explore courses</span>
                  <ArrowRight className="h-4 w-4 ml-1.5" aria-hidden="true" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
