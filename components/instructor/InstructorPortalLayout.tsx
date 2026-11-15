"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Users,
  HelpCircle,
  Menu,
  X,
  ChevronRight,
  GraduationCap,
  Sparkles,
  Megaphone,
  MessageSquare,
  Compass,
} from "lucide-react";

export type InstructorTab =
  | "overview"
  | "wizard"
  | "courses"
  | "training"
  | "learners"
  | "quizzes"
  | "communication";

interface InstructorPortalLayoutProps {
  currentTab: InstructorTab;
  onTabChange: (tab: InstructorTab) => void;
  userEmail: string;
  userName: string;
  locale: string;
  children: React.ReactNode;
}

export function InstructorPortalLayout({
  currentTab,
  onTabChange,
  userEmail,
  userName,
  locale,
  children,
}: InstructorPortalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      id: "overview" as InstructorTab,
      label: "Instructor Overview",
      icon: LayoutDashboard,
      description: "Summary and performance metrics",
    },
    {
      id: "wizard" as InstructorTab,
      label: "5-Stage Course Builder",
      icon: PlusCircle,
      description: "Create or author course modules",
    },
    {
      id: "courses" as InstructorTab,
      label: "My Course Roster",
      icon: BookOpen,
      description: "Manage and publish curriculum",
    },
    {
      id: "training" as InstructorTab,
      label: "Assigned Training Tracks",
      icon: Compass,
      description: "Monitor application onboarding cohorts",
    },
    {
      id: "learners" as InstructorTab,
      label: "Learner Progress & Grades",
      icon: Users,
      description: "Track completion & assessment results",
    },
    {
      id: "quizzes" as InstructorTab,
      label: "Assessment Registry",
      icon: HelpCircle,
      description: "Quizzes and final exams",
    },
    {
      id: "communication" as InstructorTab,
      label: "Announcements & Q&A",
      icon: MessageSquare,
      description: "Course bulletins and learner inquiries",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-[#0D2538] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1F9E94] flex items-center justify-center font-bold text-sm text-white">
            I
          </div>
          <div>
            <div className="font-bold text-sm">Instructor Studio</div>
            <div className="text-[10px] text-teal-300">Learn LMS Platform</div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
          aria-label="Toggle navigation"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Instructor Sidebar */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } lg:block w-full lg:w-64 bg-[#0D2538] text-slate-300 border-r border-slate-800 shrink-0 lg:min-h-screen flex flex-col justify-between`}
      >
        <div>
          {/* Header */}
          <div className="p-5 border-b border-slate-800/80 hidden lg:flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#1F9E94] to-[#34d399] flex items-center justify-center font-extrabold text-white text-base shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-tight">Instructor Studio</div>
              <div className="text-[11px] text-teal-400 flex items-center gap-1 font-medium">
                <Sparkles className="h-3 w-3" />
                <span>Curriculum Author</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1.5 mt-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#1F9E94] text-white shadow-sm font-semibold"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <div className="text-left">
                      <div>{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{item.description}</div>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-teal-800 text-teal-200 font-bold flex items-center justify-center text-xs">
              {userName ? userName.charAt(0).toUpperCase() : "I"}
            </div>
            <div className="overflow-hidden">
              <div className="font-medium text-slate-200 truncate">{userName || "Instructor"}</div>
              <div className="text-[10px] text-slate-400 truncate">{userEmail}</div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <Link href={`/${locale}`} className="hover:text-slate-200">
              Public Portal
            </Link>
            <Link href={`/${locale}/learn/my-learning`} className="hover:text-[#1F9E94]">
              Learner View
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl">
        {/* Top Breadcrumb & Status */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Instructor Studio</span>
            <span>/</span>
            <span className="font-semibold text-slate-900 capitalize">
              {currentTab.replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mr-1.5 animate-pulse" />
              Instructor Workspace Active
            </span>
          </div>
        </div>

        {/* Tab Content */}
        {children}
      </main>
    </div>
  );
}
