"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Lock,
  Globe,
  Loader2,
  RefreshCw,
  X,
} from "lucide-react";
import { formatDuration, formatDate } from "@/lib/utils";

interface CourseCategory {
  id: string;
  name: string;
  slug: string;
}

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  subtitle?: string | null;
  description: string;
  category: string;
  categoryId?: string | null;
  courseCategory?: CourseCategory | null;
  durationMinutes: number;
  level: string;
  targetAudience: string;
  publishStatus: "draft" | "published" | "archived";
  isRestricted: boolean;
  createdAt: string;
  updatedAt: string;
  instructor?: { id: string; name: string | null; email: string } | null;
  _count?: {
    sections: number;
    enrollments: number;
    quizzes: number;
  };
}

interface Props {
  initialCourses?: CourseItem[];
  locale: string;
}

export function AdminCourseManager({ initialCourses = [], locale }: Props) {
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [audienceFilter, setAudienceFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    subtitle: "",
    description: "",
    category: "Operational Maritime Studies",
    categoryId: "",
    durationMinutes: 120,
    level: "Intermediate",
    targetAudience: "ALL",
    publishStatus: "draft" as "draft" | "published" | "archived",
    isRestricted: false,
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch {
      setMessage({ type: "error", text: "Failed to reload courses." });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch {
      // Ignore category load error on initial mount
    }
  };

  useEffect(() => {
    fetchCategories();
    if (initialCourses.length === 0) {
      fetchCourses();
    }
  }, []);

  const openCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      title: "",
      slug: "",
      subtitle: "",
      description: "",
      category: categories[0]?.name || "Operational Maritime Studies",
      categoryId: categories[0]?.id || "",
      durationMinutes: 120,
      level: "Intermediate",
      targetAudience: "ALL",
      publishStatus: "draft",
      isRestricted: false,
    });
    setIsModalOpen(true);
    setMessage(null);
  };

  const openEditModal = (course: CourseItem) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      slug: course.slug,
      subtitle: course.subtitle || "",
      description: course.description,
      category: course.category,
      categoryId: course.categoryId || "",
      durationMinutes: course.durationMinutes,
      level: course.level,
      targetAudience: course.targetAudience,
      publishStatus: course.publishStatus,
      isRestricted: course.isRestricted,
    });
    setIsModalOpen(true);
    setMessage(null);
  };

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        durationMinutes: Number(formData.durationMinutes),
      };

      let res: Response;
      if (editingCourse) {
        res = await fetch(`/api/admin/courses/${editingCourse.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/courses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save course");
      }

      setMessage({
        type: "success",
        text: editingCourse ? "Course updated successfully." : "Course created successfully.",
      });
      setIsModalOpen(false);
      await fetchCourses();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An unexpected error occurred" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async (courseId: string, currentStatus: string) => {
    const newStatus = currentStatus === "archived" ? "draft" : "archived";
    const confirmPrompt =
      newStatus === "archived"
        ? "Archive this course? It will be hidden from new discovery and enrollments."
        : "Unarchive this course back to draft status?";

    if (!confirm(confirmPrompt)) return;

    try {
      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publishStatus: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update course status");
      }

      setMessage({ type: "success", text: `Course status changed to ${newStatus}.` });
      await fetchCourses();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    }
  };

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.slug.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      categoryFilter === "ALL" || c.category === categoryFilter || c.categoryId === categoryFilter;

    const matchesStatus = statusFilter === "ALL" || c.publishStatus === statusFilter;

    const matchesAudience =
      audienceFilter === "ALL" ||
      c.targetAudience === audienceFilter ||
      (audienceFilter === "RESTRICTED" && c.isRestricted);

    return matchesSearch && matchesCategory && matchesStatus && matchesAudience;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <h2 className="text-xl font-extrabold text-[#1A1A2E] flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#3E9BDB]" />
            Course Curriculum Catalog
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Author, configure, publish, and govern learning modules and restricted military/FPO courses.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCourses}
            disabled={loading}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            title="Refresh courses"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#3E9BDB] hover:bg-[#3286bf] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Course</span>
          </button>
        </div>
      </div>

      {/* Alert Message */}
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
            placeholder="Search by title or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB] bg-white text-slate-700"
          >
            <option value="ALL">All Publication States</option>
            <option value="published">Published</option>
            <option value="draft">Draft (In Review)</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div>
          <select
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB] bg-white text-slate-700"
          >
            <option value="ALL">All Learner Groups</option>
            <option value="FPO">FPO Members</option>
            <option value="FPC">FPC Teams</option>
            <option value="STUDENT">Students</option>
            <option value="NAVAL_OFFICER">Naval Officers</option>
            <option value="RESTRICTED">Restricted Only</option>
          </select>
        </div>

        <div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB] bg-white text-slate-700"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Courses Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-700">
            Showing <span className="font-bold text-slate-900">{filteredCourses.length}</span> of{" "}
            {courses.length} courses
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Course Info</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Audience &amp; Security</th>
                <th className="px-5 py-3.5 text-center">Curriculum</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Learners</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{c.title}</div>
                      <div className="text-[11px] text-slate-400 font-mono">/{c.slug}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatDuration(c.durationMinutes)} · {c.level}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {c.courseCategory?.name || c.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-slate-800">
                          {c.targetAudience === "ALL" ? "Public / All Groups" : c.targetAudience}
                        </span>
                        {c.isRestricted ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 w-fit">
                            <Lock className="h-3 w-3" />
                            Restricted Naval
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
                            <Globe className="h-3 w-3" />
                            Standard Access
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="text-xs font-bold text-slate-800">
                        {c._count?.sections ?? 0} Sec
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {c._count?.quizzes ?? 0} Quizzes
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.publishStatus === "published"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : c.publishStatus === "draft"
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {c.publishStatus}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center font-bold text-xs text-slate-800">
                      {c._count?.enrollments ?? 0}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/${locale}/courses/${c.slug}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-[#3E9BDB] transition-colors"
                          title="Preview public course"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                          title="Edit course configuration"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleArchive(c.id, c.publishStatus)}
                          className="p-1.5 text-slate-500 hover:text-red-600 border border-slate-200 rounded-lg hover:bg-red-50 transition-colors"
                          title={c.publishStatus === "archived" ? "Restore" : "Archive"}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-xs text-slate-500">
                    No courses match the active search and filter conditions.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Course Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A2E]">
                  {editingCourse ? "Edit Course Parameters" : "Create New Course"}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure curriculum metadata, access policies, and publication status.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCourse} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Course Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        title: e.target.value,
                        slug: editingCourse
                          ? formData.slug
                          : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#3E9BDB]"
                    placeholder="e.g. Maritime Navigation Protocols"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#3E9BDB]"
                    placeholder="maritime-navigation-protocols"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#3E9BDB]"
                  placeholder="Short one-line summary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Course Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#3E9BDB]"
                  placeholder="Detailed course description and learning objectives..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Course Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => {
                      const selectedCat = categories.find((c) => c.id === e.target.value);
                      setFormData({
                        ...formData,
                        categoryId: e.target.value,
                        category: selectedCat ? selectedCat.name : formData.category,
                      });
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="">Select category...</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Level</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={15}
                    step={15}
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({ ...formData, durationMinutes: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="ALL">All Learner Groups (Open)</option>
                    <option value="FPO">FPO Members</option>
                    <option value="FPC">FPC Teams</option>
                    <option value="STUDENT">Students</option>
                    <option value="NAVAL_OFFICER">Naval Officers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Publish Status
                  </label>
                  <select
                    value={formData.publishStatus}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        publishStatus: e.target.value as "draft" | "published" | "archived",
                      })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="draft">Draft (In Review)</option>
                    <option value="published">Published (Live to learners)</option>
                    <option value="archived">Archived (Inactive)</option>
                  </select>
                </div>
              </div>

              {/* Security Policy Toggle */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-amber-700" />
                    <span className="text-xs font-bold text-amber-900">
                      Restricted Access Policy
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.isRestricted}
                    onChange={(e) => setFormData({ ...formData, isRestricted: e.target.checked })}
                    className="h-4 w-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                  />
                </div>
                <p className="text-[11px] text-amber-800">
                  When enabled, only learners with an administrative verified organization clearance
                  (Naval Command or verified collective) can access curriculum lessons and take
                  assessments.
                </p>
              </div>

              {/* Modal Actions */}
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
                  <span>{editingCourse ? "Save Changes" : "Create Course"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
