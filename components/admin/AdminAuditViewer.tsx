"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Shield,
  Eye,
  X,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  details?: any;
  ipAddress?: string | null;
  createdAt: string;
  user?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
}

export function AdminAuditViewer() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/audit");
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : data.logs || []);
      }
    } catch {
      // Failed to load
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType.toLowerCase().includes(search.toLowerCase()) ||
      (log.actorEmail || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.user?.name || "").toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes("CREATE") || action.includes("APPROVE")) {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (action.includes("REVOKE") || action.includes("CANCEL") || action.includes("DELETE")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (action.includes("ROLE") || action.includes("ASSIGN")) {
      return "bg-purple-100 text-purple-800 border-purple-200";
    }
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#1A1A2E] flex items-center gap-2">
            <History className="h-5 w-5 text-[#8E6BBF]" />
            Security &amp; Operational Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of administrative actions, course publications, role elevations, and certificate revocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search action, entity, actor email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#8E6BBF]"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="ALL">All Recorded Actions</option>
            <option value="COURSE_CREATED">Course Created</option>
            <option value="COURSE_UPDATED">Course Updated / Published</option>
            <option value="ROLE_CHANGED">Role Elevation / Demotion</option>
            <option value="ORGANIZATION_APPROVED">Organization Clearance Approved</option>
            <option value="COURSE_ASSIGNED">Course Assigned</option>
            <option value="ASSIGNMENT_CANCELLED">Assignment Cancelled</option>
            <option value="CERTIFICATE_REVOKED">Certificate Revoked</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Action Executed</th>
                <th className="px-5 py-3.5">Target Entity</th>
                <th className="px-5 py-3.5">Executing Operator</th>
                <th className="px-5 py-3.5">IP / Source</th>
                <th className="px-5 py-3.5 text-right">Timestamp</th>
                <th className="px-5 py-3.5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-xs font-semibold text-slate-900">{log.entityType}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                        ID: {log.entityId}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="text-xs font-semibold text-slate-900">
                        {log.user?.name || log.actorEmail || "System"}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {log.actorRole || log.user?.role || "SYSTEM"}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-slate-500">
                      {log.ipAddress || "internal-loopback"}
                    </td>

                    <td className="px-5 py-4 text-right text-xs text-slate-500">
                      {formatDate(log.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                        title="View payload"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-500">
                    No audit records matching search parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#1A1A2E]">Audit Event Payload</h3>
                <p className="text-xs text-slate-500">Action: {selectedLog.action}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-500">Entity:</span>{" "}
                  <span className="font-bold text-slate-900">{selectedLog.entityType}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Actor:</span>{" "}
                  <span className="font-bold text-slate-900">{selectedLog.actorEmail || "System"}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Time:</span>{" "}
                  <span className="text-slate-700">{formatDate(selectedLog.createdAt)}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">IP:</span>{" "}
                  <span className="font-mono text-slate-700">{selectedLog.ipAddress || "local"}</span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-slate-700 mb-1">
                  Metadata &amp; State Payload:
                </span>
                <pre className="bg-slate-900 text-slate-200 p-3.5 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
