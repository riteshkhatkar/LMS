"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  MessageSquare,
  Award,
  BookOpen,
  ShieldAlert,
  Settings,
  Sliders,
  Filter,
} from "lucide-react";

interface NotificationItem {
  id: string;
  eventType: string;
  title: string;
  body: string;
  destination?: string | null;
  isRead: boolean;
  createdAt: string;
}

interface NotificationPreference {
  inAppEnabled: boolean;
  emailEnabled: boolean;
  courseUpdates: boolean;
  announcements: boolean;
  messages: boolean;
  assessmentAlerts: boolean;
}

export default function NotificationsCenterPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";

  const [activeTab, setActiveTab] = useState<"notifications" | "settings">("notifications");
  const [filterUnread, setFilterUnread] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingPref, setIsSavingPref] = useState(false);
  const [prefMessage, setPrefMessage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/notifications?limit=100${filterUnread ? "&unread=true" : ""}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const res = await fetch("/api/notifications/preferences");
      if (res.ok) {
        const data = await res.json();
        setPreferences(data.preferences);
      }
    } catch (err) {
      console.error("Failed to load preferences:", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [filterUnread]);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications/read-all", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all read:", err);
    }
  };

  const handleMarkItemRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Failed to mark read:", err);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preferences) return;
    setIsSavingPref(true);
    setPrefMessage(null);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (res.ok) {
        setPrefMessage("Notification preferences successfully saved.");
      } else {
        setPrefMessage("Failed to update preferences.");
      }
    } catch (err) {
      setPrefMessage("Network error occurred.");
    } finally {
      setIsSavingPref(false);
    }
  };

  const getEventIcon = (type: string) => {
    if (type.includes("MESSAGE")) return <MessageSquare className="w-5 h-5 text-sky-600" />;
    if (type.includes("CERTIFICATE")) return <Award className="w-5 h-5 text-emerald-600" />;
    if (type.includes("COURSE")) return <BookOpen className="w-5 h-5 text-indigo-600" />;
    return <ShieldAlert className="w-5 h-5 text-purple-600" />;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-50 text-[#3E9BDB]">
                <Bell className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Notification Center</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Stay updated on course releases, instructor announcements, credentials, and discussions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                activeTab === "notifications"
                  ? "bg-[#123E62] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Activity Feed
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-xl transition-colors cursor-pointer ${
                activeTab === "settings"
                  ? "bg-[#123E62] text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Channels & Rules</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Activity Feed */}
        {activeTab === "notifications" && (
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-slate-50/70 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterUnread(false)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    !filterUnread ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  All Alerts
                </button>
                <button
                  type="button"
                  onClick={() => setFilterUnread(true)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    filterUnread ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Unread</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.2 text-[10px] bg-red-100 text-red-700 rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs font-semibold text-sky-600 hover:text-sky-800 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark all as read</span>
                </button>
              )}
            </div>

            {/* List */}
            <div className="divide-y divide-slate-100">
              {isLoading ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-16 text-center text-sm text-slate-500">
                  No notifications match your current filter.
                </div>
              ) : (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-5 transition-colors flex items-start justify-between gap-4 hover:bg-slate-50/80 ${
                      !item.isRead ? "bg-sky-50/30" : ""
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 shrink-0">
                        {getEventIcon(item.eventType)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h2 className={`text-sm ${!item.isRead ? "font-bold text-slate-900" : "font-medium text-slate-800"}`}>
                            {item.title}
                          </h2>
                          {!item.isRead && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-sky-100 text-sky-800 rounded">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                          {item.body}
                        </p>
                        <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                          {item.destination && (
                            <Link
                              href={item.destination.startsWith("/") ? `/${locale}${item.destination}` : item.destination}
                              className="text-[#3E9BDB] font-semibold hover:underline inline-flex items-center gap-1"
                            >
                              <span>Open details</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => handleMarkItemRead(item.id)}
                        className="text-xs text-slate-500 hover:text-slate-800 p-2 rounded-lg hover:bg-slate-100 shrink-0 cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Settings & Channels */}
        {activeTab === "settings" && preferences && (
          <form onSubmit={handleSavePreferences} className="bg-white rounded-2xl shadow-xs border border-slate-200 p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Notification Preferences & Alerts</h2>
              <p className="text-xs text-slate-500 mt-1">
                Configure which alerts you receive inside the Learn LMS portal.
              </p>
            </div>

            {prefMessage && (
              <div className="p-3.5 rounded-xl bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200">
                {prefMessage}
              </div>
            )}

            <div className="space-y-4">
              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.inAppEnabled}
                  onChange={(e) => setPreferences({ ...preferences, inAppEnabled: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#3E9BDB] focus:ring-[#3E9BDB]"
                />
                <div>
                  <span className="font-semibold text-sm text-slate-900 block">In-App Notification Center</span>
                  <span className="text-xs text-slate-500 block">Display bell alerts and badge counts in the navigation header.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.courseUpdates}
                  onChange={(e) => setPreferences({ ...preferences, courseUpdates: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#3E9BDB] focus:ring-[#3E9BDB]"
                />
                <div>
                  <span className="font-semibold text-sm text-slate-900 block">Course & Curriculum Updates</span>
                  <span className="text-xs text-slate-500 block">Receive alerts when new lessons or assignments are added to enrolled courses.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.announcements}
                  onChange={(e) => setPreferences({ ...preferences, announcements: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#3E9BDB] focus:ring-[#3E9BDB]"
                />
                <div>
                  <span className="font-semibold text-sm text-slate-900 block">Institutional Announcements</span>
                  <span className="text-xs text-slate-500 block">Platform notices from Learn LMS and ORELSE administrators.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.messages}
                  onChange={(e) => setPreferences({ ...preferences, messages: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#3E9BDB] focus:ring-[#3E9BDB]"
                />
                <div>
                  <span className="font-semibold text-sm text-slate-900 block">Discussion Replies & Q&A Messages</span>
                  <span className="text-xs text-slate-500 block">Notifications when an instructor or peer responds to your discussion threads.</span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.assessmentAlerts}
                  onChange={(e) => setPreferences({ ...preferences, assessmentAlerts: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-[#3E9BDB] focus:ring-[#3E9BDB]"
                />
                <div>
                  <span className="font-semibold text-sm text-slate-900 block">Assessment & Certification Notices</span>
                  <span className="text-xs text-slate-500 block">Exam eligibility, score evaluations, and blockchain certificate issuance alerts.</span>
                </div>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                type="submit"
                disabled={isSavingPref}
                className="px-6 py-2.5 rounded-xl bg-[#123E62] hover:bg-[#1a4f7c] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSavingPref ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
