"use client";

import React, { useState, useEffect } from "react";
import {
  Megaphone,
  MessageSquare,
  Plus,
  Send,
  Trash2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Eye,
} from "lucide-react";

interface CourseItem {
  id: string;
  title: string;
  slug: string;
}

interface AnnouncementItem {
  id: string;
  type: string;
  title: string;
  excerpt: string;
  content?: string | null;
  category: string;
  courseId?: string | null;
  course?: { id: string; title: string; slug: string } | null;
  publishedAt: string;
  readCount: number;
}

interface ThreadSummary {
  id: string;
  type: string;
  subject: string;
  status: string;
  course?: { id: string; title: string; slug: string } | null;
  creator: { id: string; name: string; role: string };
  lastMessage?: { id: string; body: string; createdAt: string; senderId: string } | null;
  updatedAt: string;
}

export function InstructorCommunicationManager({ courses }: { courses: CourseItem[] }) {
  const [activeSubTab, setActiveSubTab] = useState<"announcements" | "qa">("announcements");
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || "");

  // Announcements
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [isLoadingAnnouncements, setIsLoadingAnnouncements] = useState(false);
  const [isCreatingAnnounce, setIsCreatingAnnounce] = useState(false);
  const [annTitle, setAnnTitle] = useState("");
  const [annExcerpt, setAnnExcerpt] = useState("");
  const [annContent, setAnnContent] = useState("");
  const [annCategory, setAnnCategory] = useState("curriculum");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Q&A
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [isLoadingThreads, setIsLoadingThreads] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setIsLoadingAnnouncements(true);
      const url = selectedCourseId
        ? `/api/announcements?courseId=${selectedCourseId}`
        : "/api/announcements";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      console.error("Failed to load announcements:", err);
    } finally {
      setIsLoadingAnnouncements(false);
    }
  };

  const fetchThreads = async () => {
    try {
      setIsLoadingThreads(true);
      const url = selectedCourseId
        ? `/api/messages/threads?courseId=${selectedCourseId}`
        : "/api/messages/threads";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setThreads(data.threads || []);
        if (!selectedThreadId && data.threads?.length > 0) {
          setSelectedThreadId(data.threads[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load threads:", err);
    } finally {
      setIsLoadingThreads(false);
    }
  };

  const fetchThreadDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/messages/threads/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedThread(data.thread);
      }
    } catch (err) {
      console.error("Failed to fetch detail:", err);
    }
  };

  useEffect(() => {
    if (activeSubTab === "announcements") {
      fetchAnnouncements();
    } else {
      fetchThreads();
    }
  }, [selectedCourseId, activeSubTab]);

  useEffect(() => {
    if (selectedThreadId) {
      fetchThreadDetail(selectedThreadId);
    }
  }, [selectedThreadId]);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) {
      setFeedback({ type: "error", message: "Please select a course." });
      return;
    }

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: annTitle,
          excerpt: annExcerpt,
          content: annContent,
          type: "COURSE",
          category: annCategory,
          courseId: selectedCourseId,
          status: "PUBLISHED",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsCreatingAnnounce(false);
        setAnnTitle("");
        setAnnExcerpt("");
        setAnnContent("");
        setFeedback({ type: "success", message: `Course announcement "${data.announcement.title}" posted.` });
        await fetchAnnouncements();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to create course announcement." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Network error occurred." });
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm("Delete this course announcement?")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId || !replyText.trim()) return;

    try {
      setIsSendingReply(true);
      const res = await fetch(`/api/messages/threads/${selectedThreadId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: replyText.trim() }),
      });
      if (res.ok) {
        setReplyText("");
        await fetchThreadDetail(selectedThreadId);
        await fetchThreads();
      }
    } catch (err) {
      console.error("Failed to post message:", err);
    } finally {
      setIsSendingReply(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Course Selector */}
      <div className="bg-white p-6 rounded-2xl border border-teal-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-50 text-[#1F9E94]">
              {activeSubTab === "announcements" ? <Megaphone className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
            </span>
            <h1 className="text-xl font-bold text-slate-900">
              {activeSubTab === "announcements" ? "Course Announcements" : "Course Discussions & Q&A"}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Broadcast syllabus notifications to enrolled learners and address question threads.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {courses.length > 0 && (
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-700 focus:ring-2 focus:ring-[#1F9E94]"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          )}

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveSubTab("announcements")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                activeSubTab === "announcements" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Announcements
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab("qa")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                activeSubTab === "qa" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Q&A Threads
            </button>
          </div>
        </div>
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

      {/* Subtab 1: Announcements */}
      {activeSubTab === "announcements" && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsCreatingAnnounce(!isCreatingAnnounce)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1F9E94] hover:bg-[#1a857d] text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isCreatingAnnounce ? "Cancel" : "New Course Announcement"}</span>
            </button>
          </div>

          {isCreatingAnnounce && (
            <form onSubmit={handleCreateAnnouncement} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Post Course Announcement</h2>

              <div>
                <label htmlFor="courseAnnTitle" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  id="courseAnnTitle"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="e.g. Navigation Sensor Calibration Protocols — Module 2"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1F9E94] focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="courseAnnExcerpt" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Excerpt / Brief Summary
                </label>
                <input
                  type="text"
                  id="courseAnnExcerpt"
                  value={annExcerpt}
                  onChange={(e) => setAnnExcerpt(e.target.value)}
                  placeholder="Short notification summary sent to enrolled learners"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1F9E94] focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="courseAnnContent" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Content Body
                </label>
                <textarea
                  id="courseAnnContent"
                  rows={4}
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  placeholder="Detailed guidelines and instructions for enrolled learners..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1F9E94] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingAnnounce(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1F9E94] hover:bg-[#1a857d] text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Publish Announcement
                </button>
              </div>
            </form>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {isLoadingAnnouncements ? (
                <div className="p-8 text-center text-xs text-slate-400">Loading course announcements...</div>
              ) : announcements.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">No course announcements yet.</div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="p-5 flex items-start justify-between gap-4 hover:bg-slate-50">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900">{a.title}</h2>
                      <p className="text-xs text-slate-600 mt-0.5">{a.excerpt}</p>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                        <span>{new Date(a.publishedAt).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>{a.readCount} learner reads</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(a.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Q&A */}
      {activeSubTab === "qa" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-h-[550px]">
          <div className="lg:col-span-5 border-r border-slate-200 divide-y divide-slate-100 overflow-y-auto max-h-[550px]">
            {isLoadingThreads ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading discussion threads...</div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No course questions posted yet.</div>
            ) : (
              threads.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedThreadId === t.id ? "bg-teal-50/70 border-l-4 border-l-[#1F9E94]" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-800">{t.creator.name}</span>
                    <span className="text-slate-400">{new Date(t.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h2 className="text-sm font-semibold text-slate-900 truncate">{t.subject}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-7 flex flex-col h-full bg-slate-50/30">
            {selectedThread ? (
              <>
                <div className="p-4 bg-white border-b border-slate-200">
                  <h2 className="text-sm font-bold text-slate-900">{selectedThread.subject}</h2>
                  <p className="text-xs text-slate-500">Learner: {selectedThread.creator.name}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[420px]">
                  {selectedThread.messages?.map((m: any) => {
                    const isInstructor = m.sender.role === "INSTRUCTOR" || m.sender.role === "ADMIN";
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isInstructor ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                          <span className="font-semibold text-slate-700">{m.sender.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                            {m.sender.role}
                          </span>
                        </div>
                        <div
                          className={`p-3 rounded-2xl max-w-lg text-sm leading-relaxed ${
                            isInstructor
                              ? "bg-[#1F9E94] text-white shadow-2xs rounded-tr-xs"
                              : "bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-tl-xs"
                          }`}
                        >
                          {m.body}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Reply as Course Instructor..."
                    disabled={isSendingReply}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#1F9E94] focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyText.trim()}
                    className="p-2.5 rounded-xl bg-[#1F9E94] hover:bg-[#1a857d] text-white disabled:opacity-50 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-slate-400 text-sm">
                Select a thread to view and respond.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
