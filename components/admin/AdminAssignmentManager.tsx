"use client";

import React, { useState, useEffect } from "react";
import {
  Send,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  User,
  Users,
  Calendar,
  Lock,
  Loader2,
  RefreshCw,
  X,
  Clock,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AssignmentItem {
  id: string;
  courseId: string;
  organizationId?: string | null;
  userId?: string | null;
  learnerGroup?: string | null;
  dueDate?: string | null;
  assignedBy?: string | null;
  status: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    slug: string;
    isRestricted: boolean;
  };
  organization?: {
    id: string;
    name: string;
    code: string;
    isVerified: boolean;
  } | null;
  user?: {
    id: string;
    name: string | null;
    email: string;
    isOrgVerified: boolean;
  } | null;
}

interface OptionCourse {
  id: string;
  title: string;
  isRestricted: boolean;
}

interface OptionOrg {
  id: string;
  name: string;
  code: string;
  isVerified: boolean;
}

interface OptionUser {
  id: string;
  name: string | null;
  email: string;
  learnerGroup: string | null;
  isOrgVerified: boolean;
}

export function AdminAssignmentManager() {
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [courses, setCourses] = useState<OptionCourse[]>([]);
  const [orgs, setOrgs] = useState<OptionOrg[]>([]);
  const [users, setUsers] = useState<OptionUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [targetType, setTargetType] = useState<"organization" | "group" | "user">("organization");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("FPO");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/assignments");
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to reload assignments." });
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [coursesRes, orgsRes, usersRes] = await Promise.all([
        fetch("/api/admin/courses"),
        fetch("/api/admin/organizations"),
        fetch("/api/admin/users"),
      ]);

      if (coursesRes.ok) {
        const cData = await coursesRes.json();
        setCourses(cData.map((c: any) => ({ id: c.id, title: c.title, isRestricted: c.isRestricted })));
      }
      if (orgsRes.ok) {
        const oData = await orgsRes.json();
        setOrgs(oData.map((o: any) => ({ id: o.id, name: o.name, code: o.code, isVerified: o.isVerified })));
      }
      if (usersRes.ok) {
        const uData = await usersRes.json();
        setUsers(
          uData.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            learnerGroup: u.learnerGroup,
            isOrgVerified: u.isOrgVerified,
          }))
        );
      }
    } catch {
      // Ignore initial load failure
    }
  };

  useEffect(() => {
    fetchAssignments();
    fetchDependencies();
  }, []);

  const openCreateModal = () => {
    setSelectedCourseId(courses[0]?.id || "");
    setSelectedOrgId(orgs[0]?.id || "");
    setSelectedGroup("FPO");
    setSelectedUserId(users[0]?.id || "");
    setDueDate("");
    setIsModalOpen(true);
    setMessage(null);
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    const payload: any = {
      courseId: selectedCourseId,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
    };

    if (targetType === "organization") {
      payload.organizationId = selectedOrgId;
    } else if (targetType === "group") {
      payload.learnerGroup = selectedGroup;
    } else if (targetType === "user") {
      payload.userId = selectedUserId;
    }

    try {
      const res = await fetch("/api/admin/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create assignment");
      }

      setMessage({
        type: "success",
        text: `Course assigned successfully. ${data.enrolledCount} learner(s) actively enrolled.`,
      });
      setIsModalOpen(false);
      await fetchAssignments();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to create assignment." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelAssignment = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this assignment?")) return;

    try {
      const res = await fetch(`/api/admin/assignments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to cancel assignment");
      }

      setMessage({ type: "success", text: "Assignment cancelled successfully." });
      await fetchAssignments();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const selectedCourseObj = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#1A1A2E] flex items-center gap-2">
            <Send className="h-5 w-5 text-[#3E9BDB]" />
            Course Assignment Console
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Assign mandatory or institutional training to entire organizations, learner classifications, or individual personnel.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAssignments}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh assignments"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3E9BDB] hover:bg-[#3286bf] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Assignment</span>
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

      {/* Assignments Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Course</th>
                <th className="px-5 py-3.5">Assigned Target</th>
                <th className="px-5 py-3.5">Target Type</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Assigned Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.length > 0 ? (
                assignments.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                        {item.course.title}
                        {item.course.isRestricted && (
                          <Lock className="h-3 w-3 text-amber-600 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">/{item.course.slug}</div>
                    </td>

                    <td className="px-5 py-4 font-semibold text-xs text-slate-800">
                      {item.organization ? (
                        <div className="flex items-center gap-1.5 text-slate-900">
                          <Building className="h-3.5 w-3.5 text-[#1F9E94]" />
                          <span>{item.organization.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({item.organization.code})
                          </span>
                        </div>
                      ) : item.user ? (
                        <div className="flex items-center gap-1.5 text-slate-900">
                          <User className="h-3.5 w-3.5 text-[#3E9BDB]" />
                          <span>{item.user.name || item.user.email}</span>
                        </div>
                      ) : item.learnerGroup ? (
                        <div className="flex items-center gap-1.5 text-[#8E6BBF]">
                          <Users className="h-3.5 w-3.5" />
                          <span>Group: {item.learnerGroup}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {item.organizationId
                          ? "ORGANIZATION"
                          : item.userId
                          ? "INDIVIDUAL"
                          : "LEARNER GROUP"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-slate-600">
                      {item.dueDate ? (
                        <div className="flex items-center gap-1 text-slate-700">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          <span>{formatDate(item.dueDate)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No deadline</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right text-xs text-slate-500">
                      {formatDate(item.createdAt)}
                    </td>

                    <td className="px-5 py-4 text-right">
                      {item.status === "ACTIVE" && (
                        <button
                          onClick={() => handleCancelAssignment(item.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg hover:bg-red-50 transition-colors"
                          title="Cancel Assignment"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-500">
                    No active course assignments recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A2E]">Assign Training Course</h3>
                <p className="text-xs text-slate-500">
                  Targeted deployment with automatic enrollment synchronization.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Course *
                </label>
                <select
                  required
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} {c.isRestricted ? "(RESTRICTED)" : ""}
                    </option>
                  ))}
                </select>
                {selectedCourseObj?.isRestricted && (
                  <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-semibold">
                    <Lock className="h-3 w-3" />
                    This course is restricted. Assigned members must have verified institutional status.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetType("organization")}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                      targetType === "organization"
                        ? "bg-[#1F9E94] text-white border-[#1F9E94]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Organization
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType("group")}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                      targetType === "group"
                        ? "bg-[#8E6BBF] text-white border-[#8E6BBF]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Learner Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType("user")}
                    className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                      targetType === "user"
                        ? "bg-[#3E9BDB] text-white border-[#3E9BDB]"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    Individual
                  </button>
                </div>
              </div>

              {targetType === "organization" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Organization
                  </label>
                  <select
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {orgs.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code}) {o.isVerified ? "✓ Verified" : "— Unverified"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {targetType === "group" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Learner Group
                  </label>
                  <select
                    value={selectedGroup}
                    onChange={(e) => setSelectedGroup(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="FPO">FPO Members</option>
                    <option value="FPC">FPC Teams</option>
                    <option value="STUDENT">Students</option>
                    <option value="NAVAL_OFFICER">Naval Officers</option>
                  </select>
                </div>
              )}

              {targetType === "user" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select User</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name || u.email} ({u.learnerGroup || "No Group"})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Completion Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
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
                  <span>Confirm Assignment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
