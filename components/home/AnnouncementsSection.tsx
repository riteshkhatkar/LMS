"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import type { Announcement } from "@/lib/types";
import { Button } from "@/components/ui/Button";

interface AnnouncementsSectionProps {
  announcements: Announcement[];
}

export function AnnouncementsSection({ announcements }: AnnouncementsSectionProps) {
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState("");

  const displayedAnnouncements = announcements.slice(0, 3);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!consent) {
      setError("Please confirm your consent to receive updates.");
      return;
    }
    setError("");
    setSubscribed(true);
  };

  const getCategoryBadgeClass = (category: Announcement["category"]) => {
    switch (category) {
      case "course":
        return "bg-teal-50 text-[#1F9E94] border-teal-200";
      case "feature":
        return "bg-purple-50 text-[#8E6BBF] border-purple-200";
      default:
        return "bg-blue-50 text-[#3E9BDB] border-blue-200";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <section aria-labelledby="announcements-heading" className="py-16 md:py-24 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#3E9BDB] mb-2">
              <Bell className="h-4 w-4" />
              Platform Updates
            </div>
            <h2
              id="announcements-heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#1A1A2E] tracking-tight"
            >
              News &amp; Announcements
            </h2>
          </div>
          <Link
            href="/help"
            className="mt-4 md:mt-0 inline-flex items-center text-sm font-semibold text-[#3E9BDB] hover:text-[#2b88c7] transition-colors"
          >
            Visit Help Center
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {/* 3 Announcement cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {displayedAnnouncements.map((item) => (
            <Link
              key={item.id}
              href="/help"
              className="group flex flex-col justify-between p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-[#3E9BDB]/40 hover:bg-[#EAF4FC]/30 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${getCategoryBadgeClass(
                      item.category
                    )}`}
                  >
                    {item.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(item.publishedAt)}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#1A1A2E] group-hover:text-[#3E9BDB] transition-colors mb-2 line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                  {item.excerpt}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200/60 flex items-center text-xs font-semibold text-[#3E9BDB]">
                Read details in Help
                <ArrowRight className="h-3.5 w-3.5 ml-1 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter Opt-in Form */}
        <div className="max-w-3xl mx-auto p-8 rounded-3xl bg-gradient-to-br from-[#EAF4FC] via-[#F3F8FC] to-slate-50 border border-[#3E9BDB]/20 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-6">
            <h3 className="text-xl font-bold text-[#1A1A2E]">
              Stay informed: get platform updates and course news
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              Subscribe to periodic announcements regarding new learning paths, certification guides, and platform features.
            </p>
          </div>

          {subscribed ? (
            <div className="flex items-center justify-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <span>Thank you! Newsletter registration will be enabled in a future update.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  aria-label="Email address for newsletter"
                  required
                  className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#3E9BDB]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="px-6 py-3 h-auto whitespace-nowrap text-sm font-semibold"
                >
                  Subscribe
                </Button>
              </div>

              <div className="flex items-start gap-2.5">
                <input
                  id="newsletter-consent"
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="h-4 w-4 mt-0.5 rounded border-slate-300 text-[#3E9BDB] focus:ring-[#3E9BDB]"
                />
                <label htmlFor="newsletter-consent" className="text-xs text-slate-600 leading-snug">
                  I agree to receive informative communications and platform updates from Learn LMS. You can unsubscribe at any time.
                </label>
              </div>

              {error && (
                <p className="text-xs font-medium text-red-600 mt-1">{error}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
