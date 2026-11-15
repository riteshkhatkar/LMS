"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  User,
  Clock,
  Filter,
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
  updatedAt: string;
}

interface MessageItem {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

export function AdminSupportManager() {
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const fetchThreads = async () => {
    try {
      setIsLoading(true);
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
      setIsLoading(false);
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

  const handleUpdateStatus = async (status: string) => {
    if (!selectedThreadId) return;
    try {
      const res = await fetch(`/api/messages/threads/${selectedThreadId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchThreadDetail(selectedThreadId);
        await fetchThreads();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredThreads = threads.filter((t) => {
    if (filterStatus === "ALL") return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-[#8E6BBF]">
              <MessageSquare className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Support Inquiries & Discussion Oversight</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor communication across all learner cohorts, answer support inquiries, and moderate threads.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden min-h-[600px]">
        {/* Left Column */}
        <div className="lg:col-span-5 border-r border-slate-200 flex flex-col h-full">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center gap-2">
            {["ALL", "OPEN", "RESOLVED", "CLOSED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  filterStatus === st
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[560px]">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">Loading threads...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">No threads match filter.</div>
            ) : (
              filteredThreads.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelectedThreadId(t.id)}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedThreadId === t.id ? "bg-purple-50/60 border-l-4 border-l-[#8E6BBF]" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="font-bold text-slate-700">{t.creator.name}</span>
                    <span className="text-slate-400">{new Date(t.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h2 className="text-sm font-semibold text-slate-900 truncate">{t.subject}</h2>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-600 font-bold">
                      {t.type}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        t.status === "OPEN"
                          ? "bg-emerald-100 text-emerald-800"
                          : t.status === "RESOLVED"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 flex flex-col h-full bg-slate-50/30">
          {selectedThread ? (
            <>
              <div className="p-5 border-b border-slate-200 bg-white flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{selectedThread.subject}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Initiated by {selectedThread.creator.name} ({selectedThread.creator.role})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedThread.status !== "RESOLVED" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("RESOLVED")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold cursor-pointer"
                    >
                      Mark Resolved
                    </button>
                  )}
                  {selectedThread.status !== "CLOSED" && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus("CLOSED")}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-bold cursor-pointer"
                    >
                      Close Thread
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[460px]">
                {selectedThread.messages?.map((m: any) => {
                  const isAdmin = m.sender.role === "ADMIN";
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 px-1">
                        <span className="font-semibold text-slate-700">{m.sender.name}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 text-slate-600">
                          {m.sender.role}
                        </span>
                        <span>·</span>
                        <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl max-w-lg text-sm leading-relaxed ${
                          isAdmin
                            ? "bg-[#123E62] text-white shadow-2xs rounded-tr-xs"
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
                  placeholder="Post administrative reply or guidance..."
                  disabled={isSending || selectedThread.status === "CLOSED"}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#8E6BBF] focus:outline-hidden disabled:bg-slate-100"
                />
                <button
                  type="submit"
                  disabled={isSending || !replyText.trim() || selectedThread.status === "CLOSED"}
                  className="p-2.5 rounded-xl bg-[#8E6BBF] hover:bg-[#7b5ca8] text-white disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                  title="Send reply"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-400 text-sm">
              Select an inquiry to view details and reply.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
