import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/Button";
import { ArrowRight, ShieldCheck } from "lucide-react";

export function HeroSection() {
  return (
    <section
      aria-label="Hero"
      className="relative overflow-hidden bg-gradient-to-b from-[#EAF4FC] via-[#F4F9FD] to-white py-12 md:py-20 lg:py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Text & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold tracking-wide bg-[#3E9BDB]/15 text-[#123E62] border border-[#3E9BDB]/30 mb-6">
              <span className="h-2 w-2 rounded-full bg-[#1F9E94]" aria-hidden="true" />
              Learn LMS | Learning &amp; Verified Certification
            </span>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1A1A2E] tracking-tight leading-tight sm:leading-tight lg:leading-[1.15] mb-6">
              Learn practical skills.{" "}
              <span className="text-[#3E9BDB]">Prove what you&apos;ve achieved.</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-700 leading-relaxed max-w-2xl mb-8">
              Explore step-by-step courses, practice with quizzes, track your progress, and earn certificates you can verify.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
              <Link
                href="/courses"
                className={buttonVariants({
                  variant: "primary",
                  size: "lg",
                  className: "shadow-md hover:shadow-lg transition-all",
                })}
              >
                Explore Courses
                <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
              </Link>
              <Link
                href="/verify"
                className={buttonVariants({
                  variant: "secondary",
                  size: "lg",
                  className: "border-2 hover:bg-[#EAF4FC]",
                })}
              >
                <ShieldCheck className="h-5 w-5 mr-2 text-[#3E9BDB]" aria-hidden="true" />
                Verify a Certificate
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Illustration */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md lg:max-w-none aspect-[4/3] sm:aspect-[16/11]">
              <Image
                src="/images/hero-illustration.svg"
                alt="Illustration of students and agricultural professionals learning practical skills and earning verified certificates"
                fill
                priority
                className="object-contain drop-shadow-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
