"use client";

import { useState, useEffect } from "react";
import {
  Compass,
  CheckCircle2,
  Clock,
  Users,
  Award,
  Lock,
  RefreshCw,
  Search,
  BookOpen,
} from "lucide-react";

interface ProgrammeItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  targetGroup: string | null;
  status: string;
  estimatedDurationMinutes: number;
  isRestricted: boolean;
  organization: string | null;
  courses: Array<{
    id: string;
    title: string;
    slug: string;
    isMine: boolean;
    isRequired: boolean;
    sortOrder: number;
  }>;
  assignmentsCount: number;
  certificatesCount: number;
}

export function InstructorTrainingViewer() {
  const [programmes, setProgrammes] = useState<ProgrammeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchProgrammes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/instructor/training/programmes");
      const data = await res.json();
      if (data.programmes) {
        setProgrammes(data.programmes);
      }
    } catch (err) {
      console.error("Failed to fetch instructor programmes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgrammes();
  }, []);

  const filtered = programmes.filter(
    (p) =>
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Assigned Training Programmes
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF4FC] text-[#3E9BDB] border border-[#3E9BDB]/20">
              Phase 7
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Application curricula containing courses under your instruction or organization cohort.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchProgrammes}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter programmes by title..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-[#1F9E94]"
          />
        </div>
      </div>

      {/* Programme Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
            Loading assigned training tracks...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 space-y-2">
            <Compass className="h-8 w-8 text-slate-400 mx-auto" />
            <div className="text-sm font-bold text-slate-800">No training programmes found</div>
            <div className="text-xs text-slate-500">
              Training tracks will appear here once associated with your courses.
            </div>
          </div>
        ) : (
          filtered.map((prog) => (
            <div
              key={prog.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm">{prog.title}</span>
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
                  </div>
                  <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                    {prog.description}
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                  <div className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <span>{prog.assignmentsCount} Cohorts</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    <span>{prog.estimatedDurationMinutes}m</span>
                  </div>
                </div>
              </div>

              {/* Modules breakdown */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Curriculum Modules ({prog.courses.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {prog.courses.map((c, idx) => (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                        c.isMine
                          ? "bg-teal-50/70 border-teal-200 text-teal-900"
                          : "bg-slate-50 border-slate-100 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {idx + 1}
                        </span>
                        <span className="truncate font-medium">{c.title}</span>
                      </div>
                      {c.isMine && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-teal-600 text-white shrink-0">
                          Your Course
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
    </div>
  );
}
