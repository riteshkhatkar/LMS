"use client";

import { useState, useEffect } from "react";
import {
  Compass,
  Plus,
  Search,
  Download,
  CheckCircle2,
  Circle,
  Clock,
  Users,
  AlertTriangle,
  Lock,
  ChevronRight,
  Send,
  Eye,
  Trash2,
  RefreshCw,
  Building,
  GraduationCap,
  ShieldCheck,
  X,
} from "lucide-react";

interface CourseItem {
  id: string;
  title: string;
  slug: string;
}

interface TrainingProgramme {
  id: string;
  title: string;
  slug: string;
  description: string;
  targetGroup: string | null;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  estimatedDurationMinutes: number;
  isRequired: boolean;
  isRestricted: boolean;
  certificateEnabled: boolean;
  courses: Array<{
    courseId: string;
    isRequired: boolean;
    sortOrder: number;
    course: CourseItem;
  }>;
  organization?: { id: string; name: string; code: string } | null;
  _count: {
    assignments: number;
    certificates: number;
  };
}

interface Participant {
  id: string;
  name: string;
  email: string;
  learnerGroup: string | null;
  organization: string;
  overallProgressPct: number;
  isCompleted: boolean;
  certificateIssued: boolean;
}

export function AdminTrainingManager() {
  const [programmes, setProgrammes] = useState<TrainingProgramme[]>([]);
  const [allCourses, setAllCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [targetGroupFilter, setTargetGroupFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [selectedProgramme, setSelectedProgramme] = useState<TrainingProgramme | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  // Form states
  const [formTitle, setFormTitle] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTargetGroup, setFormTargetGroup] = useState<string>("FPO");
  const [formDuration, setFormDuration] = useState("120");
  const [formIsRestricted, setFormIsRestricted] = useState(false);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);

  // Assign form states
  const [assignTargetType, setAssignTargetType] = useState<"GROUP" | "ORG" | "USER">("GROUP");
  const [assignGroup, setAssignGroup] = useState("FPO");
  const [assignOrgId, setAssignOrgId] = useState("");
  const [assignUserId, setAssignUserId] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProgrammes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/training/programmes");
      const data = await res.json();
      if (data.programmes) {
        setProgrammes(data.programmes);
      }
    } catch (err) {
      console.error("Failed to fetch programmes:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/admin/courses");
      const data = await res.json();
      if (data.courses) {
        setAllCourses(
          data.courses.map((c: any) => ({
            id: c.id,
            title: c.title,
            slug: c.slug,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
    }
  };

  useEffect(() => {
    fetchProgrammes();
    fetchCourses();
  }, []);

  const handleTogglePublish = async (prog: TrainingProgramme) => {
    try {
      const res = await fetch(`/api/admin/training/programmes/${prog.id}/publish`, {
        method: "POST",
      });
      if (res.ok) {
        fetchProgrammes();
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  const handleOpenAssign = (prog: TrainingProgramme) => {
    setSelectedProgramme(prog);
    setAssignTargetType("GROUP");
    setAssignGroup(prog.targetGroup || "FPO");
    setAssignOrgId("");
    setAssignUserId("");
    setAssignDueDate("");
    setAssignModalOpen(true);
  };

  const handleExecuteAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProgramme || submitting) return;
    setSubmitting(true);

    try {
      const payload: any = {
        dueDate: assignDueDate || undefined,
      };

      if (assignTargetType === "GROUP") {
        payload.learnerGroup = assignGroup;
      } else if (assignTargetType === "ORG") {
        payload.organizationId = assignOrgId;
      } else {
        payload.userId = assignUserId;
      }

      const res = await fetch(`/api/admin/training/programmes/${selectedProgramme.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setAssignModalOpen(false);
        fetchProgrammes();
      } else {
        const data = await res.json();
        alert(data.error || "Assignment failed");
      }
    } catch (err) {
      console.error("Assign error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewParticipants = async (prog: TrainingProgramme) => {
    setSelectedProgramme(prog);
    setParticipantsModalOpen(true);
    setLoadingParticipants(true);
    try {
      const res = await fetch(`/api/admin/training/programmes/${prog.id}/participants`);
      const data = await res.json();
      if (data.participants) {
        setParticipants(data.participants);
      }
    } catch (err) {
      console.error("Failed to fetch participants:", err);
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleCreateProgramme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/training/programmes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle,
          slug: formSlug || undefined,
          description: formDesc,
          targetGroup: formTargetGroup || undefined,
          estimatedDurationMinutes: Number(formDuration) || 120,
          isRestricted: formIsRestricted,
          courseIds: selectedCourseIds,
        }),
      });

      if (res.ok) {
        setCreateModalOpen(false);
        setFormTitle("");
        setFormSlug("");
        setFormDesc("");
        setSelectedCourseIds([]);
        fetchProgrammes();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create programme");
      }
    } catch (err) {
      console.error("Create error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProgrammes = programmes.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesGroup =
      targetGroupFilter === "ALL" || p.targetGroup === targetGroupFilter;
    const matchesStatus =
      statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesGroup && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header & Metric Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Training Programmes &amp; Onboarding
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF4FC] text-[#3E9BDB] border border-[#3E9BDB]/20">
              Phase 7
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Orchestrate multi-course application curricula, assign cohorts, and monitor progress.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/api/admin/training/export"
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            <span>Export Progress CSV</span>
          </a>

          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#3E9BDB] hover:bg-[#3286bf] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>New Training Programme</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programmes by title or slug..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]/20 focus:border-[#3E9BDB]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold">Target:</span>
            <select
              value={targetGroupFilter}
              onChange={(e) => setTargetGroupFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-2.5 py-1 bg-white focus:outline-hidden"
            >
              <option value="ALL">All Groups</option>
              <option value="FPO">FPO Members</option>
              <option value="FPC">FPC Teams</option>
              <option value="NAVAL_OFFICER">Naval Officers</option>
              <option value="STUDENT">Students</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs rounded-lg border border-slate-200 px-2.5 py-1 bg-white focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <button
            type="button"
            onClick={fetchProgrammes}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Programmes List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-sm">
            Loading training programmes...
          </div>
        ) : filteredProgrammes.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 space-y-2">
            <Compass className="h-8 w-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No training programmes found</div>
            <div className="text-xs text-slate-500">Create one or adjust your filters above.</div>
          </div>
        ) : (
          filteredProgrammes.map((prog) => (
            <div
              key={prog.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {prog.title}
                    </span>
                    {prog.targetGroup && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EAF4FC] text-[#3E9BDB] border border-[#3E9BDB]/20">
                        {prog.targetGroup}
                      </span>
                    )}
                    {prog.isRestricted && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        <span>Restricted Clearance</span>
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        prog.status === "PUBLISHED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : prog.status === "DRAFT"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}
                    >
                      {prog.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {prog.description}
                  </p>

                  <div className="text-[11px] text-slate-400 font-mono">
                    slug: {prog.slug} · duration: {prog.estimatedDurationMinutes} mins · {prog.courses.length} courses
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleViewParticipants(prog)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                  >
                    <Users className="h-3.5 w-3.5" />
                    <span>Participants ({prog._count.assignments})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenAssign(prog)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#3E9BDB] hover:bg-[#3286bf] text-white text-xs font-semibold"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Assign Cohort</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTogglePublish(prog)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600"
                  >
                    {prog.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </div>

              {/* Constituent Courses Strip */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Constituent Courses &amp; Modules
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {prog.courses.map((c, idx) => (
                    <div
                      key={c.courseId}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate font-medium text-slate-800">
                          {c.course.title}
                        </span>
                      </div>
                      {c.isRequired && (
                        <span className="text-[10px] font-semibold text-[#3E9BDB] shrink-0">
                          Required
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Assign Modal */}
      {assignModalOpen && selectedProgramme && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Assign Training Programme
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedProgramme.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssignModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteAssign} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Assignment Target Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAssignTargetType("GROUP")}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center ${
                      assignTargetType === "GROUP"
                        ? "bg-[#3E9BDB] text-white border-[#3E9BDB]"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Learner Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignTargetType("ORG")}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center ${
                      assignTargetType === "ORG"
                        ? "bg-[#3E9BDB] text-white border-[#3E9BDB]"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Organization
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignTargetType("USER")}
                    className={`py-2 text-xs font-semibold rounded-lg border text-center ${
                      assignTargetType === "USER"
                        ? "bg-[#3E9BDB] text-white border-[#3E9BDB]"
                        : "bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    Individual User
                  </button>
                </div>
              </div>

              {assignTargetType === "GROUP" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Select Target Learner Group
                  </label>
                  <select
                    value={assignGroup}
                    onChange={(e) => setAssignGroup(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:outline-hidden"
                  >
                    <option value="FPO">FPO Members</option>
                    <option value="FPC">FPC Teams</option>
                    <option value="NAVAL_OFFICER">Naval Officers</option>
                    <option value="STUDENT">Students</option>
                  </select>
                </div>
              )}

              {assignTargetType === "ORG" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Organization Code / ID
                  </label>
                  <input
                    type="text"
                    value={assignOrgId}
                    onChange={(e) => setAssignOrgId(e.target.value)}
                    placeholder="e.g. MAHA-FPO or WNC-TRG"
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:outline-hidden"
                    required
                  />
                </div>
              )}

              {assignTargetType === "USER" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    User Email or User ID
                  </label>
                  <input
                    type="text"
                    value={assignUserId}
                    onChange={(e) => setAssignUserId(e.target.value)}
                    placeholder="learner@learnlms.local"
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:outline-hidden"
                    required
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#3E9BDB] hover:bg-[#3286bf] text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Assigning..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Participants Roster Modal */}
      {participantsModalOpen && selectedProgramme && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 border border-slate-200 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Programme Participants Roster
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedProgramme.title} · {participants.length} Assigned Participants
                </p>
              </div>
              <button
                type="button"
                onClick={() => setParticipantsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              {loadingParticipants ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  Loading participant progress...
                </div>
              ) : participants.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No participants assigned yet.
                </div>
              ) : (
                participants.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-bold text-slate-900 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">{p.email}</div>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">
                          {p.learnerGroup || "GENERAL"}
                        </span>
                        <span className="text-[10px] text-slate-400">· {p.organization}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      <div className="font-bold text-slate-900">{p.overallProgressPct}%</div>
                      {p.isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setParticipantsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 border border-slate-200 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  New Training Programme
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Combine constituent courses into an institutional curriculum track
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProgramme} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Programme Title</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Using the Main Application — FPO Member Training"
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:outline-hidden"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Slug (Optional)</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="auto-generated-if-blank"
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Description</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Comprehensive training for operating core application modules..."
                  className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:outline-hidden h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Target Group</label>
                  <select
                    value={formTargetGroup}
                    onChange={(e) => setFormTargetGroup(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:outline-hidden"
                  >
                    <option value="FPO">FPO Members</option>
                    <option value="FPC">FPC Teams</option>
                    <option value="NAVAL_OFFICER">Naval Officers</option>
                    <option value="STUDENT">Students</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Duration (mins)</label>
                  <input
                    type="number"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 bg-slate-50">
                <input
                  type="checkbox"
                  id="restrictedCheck"
                  checked={formIsRestricted}
                  onChange={(e) => setFormIsRestricted(e.target.checked)}
                  className="rounded text-[#3E9BDB]"
                />
                <label htmlFor="restrictedCheck" className="text-xs font-semibold text-slate-800">
                  Restricted Clearance (Naval Officers only)
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">
                  Select Constituent Courses ({selectedCourseIds.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto space-y-1.5 border border-slate-200 rounded-lg p-2">
                  {allCourses.map((c) => {
                    const isSelected = selectedCourseIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setSelectedCourseIds((prev) =>
                            isSelected ? prev.filter((id) => id !== c.id) : [...prev, c.id]
                          );
                        }}
                        className={`p-2 rounded-lg cursor-pointer text-xs flex items-center justify-between border ${
                          isSelected
                            ? "bg-[#3E9BDB]/10 border-[#3E9BDB]/40 text-[#123E62] font-semibold"
                            : "hover:bg-slate-50 border-transparent text-slate-700"
                        }`}
                      >
                        <span className="truncate">{c.title}</span>
                        {isSelected && <CheckCircle2 className="h-4 w-4 text-[#3E9BDB] shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[#3E9BDB] hover:bg-[#3286bf] text-white text-xs font-bold shadow-xs disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Programme"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
