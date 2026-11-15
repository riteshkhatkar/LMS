import React from "react";
import Link from "next/link";
import { brand } from "@/lib/brand";

export interface SiteFooterProps {
  locale?: string;
}

export function SiteFooter({ locale = "en" }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="bg-[#1A1A2E] text-slate-300 border-t border-slate-800"
      aria-label="Site footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand info column (takes 2 cols on lg) */}
          <div className="col-span-1 xs:col-span-2 lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#3E9BDB] flex items-center justify-center text-white font-bold text-lg">
                L
              </div>
              <span className="font-bold text-xl text-white tracking-tight">
                {brand.name}
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm leading-relaxed">
              {brand.tagline}
            </p>
            <div className="inline-block bg-slate-800/80 border border-slate-700/60 rounded-md px-3 py-1 text-xs text-amber-300 font-medium">
              Demo platform — sample content only
            </div>
          </div>

          {/* Column 1: Learn */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Learn
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/${locale}/courses`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E9BDB] rounded"
                >
                  Courses
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/training`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E9BDB] rounded"
                >
                  FPO/FPC Training
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/how-it-works`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E9BDB] rounded"
                >
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Support */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Support
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/${locale}/help`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E9BDB] rounded"
                >
                  Help & FAQs
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/verify`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E9BDB] rounded"
                >
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E9BDB] rounded"
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal & Connect */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Legal & Connect
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E9BDB] rounded"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E9BDB] rounded"
                >
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/help#accessibility`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E9BDB] rounded"
                >
                  Accessibility Statement
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/newsletter/preferences`}
                  className="hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3E9BDB] rounded"
                >
                  Newsletter Preferences
                </Link>
              </li>
              <li className="pt-2 text-xs text-slate-500 italic">
                Social links coming soon
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {currentYear} Learn LMS. Demo platform.</p>

          {/* ORELSE Product Branding */}
          <a
            href="https://www.orelse.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center sm:items-end gap-2 group transition-opacity hover:opacity-95"
            aria-label="ORELSE - Official website"
          >
            <div className="w-[100px] flex items-center justify-center sm:justify-end">
              <img
                src="/brand/orelse-logo.png"
                alt="ORELSE Logo"
                className="w-full h-auto object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity"
              />
            </div>
            <span className="text-slate-400 text-[11px] font-medium tracking-wide">
              A product by <span className="text-slate-200 font-semibold">ORELSE</span>
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
