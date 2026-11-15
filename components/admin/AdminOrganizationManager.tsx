"use client";

import React, { useState, useEffect } from "react";
import {
  Building,
  Plus,
  ShieldCheck,
  Users,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Search,
} from "lucide-react";

interface OrganizationItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isVerified: boolean;
  createdAt: string;
  _count?: {
    users: number;
    assignments: number;
  };
}

export function AdminOrganizationManager() {
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/organizations");
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to reload organizations." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          code: formData.code.toUpperCase().trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create organization");
      }

      setMessage({ type: "success", text: "Organization created successfully." });
      setIsModalOpen(false);
      setFormData({ name: "", code: "", description: "" });
      await fetchOrganizations();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to create organization." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (org: OrganizationItem) => {
    if (
      !confirm(
        `Verify clearance for "${org.name}"? This will approve its institutional standing and grant its affiliated members verified status.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifyAllMembers: true }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to approve organization");
      }

      setMessage({
        type: "success",
        text: `Organization ${org.name} verified. ${data.verifiedMembersCount ?? 0} members updated with clearance.`,
      });
      await fetchOrganizations();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const filtered = organizations.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#1A1A2E] flex items-center gap-2">
            <Building className="h-5 w-5 text-[#1F9E94]" />
            Organization &amp; Command Registry
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage Naval Command divisions, Agricultural Producer Federations, and institutional clearances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrganizations}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh organizations"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1F9E94] hover:bg-[#1a857d] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Organization</span>
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search organizations by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#1F9E94]"
          />
        </div>
      </div>

      {/* Organizations Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Organization</th>
                <th className="px-5 py-3.5">Code</th>
                <th className="px-5 py-3.5">Scope Description</th>
                <th className="px-5 py-3.5 text-center">Affiliated Personnel</th>
                <th className="px-5 py-3.5 text-center">Standing Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{org.name}</div>
                    </td>
                    <td className="px-5 py-4">
                      <code className="text-[11px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-800 border border-slate-200">
                        {org.code}
                      </code>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 max-w-sm truncate">
                      {org.description || "—"}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-xs text-slate-800">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {org._count?.users ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {org.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="h-3 w-3" />
                          VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          UNVERIFIED
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {!org.isVerified && (
                        <button
                          onClick={() => handleApprove(org)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#1F9E94] hover:bg-[#1a857d] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          <span>Verify Clearance</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-500">
                    No organizations registered matching search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A2E]">Register Organization</h3>
                <p className="text-xs text-slate-500">
                  Add a new Naval Base, Agricultural Cluster, or Educational Institution.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1F9E94]"
                  placeholder="e.g. Eastern Naval Command Division"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unique Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1F9E94]"
                  placeholder="e.g. ENC-TRG"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#1F9E94]"
                  placeholder="Brief description of operations"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#1F9E94] hover:bg-[#1a857d] text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>Save Organization</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
