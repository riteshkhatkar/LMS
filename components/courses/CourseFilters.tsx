"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Filter, X, Check, RotateCcw } from "lucide-react";
import type { CourseFilters, LearnerGroup, CourseLevel } from "@/lib/types";
import { brand } from "@/lib/brand";

export interface CourseFiltersProps {
  currentFilters: CourseFilters;
  onChange?: (filters: CourseFilters) => void;
  className?: string;
  onApplyMobile?: () => void;
}

const AUDIENCE_OPTIONS: { id: LearnerGroup; label: string }[] = [
  { id: "FPO", label: brand.learnerGroups.FPO },
  { id: "FPC", label: brand.learnerGroups.FPC },
  { id: "STUDENT", label: brand.learnerGroups.STUDENT },
  { id: "NAVAL_OFFICER", label: brand.learnerGroups.NAVAL_OFFICER },
];

const LEVEL_OPTIONS: { id: "all" | CourseLevel; label: string }[] = [
  { id: "all", label: "All Levels" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export function countActiveFilters(filters: CourseFilters): number {
  let count = 0;
  if (filters.audience && filters.audience.length > 0) count += filters.audience.length;
  if (filters.category) count += 1;
  if (filters.level) count += 1;
  if (filters.certificateAvailable) count += 1;
  return count;
}

export function CourseFilters({
  currentFilters,
  onChange,
  className = "",
  onApplyMobile,
}: CourseFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCount = countActiveFilters(currentFilters);
  const hasActiveFilters = activeCount > 0 || Boolean(currentFilters.search);

  const applyFilters = (newFilters: CourseFilters) => {
    const params = new URLSearchParams(searchParams.toString());

    // Audience
    if (newFilters.audience && newFilters.audience.length > 0) {
      params.set("audience", newFilters.audience.join(","));
    } else {
      params.delete("audience");
    }

    // Category
    if (newFilters.category) {
      params.set("category", newFilters.category);
    } else {
      params.delete("category");
    }

    // Level
    if (newFilters.level) {
      params.set("level", newFilters.level);
    } else {
      params.delete("level");
    }

    // Certificate
    if (newFilters.certificateAvailable) {
      params.set("cert", "true");
    } else {
      params.delete("cert");
    }

    // Search is preserved if present
    if (newFilters.search) {
      params.set("search", newFilters.search);
    } else if (newFilters.search === "") {
      params.delete("search");
    }

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    router.replace(nextUrl, { scroll: false });
    onChange?.(newFilters);
  };

  const handleAudienceToggle = (id: LearnerGroup) => {
    const currentList = currentFilters.audience || [];
    const exists = currentList.includes(id);
    const updated = exists ? currentList.filter((item) => item !== id) : [...currentList, id];
    applyFilters({
      ...currentFilters,
      audience: updated.length > 0 ? updated : undefined,
    });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const updated = currentFilters.category === categoryId ? undefined : categoryId;
    applyFilters({
      ...currentFilters,
      category: updated,
    });
  };

  const handleLevelChange = (levelId: "all" | CourseLevel) => {
    applyFilters({
      ...currentFilters,
      level: levelId === "all" ? undefined : levelId,
    });
  };

  const handleCertToggle = (checked: boolean) => {
    applyFilters({
      ...currentFilters,
      certificateAvailable: checked ? true : undefined,
    });
  };

  const handleClearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("audience");
    params.delete("category");
    params.delete("level");
    params.delete("cert");

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;
    router.replace(nextUrl, { scroll: false });

    onChange?.({
      search: currentFilters.search,
    });
  };

  return (
    <aside
      className={`bg-white rounded-xl border border-gray-200 p-5 shadow-xs ${className}`}
      aria-label="Course catalog filters"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#3E9BDB]" />
          <h2 className="text-base font-bold text-gray-900">Filters</h2>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-semibold rounded-full bg-[#3E9BDB] text-white">
              {activeCount}
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-red-600 transition-colors focus:outline-none focus:ring-1 focus:ring-red-500 rounded px-1.5 py-0.5"
            aria-label="Clear all active filters"
          >
            <RotateCcw className="w-3 h-3" />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6 pt-5">
        {/* 1. Audience Group */}
        <fieldset>
          <legend className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
            Target Audience
          </legend>
          <div className="space-y-2.5">
            {AUDIENCE_OPTIONS.map((opt) => {
              const checked = currentFilters.audience?.includes(opt.id) || false;
              return (
                <label
                  key={opt.id}
                  className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 hover:text-gray-900 select-none group"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      checked
                        ? "bg-[#3E9BDB] border-[#3E9BDB] text-white"
                        : "border-gray-300 bg-white group-hover:border-[#3E9BDB]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => handleAudienceToggle(opt.id)}
                    />
                    {checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-medium">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* 2. Category Group */}
        <fieldset className="pt-4 border-t border-gray-100">
          <legend className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
            Category
          </legend>
          <div className="space-y-2.5">
            {brand.categories.map((cat) => {
              const checked = currentFilters.category === cat.id;
              return (
                <label
                  key={cat.id}
                  className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 hover:text-gray-900 select-none group"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      checked
                        ? "bg-[#1F9E94] border-[#1F9E94] text-white"
                        : "border-gray-300 bg-white group-hover:border-[#1F9E94]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => handleCategoryToggle(cat.id)}
                    />
                    {checked && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-xs font-medium">{cat.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* 3. Level (Radio Group) */}
        <fieldset className="pt-4 border-t border-gray-100">
          <legend className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
            Difficulty Level
          </legend>
          <div className="space-y-2">
            {LEVEL_OPTIONS.map((lvl) => {
              const isSelected =
                (lvl.id === "all" && !currentFilters.level) ||
                currentFilters.level === lvl.id;
              return (
                <label
                  key={lvl.id}
                  className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 hover:text-gray-900 select-none group"
                >
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "border-[#3E9BDB]"
                        : "border-gray-300 bg-white group-hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="course-level"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => handleLevelChange(lvl.id)}
                    />
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-[#3E9BDB]" />
                    )}
                  </div>
                  <span className="text-xs font-medium">{lvl.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* 4. Certificate Available Toggle */}
        <div className="pt-4 border-t border-gray-100">
          <label className="flex items-center justify-between cursor-pointer select-none group">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Certificate Available
            </span>
            <div className="relative inline-flex items-center">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={Boolean(currentFilters.certificateAvailable)}
                onChange={(e) => handleCertToggle(e.target.checked)}
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#3E9BDB] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:width-4 after:w-4 after:transition-all peer-checked:bg-[#1F9E94]"></div>
            </div>
          </label>
          <p className="text-[11px] text-gray-500 mt-1">
            Show only courses offering a verifiable completion certificate.
          </p>
        </div>

        {/* Mobile apply button if in drawer context */}
        {onApplyMobile && (
          <div className="pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onApplyMobile}
              className="w-full py-2.5 px-4 bg-[#3E9BDB] hover:bg-[#2884c0] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors"
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default CourseFilters;
