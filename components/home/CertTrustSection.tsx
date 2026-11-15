import Link from "next/link";
import { Fingerprint, QrCode, Award, ArrowRight } from "lucide-react";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { buttonVariants } from "@/components/ui/Button";

export function CertTrustSection() {
  const trustFeatures = [
    {
      icon: Fingerprint,
      title: "Unique Certificate ID",
      description: "Every certificate receives an unalterable, unique identifier for public lookup and records validation.",
    },
    {
      icon: QrCode,
      title: "QR Code for Quick Check",
      description: "Instant scannable QR codes allow employers, banks, and stakeholders to verify credentials instantly on mobile.",
    },
    {
      icon: Award,
      title: "Signed by Learn LMS",
      description: "Direct cryptographic verification ensuring integrity and provenance directly from our certification service.",
    },
  ];

  return (
    <section aria-labelledby="cert-trust-heading" className="py-16 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-10">
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#3E9BDB]">
            Verifiable Credentials
          </span>
          <h2
            id="cert-trust-heading"
            className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A2E] tracking-tight"
          >
            Earn a certificate that can be checked
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Certificates are issued only after successfully completing all required lessons and passing the comprehensive final assessment. Anyone can independently confirm certificate authenticity at any time.
          </p>
        </div>

        {/* Prominent Demo Notice */}
        <div className="max-w-2xl mx-auto mb-12">
          <DemoBanner
            message="Demo verification — not yet anchored on a public blockchain."
            variant="demo"
            className="shadow-xs"
          />
        </div>

        {/* 3 Feature Points */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {trustFeatures.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#3E9BDB]/40 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-white text-[#3E9BDB] shadow-xs flex items-center justify-center mb-4 border border-slate-100">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="text-base font-bold text-[#1A1A2E] mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feat.description}</p>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/verify"
            className={buttonVariants({
              variant: "primary",
              size: "lg",
              className: "shadow-sm",
            })}
          >
            See Verification
            <ArrowRight className="h-5 w-5 ml-2" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
