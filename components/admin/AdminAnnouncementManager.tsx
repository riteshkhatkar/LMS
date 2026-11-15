"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Plus,
  Trash2,
  ShieldAlert,
  Globe,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";

interface AnnouncementItem {
  id: string;
  type: string;
  title: string;
  excerpt: string;
  content?: string | null;
  category: string;
  course?: { id: string; title: string; slug: string } | null;
  targetGroup?: string | null;
  isRestricted: boolean;
  publishedAt: string;
  status: string;
  author: { id: string; name: string; role: string };
  readCount: number;
}

export function AdminAnnouncementManager() {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState("PLATFORM");
  const [category, setCategory] = useState("platform");
  const [targetGroup, setTargetGroup] = useState<string>("");
  const [isRestricted, setIsRestricted] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          excerpt,
          content,
          type,
          category,
          targetGroup: targetGroup || null,
          isRestricted,
          status: "PUBLISHED",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsCreating(false);
        setTitle("");
        setExcerpt("");
        setContent("");
        setIsRestricted(false);
        setFeedback({ type: "success", message: `Announcement "${data.announcement.title}" broadcasted successfully.` });
        await fetchAnnouncements();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to create announcement." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to communicate with server." });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete announcement:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-[#8E6BBF]">
              <Megaphone className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Institutional Announcements</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast platform updates, operational directives, and clearance-restricted bulletins.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123E62] hover:bg-[#1a4f7c] text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "Cancel" : "Post Announcement"}</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-start gap-3 text-xs font-semibold ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.type === "success" ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          <div>{feedback.message}</div>
        </div>
      )}

      {isCreating && (
        <form onSubmit={handleCreateAnnouncement} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="border-b border-slate-200 pb-3">
            <h2 className="text-base font-bold text-slate-900">Post Announcement</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="annTitle" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                id="annTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Winter 2026 Platform Upgrade & Feature Overview"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="annTarget" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Learner Cohort
              </label>
              <select
                id="annTarget"
                value={targetGroup}
                onChange={(e) => setTargetGroup(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden"
              >
                <option value="">Public / All Enrolled Learners</option>
                <option value="NAVAL_OFFICER">Naval Officers (Restricted)</option>
                <option value="FPO">FPO Members</option>
                <option value="FPC">FPC Teams</option>
                <option value="STUDENT">Students</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="annExcerpt" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Short Summary / Excerpt
            </label>
            <input
              type="text"
              id="annExcerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary displayed on notification badges and dashboard previews"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="annContent" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Content
            </label>
            <textarea
              id="annContent"
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Full announcement body and operational instructions..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={isRestricted}
              onChange={(e) => setIsRestricted(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-purple-600"
            />
            <span>Mark as Restricted Clearance Bulletin (Enforces strict naval/cohort confidentiality)</span>
          </label>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#123E62] hover:bg-[#1a4f7c] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Broadcast Announcement
            </button>
          </div>
        </form>
      )}

      {/* Announcements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900">Active Announcements</span>
          <span className="text-xs text-slate-500 font-mono">{announcements.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Announcement</th>
                <th className="px-6 py-3.5">Scope</th>
                <th className="px-6 py-3.5">Audience</th>
                <th className="px-6 py-3.5">Reads</th>
                <th className="px-6 py-3.5">Published</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading announcements...</td>
                </tr>
              ) : announcements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No announcements found.</td>
                </tr>
              ) : (
                announcements.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{a.title}</span>
                        {a.isRestricted && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            RESTRICTED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{a.excerpt}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 font-bold">
                        {a.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {a.targetGroup ? (
                        <span className="font-bold text-slate-800">{a.targetGroup}</span>
                      ) : (
                        <span className="text-slate-400">All Audiences</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold">
                      {a.readCount} reads
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(a.publishedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Delete announcement"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
