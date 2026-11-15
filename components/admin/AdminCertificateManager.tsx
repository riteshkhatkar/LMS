"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Award,
  Search,
  Filter,
  Download,
  ExternalLink,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  X,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CertificateItem {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  learnerGroup: string | null;
  orgName?: string | null;
  courseId: string;
  courseTitle: string;
  scorePercent: number | null;
  grade: string | null;
  provisional: boolean;
  status: string;
  ledgerMode: string;
  issueDate: string;
  revocationReason?: string | null;
  txHash?: string | null;
}

interface CourseOption {
  id: string;
  title: string;
}

interface AdminCertificateManagerProps {
  initialCertificates: CertificateItem[];
  courses: CourseOption[];
  locale: string;
}

export function AdminCertificateManager({
  initialCertificates,
  courses,
  locale,
}: AdminCertificateManagerProps) {
  const [certificates, setCertificates] = useState<CertificateItem[]>(initialCertificates);
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [actionTarget, setActionTarget] = useState<CertificateItem | null>(null);
  const [modalType, setModalType] = useState<"revoke" | "reissue" | null>(null);
  const [reasonInput, setReasonInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter logic
  const filtered = certificates.filter((cert) => {
    if (courseFilter !== "all" && cert.courseId !== courseFilter) return false;
    if (statusFilter !== "all" && cert.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = cert.id.toLowerCase().includes(q);
      const matchUser = cert.userName.toLowerCase().includes(q) || cert.userEmail.toLowerCase().includes(q);
      const matchCourse = cert.courseTitle.toLowerCase().includes(q);
      if (!matchId && !matchUser && !matchCourse) return false;
    }
    return true;
  });

  const handleOpenAction = (cert: CertificateItem, type: "revoke" | "reissue") => {
    setActionTarget(cert);
    setModalType(type);
    setReasonInput("");
    setMessage(null);
  };

  const handleCloseModal = () => {
    setActionTarget(null);
    setModalType(null);
    setReasonInput("");
    setProcessing(false);
  };

  const handleSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionTarget || !modalType || !reasonInput.trim()) return;

    setProcessing(true);
    setMessage(null);

    const endpoint =
      modalType === "revoke"
        ? `/api/admin/certificates/${actionTarget.id}/revoke`
        : `/api/admin/certificates/${actionTarget.id}/reissue`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reasonInput.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${modalType} certificate`);
      }

      setMessage({
        type: "success",
        text:
          modalType === "revoke"
            ? `Certificate ${actionTarget.id} has been revoked successfully.`
            : `Certificate ${actionTarget.id} reissued as ${data.newCertificate?.id}.`,
      });

      // Update state locally
      if (modalType === "revoke") {
        setCertificates((prev) =>
          prev.map((c) =>
            c.id === actionTarget.id
              ? { ...c, status: "REVOKED", revocationReason: reasonInput.trim() }
              : c
          )
        );
      } else if (modalType === "reissue" && data.newCertificate) {
        setCertificates((prev) => [
          {
            id: data.newCertificate.id,
            userId: actionTarget.userId,
            userName: actionTarget.userName,
            userEmail: actionTarget.userEmail,
            learnerGroup: actionTarget.learnerGroup,
            orgName: actionTarget.orgName,
            courseId: actionTarget.courseId,
            courseTitle: actionTarget.courseTitle,
            scorePercent: data.newCertificate.scorePercent,
            grade: data.newCertificate.grade,
            provisional: data.newCertificate.provisional,
            status: "VALID",
            ledgerMode: data.newCertificate.ledgerMode,
            issueDate: data.newCertificate.issueDate,
          },
          ...prev.map((c) =>
            c.id === actionTarget.id ? { ...c, status: "SUPERSEDED" } : c
          ),
        ]);
      }

      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-purple-600" />
            <h2 className="text-base font-bold text-[#1A1A2E]">
              Digital Certificate Management
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Inspect issued credentials, download PDFs, audit verification states, and manage formal credential revocations/reissuances.
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200/60">
          Total Credentials: <strong>{certificates.length}</strong>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, learner, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
        </div>

        <div>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-purple-500"
          >
            <option value="all">All Statuses</option>
            <option value="VALID">Valid Only</option>
            <option value="REVOKED">Revoked Only</option>
            <option value="SUPERSEDED">Superseded Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-100">
            <tr>
              <th className="py-3 px-4">Certificate ID</th>
              <th className="py-3 px-4">Learner &amp; Group</th>
              <th className="py-3 px-4">Course</th>
              <th className="py-3 px-4">Score &amp; Grade</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Ledger</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map((cert) => {
                const isValid = cert.status === "VALID";
                const isRevoked = cert.status === "REVOKED";
                const isSuperseded = cert.status === "SUPERSEDED";

                return (
                  <tr key={cert.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 break-all">
                      {cert.id}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{cert.userName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{cert.userEmail}</div>
                      {cert.learnerGroup && (
                        <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {cert.learnerGroup}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800 max-w-[200px] truncate">
                      {cert.courseTitle}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-purple-700">
                        {cert.scorePercent ? `${cert.scorePercent.toFixed(1)}%` : "—"}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {cert.grade || (cert.provisional ? "Pass (Provisional)" : "Pass")}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {isValid ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                          <ShieldCheck className="h-3 w-3" />
                          Valid
                        </span>
                      ) : isRevoked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800">
                          <AlertTriangle className="h-3 w-3" />
                          Revoked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700">
                          Superseded
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 capitalize font-mono text-[11px] text-slate-600">
                      {cert.ledgerMode || "mock"}
                    </td>

                    <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                      <Button
                        as="a"
                        href={`/api/certificates/${cert.id}/download`}
                        variant="secondary"
                        size="sm"
                        className="text-xs h-7 px-2"
                        title="Download Vector PDF"
                      >
                        <Download className="h-3 w-3" />
                      </Button>

                      <Button
                        as="a"
                        href={`/${locale}/verify/${cert.id}`}
                        target="_blank"
                        variant="secondary"
                        size="sm"
                        className="text-xs h-7 px-2"
                        title="View Public Verification"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>

                      {isValid && (
                        <>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => handleOpenAction(cert, "revoke")}
                            className="text-xs h-7 px-2"
                            title="Revoke Certificate"
                          >
                            Revoke
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenAction(cert, "reissue")}
                            className="text-xs h-7 px-2"
                            title="Reissue Certificate"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="py-8 text-center text-xs text-slate-500">
                  No certificates matched the current criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Revocation / Reissuance Modal */}
      {actionTarget && modalType && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1A1A2E]">
                {modalType === "revoke" ? (
                  <>
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                    <span>Revoke Digital Certificate</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-4 w-4 text-purple-600" />
                    <span>Reissue Digital Certificate</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={processing}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Target ID: <strong className="font-mono">{actionTarget.id}</strong>
              <br />
              Learner: <strong>{actionTarget.userName}</strong> ({actionTarget.courseTitle})
            </p>

            {modalType === "revoke" ? (
              <div className="p-3 bg-red-50 rounded-lg text-xs text-red-800 leading-relaxed border border-red-200/80">
                Warning: Revoking this credential will mark it invalid in both the database and the ledger registry. Public verification checks will report it as Revoked.
              </div>
            ) : (
              <div className="p-3 bg-purple-50 rounded-lg text-xs text-purple-800 leading-relaxed border border-purple-200/80">
                Notice: Reissuing will supersede credential {actionTarget.id} and produce a new signed certificate ID linked to the learner&apos;s verified assessment result.
              </div>
            )}

            <form onSubmit={handleSubmitAction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Auditable Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={
                    modalType === "revoke"
                      ? "e.g. Identity verification correction / Administrative review"
                      : "e.g. Corrected institutional name spelling"
                  }
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg text-xs ${
                    message.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseModal}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={modalType === "revoke" ? "danger" : "primary"}
                  size="sm"
                  disabled={processing || !reasonInput.trim()}
                  className={
                    modalType === "reissue" ? "bg-purple-600 hover:bg-purple-700 text-white" : ""
                  }
                >
                  {processing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : modalType === "revoke" ? (
                    "Confirm Revocation"
                  ) : (
                    "Confirm Reissuance"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
