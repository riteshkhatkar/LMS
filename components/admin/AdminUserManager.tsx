"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Building,
  UserCheck,
  UserX,
  Loader2,
  RefreshCw,
  X,
  Edit,
  Lock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: "LEARNER" | "INSTRUCTOR" | "ADMIN";
  learnerGroup: string | null;
  isOrgVerified: boolean;
  isActive: boolean;
  createdAt: string;
  organization?: {
    id: string;
    name: string;
    code: string;
  } | null;
  _count?: {
    enrollments: number;
    quizAttempts: number;
    certificates: number;
  };
}

export function AdminUserManager() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [verifiedFilter, setVerifiedFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [formRole, setFormRole] = useState<"LEARNER" | "INSTRUCTOR" | "ADMIN">("LEARNER");
  const [formVerified, setFormVerified] = useState(false);
  const [formActive, setFormActive] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to reload users." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (user: UserItem) => {
    setEditingUser(user);
    setFormRole(user.role);
    setFormVerified(user.isOrgVerified);
    setFormActive(user.isActive);
    setIsModalOpen(true);
    setMessage(null);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setActionLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: formRole,
          isOrgVerified: formVerified,
          isActive: formActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      setMessage({
        type: "success",
        text: `User ${editingUser.name || editingUser.email} updated successfully.`,
      });
      setIsModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to update user." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleActive = async (user: UserItem) => {
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update active state");
      }

      setMessage({
        type: "success",
        text: `User ${user.email} is now ${!user.isActive ? "active" : "inactive"}.`,
      });
      await fetchUsers();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.organization?.name || "").toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    const matchesGroup = groupFilter === "ALL" || u.learnerGroup === groupFilter;
    const matchesVerified =
      verifiedFilter === "ALL" ||
      (verifiedFilter === "VERIFIED" && u.isOrgVerified) ||
      (verifiedFilter === "UNVERIFIED" && !u.isOrgVerified);

    return matchesSearch && matchesRole && matchesGroup && matchesVerified;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#1A1A2E] flex items-center gap-2">
            <Users className="h-5 w-5 text-[#3E9BDB]" />
            Learner &amp; Staff Account Registry
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Govern role authorization (Admin, Instructor, Learner), organization verification, and access controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh users"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
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

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200/90 shadow-xs">
        <div className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search name, email, organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]"
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB] bg-white text-slate-700"
          >
            <option value="ALL">All Authorization Roles</option>
            <option value="LEARNER">Learner</option>
            <option value="INSTRUCTOR">Instructor</option>
            <option value="ADMIN">Administrator</option>
          </select>
        </div>

        <div>
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB] bg-white text-slate-700"
          >
            <option value="ALL">All Learner Groups</option>
            <option value="FPO">FPO Members</option>
            <option value="FPC">FPC Teams</option>
            <option value="STUDENT">Students</option>
            <option value="NAVAL_OFFICER">Naval Officers</option>
          </select>
        </div>

        <div>
          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB] bg-white text-slate-700"
          >
            <option value="ALL">All Clearance States</option>
            <option value="VERIFIED">Verified Clearance</option>
            <option value="UNVERIFIED">Unverified / Pending</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-700">
            Showing <span className="font-bold text-slate-900">{filteredUsers.length}</span> of{" "}
            {users.length} accounts
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Learner / Staff</th>
                <th className="px-5 py-3.5">Authorization Role</th>
                <th className="px-5 py-3.5">Learner Group</th>
                <th className="px-5 py-3.5">Affiliation &amp; Clearance</th>
                <th className="px-5 py-3.5 text-center">Enrollments</th>
                <th className="px-5 py-3.5 text-center">Account Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {u.name || "Unnamed"}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : u.role === "INSTRUCTOR"
                            ? "bg-teal-100 text-teal-800 border border-teal-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-slate-700">
                        {u.learnerGroup || "—"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-slate-800 flex items-center gap-1.5">
                          <Building className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{u.organization?.name || "Independent"}</span>
                        </div>
                        {u.isOrgVerified ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="h-3 w-3" />
                            Verified Institutional
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                            Unverified
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center font-bold text-xs text-slate-800">
                      {u._count?.enrollments ?? 0}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-slate-200 text-slate-600"
                        }`}
                        title="Click to toggle active state"
                      >
                        {u.isActive ? "ACTIVE" : "SUSPENDED"}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => openEditModal(u)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-500">
                    No users match the active filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {isModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A2E]">Manage Account Privileges</h3>
                <p className="text-xs text-slate-500">{editingUser.email}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  System Authorization Role
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="LEARNER">LEARNER (Standard access to courses & quizzes)</option>
                  <option value="INSTRUCTOR">
                    INSTRUCTOR (Course creation, assessments, student progress)
                  </option>
                  <option value="ADMIN">
                    ADMIN (Full institutional platform & user governance)
                  </option>
                </select>
                {editingUser.role === "ADMIN" && formRole !== "ADMIN" && (
                  <p className="text-[11px] text-amber-700 mt-1 font-semibold flex items-center gap-1">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Caution: Demoting this administrator will revoke their management access.
                  </p>
                )}
              </div>

              {/* Organization Verification Toggle */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[#1F9E94]" />
                    <span className="text-xs font-bold text-slate-800">
                      Institutional Clearance
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formVerified}
                    onChange={(e) => setFormVerified(e.target.checked)}
                    className="h-4 w-4 text-[#1F9E94] rounded border-slate-300 focus:ring-[#1F9E94]"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Grants clearance for restricted military and naval course curriculums.
                </p>
              </div>

              {/* Account Active State */}
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-xs font-bold text-slate-700">Account Active</span>
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="h-4 w-4 text-[#3E9BDB] rounded border-slate-300 focus:ring-[#3E9BDB]"
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
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#3E9BDB] hover:bg-[#3286bf] text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>Update Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
