"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Mail, CheckCircle2, AlertCircle, Bell, BookOpen, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function NewsletterPreferencesPage() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(true);
  const [generalNews, setGeneralNews] = useState(true);
  const [courseAlerts, setCourseAlerts] = useState(true);
  const [trainingAnnouncements, setTrainingAnnouncements] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        const url = token ? `/api/newsletter/preferences?token=${token}` : `/api/newsletter/preferences`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data.subscription) {
            setEmail(data.subscription.email);
            setIsSubscribed(data.subscription.isSubscribed);
            setGeneralNews(data.subscription.generalNews);
            setCourseAlerts(data.subscription.courseAlerts);
            setTrainingAnnouncements(data.subscription.trainingAnnouncements);
            setToken(data.subscription.unsubscribeToken);
          }
        } else {
          // If no existing sub, allow them to subscribe
          setIsSubscribed(true);
        }
      } catch (err) {
        console.error("Failed to load preferences:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
  }, [tokenFromUrl]);

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      if (!token && email) {
        // Initial subscription
        const subRes = await fetch("/api/newsletter/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            generalNews,
            courseAlerts,
            trainingAnnouncements,
          }),
        });
        const subData = await subRes.json();
        if (subRes.ok) {
          setToken(subData.subscription.unsubscribeToken);
          setIsSubscribed(true);
          setFeedback({ type: "success", message: "Successfully subscribed and saved preferences." });
        } else {
          setFeedback({ type: "error", message: subData.error || "Failed to save preferences." });
        }
      } else {
        // Update existing preferences
        const res = await fetch("/api/newsletter/preferences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            isSubscribed,
            generalNews,
            courseAlerts,
            trainingAnnouncements,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setFeedback({ type: "success", message: "Your communication preferences have been updated." });
        } else {
          setFeedback({ type: "error", message: data.error || "Failed to update preferences." });
        }
      }
    } catch (err: any) {
      setFeedback({ type: "error", message: "An unexpected error occurred while saving." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOneClickUnsubscribe = async () => {
    if (!token) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/newsletter/unsubscribe/${token}`, { method: "POST" });
      if (res.ok) {
        setIsSubscribed(false);
        setFeedback({
          type: "success",
          message: "You have been successfully unsubscribed from all Learn LMS emails.",
        });
      } else {
        setFeedback({ type: "error", message: "Failed to unsubscribe. Please try again." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Network error occurred." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-[80vh] bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#123E62] text-white p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 text-xs font-semibold text-sky-200 mb-3">
              <Mail className="w-3.5 h-3.5" />
              <span>Learn LMS Communications</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Newsletter & Notification Preferences</h1>
            <p className="mt-2 text-sm text-sky-100/90 leading-relaxed">
              Manage the institutional announcements, course updates, and training digests you receive from Learn LMS by ORELSE.
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {feedback && (
              <div
                className={`p-4 rounded-xl flex items-start gap-3 text-sm ${
                  feedback.type === "success"
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-red-50 text-red-800 border border-red-200"
                }`}
              >
                {feedback.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                )}
                <div>{feedback.message}</div>
              </div>
            )}

            {isLoading ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                Loading your preference profile...
              </div>
            ) : (
              <form onSubmit={handleSavePreferences} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={Boolean(token)}
                    required
                    placeholder="learner@learnlms.local"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-500 text-sm"
                  />
                  {token && (
                    <p className="text-xs text-slate-500 mt-1">
                      Preferences linked to verified subscription token.
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 space-y-4">
                  <h2 className="text-base font-bold text-slate-800">Content Subscriptions</h2>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={generalNews && isSubscribed}
                      disabled={!isSubscribed}
                      onChange={(e) => setGeneralNews(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#3E9BDB] focus:ring-[#3E9BDB]"
                    />
                    <div>
                      <span className="font-semibold text-sm text-slate-900 block">General Platform News & Monthly Digest</span>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Feature releases, ORELSE platform improvements, and organizational milestones.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={courseAlerts && isSubscribed}
                      disabled={!isSubscribed}
                      onChange={(e) => setCourseAlerts(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#3E9BDB] focus:ring-[#3E9BDB]"
                    />
                    <div>
                      <span className="font-semibold text-sm text-slate-900 block">Course Alerts & Curriculum Updates</span>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        New lesson releases, syllabus changes, and instructor announcements for enrolled courses.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={trainingAnnouncements && isSubscribed}
                      disabled={!isSubscribed}
                      onChange={(e) => setTrainingAnnouncements(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-[#3E9BDB] focus:ring-[#3E9BDB]"
                    />
                    <div>
                      <span className="font-semibold text-sm text-slate-900 block">Naval & FPO Training Notices</span>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        Operational readiness schedules, FPO compliance deadlines, and specialized cohort briefings.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#123E62] hover:bg-[#1a4f7c] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Preferences"}
                  </button>

                  {token && isSubscribed && (
                    <button
                      type="button"
                      onClick={handleOneClickUnsubscribe}
                      disabled={isSaving}
                      className="w-full sm:w-auto text-xs text-red-600 hover:text-red-800 font-semibold px-4 py-2 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      Unsubscribe from All Emails
                    </button>
                  )}

                  {token && !isSubscribed && (
                    <button
                      type="button"
                      onClick={() => setIsSubscribed(true)}
                      className="w-full sm:w-auto text-xs text-sky-600 hover:text-sky-800 font-semibold px-4 py-2 rounded-xl hover:bg-sky-50 transition-colors cursor-pointer"
                    >
                      Resubscribe to Communications
                    </button>
                  )}
                </div>
              </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Compliant with RFC 8058 One-Click Unsubscribe standards.</span>
              <a href="https://www.orelse.ai" target="_blank" rel="noopener noreferrer" className="hover:text-slate-800 underline">
                ORELSE Platform Services
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
