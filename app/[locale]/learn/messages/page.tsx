"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import {
  MessageSquare,
  Plus,
  Send,
  HelpCircle,
  BookOpen,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

interface ThreadSummary {
  id: string;
  type: string;
  subject: string;
  status: string;
  course?: { id: string; title: string; slug: string } | null;
  creator: { id: string; name: string; role: string };
  lastMessage?: { id: string; body: string; createdAt: string; senderId: string } | null;
  messageCount: number;
  hasUnread: boolean;
  updatedAt: string;
}

interface MessageItem {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

interface ThreadDetail {
  id: string;
  type: string;
  subject: string;
  status: string;
  course?: { id: string; title: string; slug: string } | null;
  creator: { id: string; name: string; role: string };
  messages: MessageItem[];
}

export default function LearnerMessagesPage() {
  const searchParams = useSearchParams();
  const initialThreadId = searchParams.get("thread");

  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(initialThreadId);
  const [selectedThread, setSelectedThread] = useState<ThreadDetail | null>(null);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isLoadingThreads, setIsLoadingThreads] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // New Thread Modal
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newType, setNewType] = useState("SUPPORT");
  const [newInitialMsg, setNewInitialMsg] = useState("");
  const [newModalError, setNewModalError] = useState<string | null>(null);

  const fetchThreads = async () => {
    try {
      setIsLoadingThreads(true);
      const res = await fetch("/api/messages/threads");
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

  const fetchThreadDetail = async (threadId: string) => {
    try {
      setIsLoadingMessages(true);
      const res = await fetch(`/api/messages/threads/${threadId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedThread(data.thread);
        // Refresh thread list to update read flags
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, hasUnread: false } : t))
        );
      }
    } catch (err) {
      console.error("Failed to fetch thread messages:", err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (selectedThreadId) {
      fetchThreadDetail(selectedThreadId);
    }
  }, [selectedThreadId]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThreadId || !replyText.trim()) return;

    try {
      setIsSending(true);
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
      setIsSending(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewModalError(null);

    if (!newSubject.trim() || !newInitialMsg.trim()) {
      setNewModalError("Subject and message are required.");
      return;
    }

    try {
      const res = await fetch("/api/messages/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newSubject.trim(),
          type: newType,
          initialMessage: newInitialMsg.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.thread) {
        setIsNewModalOpen(false);
        setNewSubject("");
        setNewInitialMsg("");
        await fetchThreads();
        setSelectedThreadId(data.thread.id);
      } else {
        setNewModalError(data.error || "Failed to create discussion thread.");
      }
    } catch (err) {
      setNewModalError("An unexpected error occurred.");
    }
  };

  const filteredThreads = threads.filter((t) => {
    if (filterType === "ALL") return true;
    return t.type === filterType;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-xs border border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-sky-50 text-[#3E9BDB]">
                <MessageSquare className="w-6 h-6" />
              </span>
              <h1 className="text-2xl font-bold text-slate-900">Learner Discussions & Support</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Communicate with course instructors, institutional advisors, and support staff.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#123E62] hover:bg-[#1a4f7c] text-white font-bold text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Inquiry / Question</span>
          </button>
        </div>

        {/* Master-Detail Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden min-h-[600px]">
          {/* Left Column: Thread List */}
          <div className="lg:col-span-5 border-r border-slate-200 flex flex-col h-full">
            {/* Filter pills */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  filterType === "ALL" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType("COURSE_QA")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  filterType === "COURSE_QA" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Course Q&A
              </button>
              <button
                type="button"
                onClick={() => setFilterType("SUPPORT")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  filterType === "SUPPORT" ? "bg-white text-slate-900 shadow-xs border border-slate-200" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Support
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[560px]">
              {isLoadingThreads ? (
                <div className="p-8 text-center text-xs text-slate-500">Loading discussions...</div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">No discussions found.</div>
              ) : (
                filteredThreads.map((t) => {
                  const isSelected = selectedThreadId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedThreadId(t.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected ? "bg-sky-50/70 border-l-4 border-l-[#3E9BDB]" : "hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                          {t.type === "COURSE_QA" ? "Course Q&A" : "Support"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(t.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-semibold text-slate-900 truncate flex-1">
                          {t.subject}
                        </h2>
                        {t.hasUnread && (
                          <span className="w-2 h-2 rounded-full bg-sky-600 shrink-0" />
                        )}
                      </div>

                      {t.lastMessage && (
                        <p className="text-xs text-slate-500 line-clamp-1 mt-1">
                          {t.lastMessage.body}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Active Thread Stream & Composer */}
          <div className="lg:col-span-7 flex flex-col h-full bg-slate-50/30">
            {selectedThread ? (
              <>
                {/* Thread Header */}
                <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-sky-100 text-sky-800">
                        {selectedThread.type}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-emerald-100 text-emerald-800">
                        {selectedThread.status}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900">{selectedThread.subject}</h2>
                    {selectedThread.course && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Related Course: {selectedThread.course.title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[460px]">
                  {isLoadingMessages ? (
                    <div className="text-center py-12 text-xs text-slate-500">Loading conversation...</div>
                  ) : (
                    selectedThread.messages.map((m) => {
                      const isStaff = m.sender.role === "ADMIN" || m.sender.role === "INSTRUCTOR";
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isStaff ? "items-start" : "items-end"}`}
                        >
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                            <span className="font-semibold text-slate-700">{m.sender.name}</span>
                            {isStaff && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-700">
                                {m.sender.role}
                              </span>
                            )}
                            <span>·</span>
                            <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>

                          <div
                            className={`p-3.5 rounded-2xl max-w-lg text-sm leading-relaxed ${
                              isStaff
                                ? "bg-white border border-slate-200 text-slate-800 shadow-2xs rounded-tl-xs"
                                : "bg-[#123E62] text-white shadow-2xs rounded-tr-xs"
                            }`}
                          >
                            {m.body}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Composer */}
                <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-200 flex items-center gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response or clarification..."
                    disabled={isSending || selectedThread.status === "CLOSED"}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden disabled:bg-slate-100"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !replyText.trim() || selectedThread.status === "CLOSED"}
                    className="p-2.5 rounded-xl bg-[#123E62] hover:bg-[#1a4f7c] text-white disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                <MessageSquare className="w-12 h-12 stroke-[1.5] mb-3 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Select a discussion</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Choose a thread from the list on the left or create a new question for instructors.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal: New Inquiry */}
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-6 py-4 bg-[#123E62] text-white flex items-center justify-between">
                <h2 className="font-bold text-base">New Discussion / Inquiry</h2>
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="text-white/80 hover:text-white text-lg font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateThread} className="p-6 space-y-4">
                {newModalError && (
                  <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                    {newModalError}
                  </div>
                )}

                <div>
                  <label htmlFor="newType" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Inquiry Category
                  </label>
                  <select
                    id="newType"
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden"
                  >
                    <option value="SUPPORT">General Support / Credential Help</option>
                    <option value="COURSE_QA">Course Question & Answer</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="newSubject" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="newSubject"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    placeholder="e.g. Question regarding final assessment criteria"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label htmlFor="newInitialMsg" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Message
                  </label>
                  <textarea
                    id="newInitialMsg"
                    rows={4}
                    value={newInitialMsg}
                    onChange={(e) => setNewInitialMsg(e.target.value)}
                    placeholder="Describe your inquiry in detail..."
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden"
                  />
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#123E62] hover:bg-[#1a4f7c] text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Post Inquiry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
