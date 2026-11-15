"use client";

import React, { useState, useEffect } from "react";
import {
  Mail,
  Plus,
  Send,
  Eye,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Radio,
  ExternalLink,
} from "lucide-react";

interface CampaignItem {
  id: string;
  title: string;
  subject: string;
  previewText?: string | null;
  body: string;
  deliveryChannel: string;
  status: string;
  senderName: string;
  recipientCount: number;
  deliveredCount: number;
  sentAt?: string | null;
  createdAt: string;
  creator: { id: string; name: string; email: string };
  _count: { recipients: number };
}

export function AdminNewsletterManager() {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [deliveryChannel, setDeliveryChannel] = useState("EMAIL");
  const [targetType, setTargetType] = useState<"ALL" | "COHORT">("ALL");
  const [selectedCohorts, setSelectedCohorts] = useState<string[]>(["FPO", "FPC", "STUDENT", "NAVAL_OFFICER"]);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/newsletters");
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error("Failed to load campaigns:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const audienceDefinition =
      targetType === "ALL"
        ? { sendToAll: true }
        : { cohorts: selectedCohorts };

    try {
      const res = await fetch("/api/admin/newsletters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          previewText,
          body: bodyText,
          deliveryChannel,
          audienceDefinition,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsCreating(false);
        setTitle("");
        setSubject("");
        setPreviewText("");
        setBodyText("");
        setFeedback({ type: "success", message: `Campaign "${data.campaign.title}" created successfully as draft.` });
        await fetchCampaigns();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to create campaign." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "Failed to communicate with server." });
    }
  };

  const handlePreview = async (campaignId: string) => {
    try {
      const res = await fetch(`/api/admin/newsletters/${campaignId}/preview`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data.preview);
      }
    } catch (err) {
      console.error("Failed to load preview:", err);
    }
  };

  const handleSend = async (campaignId: string) => {
    if (!confirm("Are you sure you want to dispatch this newsletter campaign to eligible recipients?")) return;

    try {
      setSendingId(campaignId);
      const res = await fetch(`/api/admin/newsletters/${campaignId}/send`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        setFeedback({
          type: "success",
          message: `Campaign dispatched: ${data.delivery.delivered} delivered (${data.delivery.adapter} adapter).`,
        });
        await fetchCampaigns();
      } else {
        setFeedback({ type: "error", message: data.error || "Failed to dispatch campaign." });
      }
    } catch (err) {
      setFeedback({ type: "error", message: "An error occurred during dispatch." });
    } finally {
      setSendingId(null);
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm("Delete this campaign?")) return;
    try {
      const res = await fetch(`/api/admin/newsletters/${campaignId}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const toggleCohort = (c: string) => {
    setSelectedCohorts((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 text-[#8E6BBF]">
              <Mail className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Institutional Newsletter Studio</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compose and broadcast newsletters with cohort targeting, RFC 8058 compliance, and local demo delivery.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#123E62] hover:bg-[#1a4f7c] text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{isCreating ? "Close Studio" : "Create New Campaign"}</span>
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

      {/* Composer Drawer / Card */}
      {isCreating && (
        <form onSubmit={handleCreateCampaign} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-base font-bold text-slate-900">Compose Newsletter Campaign</h2>
            <p className="text-xs text-slate-500 mt-0.5">Author institutional content and select targeting criteria.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Internal Campaign Name
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q1 2026 Agritech & Naval Training Brief"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden"
              />
            </div>

            <div>
              <label htmlFor="deliveryChannel" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Delivery Channel
              </label>
              <select
                id="deliveryChannel"
                value={deliveryChannel}
                onChange={(e) => setDeliveryChannel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden"
              >
                <option value="EMAIL">Email Dispatch (Local Simulated / RFC 8058)</option>
                <option value="IN_APP">In-App Notification Center Only</option>
                <option value="BOTH">Omnichannel (Email & In-App Notification)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Subject Line
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Important Updates to FPO Governance & Naval Navigation Systems"
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden"
            />
          </div>

          <div>
            <label htmlFor="previewText" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Inbox Preview / Preheader Text (Optional)
            </label>
            <input
              type="text"
              id="previewText"
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="e.g. New compliance modules and sensor calibration manuals are now live."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden"
            />
          </div>

          {/* Targeting */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Audience Targeting</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === "ALL"}
                  onChange={() => setTargetType("ALL")}
                  className="text-[#3E9BDB]"
                />
                All Active Subscribers & Public Registrations
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  checked={targetType === "COHORT"}
                  onChange={() => setTargetType("COHORT")}
                  className="text-[#3E9BDB]"
                />
                Target Specific Learner Cohorts
              </label>
            </div>

            {targetType === "COHORT" && (
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { id: "FPO", label: "FPO Members" },
                  { id: "FPC", label: "FPC Teams" },
                  { id: "STUDENT", label: "Students" },
                  { id: "NAVAL_OFFICER", label: "Naval Officers (Restricted)" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleCohort(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                      selectedCohorts.includes(item.id)
                        ? "bg-[#123E62] text-white border-[#123E62]"
                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="bodyText" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Newsletter Body (Plain Text & Paragraphs)
            </label>
            <textarea
              id="bodyText"
              rows={6}
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              placeholder="Write the full newsletter announcement here..."
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-[#3E9BDB] focus:outline-hidden leading-relaxed"
            />
          </div>

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
              Save Campaign Draft
            </button>
          </div>
        </form>
      )}

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <span className="font-bold text-sm text-slate-900">Broadcast Campaign History</span>
          <span className="text-xs text-slate-500 font-mono">{campaigns.length} campaigns</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Campaign & Subject</th>
                <th className="px-6 py-3.5">Channel</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Recipients</th>
                <th className="px-6 py-3.5">Dispatched At</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading campaigns...</td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No campaigns created yet.</td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{c.title}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{c.subject}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-700 font-bold">
                        {c.deliveryChannel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          c.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : c.status === "PROCESSING"
                            ? "bg-sky-50 text-sky-700 border border-sky-200 animate-pulse"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold">
                      {c.status === "COMPLETED" ? `${c.deliveredCount} delivered` : "Pending send"}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {c.sentAt ? new Date(c.sentAt).toLocaleString() : "Not yet"}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handlePreview(c.id)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                        title="Preview rendered email"
                      >
                        <Eye className="w-4 h-4 inline" />
                      </button>

                      {c.status !== "COMPLETED" && c.status !== "PROCESSING" && (
                        <button
                          type="button"
                          onClick={() => handleSend(c.id)}
                          disabled={sendingId === c.id}
                          className="px-3 py-1.5 rounded-lg bg-[#123E62] hover:bg-[#1a4f7c] text-white font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          <span>{sendingId === c.id ? "Sending..." : "Dispatch"}</span>
                        </button>
                      )}

                      {c.status !== "PROCESSING" && (
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Delete campaign"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 bg-[#123E62] text-white flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold">{previewData.title} — Email Preview</h2>
                <p className="text-[11px] text-sky-200">
                  Targeted estimated audience: ~{previewData.recipientEstimate} subscribers
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="text-white hover:text-white/80 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* RFC 8058 Header Preview */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
              <div>
                <span className="font-bold text-slate-800">List-Unsubscribe:</span> {previewData.rfc8058Headers["List-Unsubscribe"]}
              </div>
              <div>
                <span className="font-bold text-slate-800">List-Unsubscribe-Post:</span> {previewData.rfc8058Headers["List-Unsubscribe-Post"]}
              </div>
            </div>

            {/* HTML Iframe/Render */}
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              <div
                className="bg-white rounded-xl shadow-xs border border-slate-200 p-2 overflow-hidden"
                dangerouslySetInnerHTML={{ __html: previewData.html }}
              />
            </div>

            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs font-bold text-slate-800 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
