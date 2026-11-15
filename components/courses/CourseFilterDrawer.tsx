"use client";

import React, { useState, useEffect } from "react";
import { Filter, X, RotateCcw } from "lucide-react";
import type { CourseFilters as CourseFiltersType } from "@/lib/types";
import { CourseFilters, countActiveFilters } from "./CourseFilters";

export interface CourseFilterDrawerProps {
  currentFilters: CourseFiltersType;
  onChange?: (filters: CourseFiltersType) => void;
}

export function CourseFilterDrawer({
  currentFilters,
  onChange,
}: CourseFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const activeCount = countActiveFilters(currentFilters);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile Filter Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 shadow-2xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#3E9BDB]"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <Filter className="w-4 h-4 text-[#3E9BDB]" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-[#3E9BDB] text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Backdrop & Drawer Dialog */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Filter courses"
        >
          {/* Overlay backdrop */}
          <div
            className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-2xs"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Bottom Sheet Modal */}
          <div className="relative z-10 w-full max-h-[85vh] bg-white rounded-t-2xl shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-250 ease-out">
            {/* Sheet Handle & Header */}
            <div className="p-4 pb-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#3E9BDB]" />
                <h2 className="text-lg font-bold text-gray-900">Filter Courses</h2>
                {activeCount > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-[#3E9BDB] text-white">
                    {activeCount} active
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#3E9BDB]"
                aria-label="Close filter drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Filter Content */}
            <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
              <CourseFilters
                currentFilters={currentFilters}
                onChange={onChange}
                onApplyMobile={() => setIsOpen(false)}
                className="border-0 p-0 shadow-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/80 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 px-4 bg-[#3E9BDB] hover:bg-[#2884c0] text-white rounded-lg text-sm font-semibold shadow-xs transition-colors text-center"
              >
                Apply & View Courses
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="py-2.5 px-4 bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CourseFilterDrawer;
