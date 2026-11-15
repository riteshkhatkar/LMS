"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  BookOpen,
  FolderTree,
  Send,
  Users,
  Building,
  BarChart3,
  Award,
  History,
  Settings,
  Menu,
  X,
  Shield,
  ChevronRight,
  LogOut,
  GraduationCap,
  Mail,
  Megaphone,
  MessageSquare,
  Compass,
} from "lucide-react";

export type AdminTab =
  | "overview"
  | "courses"
  | "training"
  | "categories"
  | "assignments"
  | "grading"
  | "users"
  | "organizations"
  | "analytics"
  | "certificates"
  | "newsletters"
  | "announcements"
  | "support"
  | "audit"
  | "settings";

interface AdminPortalLayoutProps {
  currentTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  userEmail: string;
  userName: string;
  locale: string;
  children: React.ReactNode;
}

export function AdminPortalLayout({
  currentTab,
  onTabChange,
  userEmail,
  userName,
  locale,
  children,
}: AdminPortalLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationSections = [
    {
      title: "Overview",
      items: [
        { id: "overview" as AdminTab, label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      title: "Learning Operations",
      items: [
        { id: "courses" as AdminTab, label: "Course Management", icon: BookOpen },
        { id: "training" as AdminTab, label: "Training Programmes", icon: Compass },
        { id: "categories" as AdminTab, label: "Course Categories", icon: FolderTree },
        { id: "assignments" as AdminTab, label: "Course Assignments", icon: Send },
        { id: "grading" as AdminTab, label: "Grading Rules", icon: GraduationCap },
      ],
    },
    {
      title: "People & Organizations",
      items: [
        { id: "users" as AdminTab, label: "Learners & Staff", icon: Users },
        { id: "organizations" as AdminTab, label: "Organizations & FPOs", icon: Building },
      ],
    },
    {
      title: "Outreach & Communication",
      items: [
        { id: "newsletters" as AdminTab, label: "Newsletters", icon: Mail },
        { id: "announcements" as AdminTab, label: "Announcements", icon: Megaphone },
        { id: "support" as AdminTab, label: "Support & Q&A", icon: MessageSquare },
      ],
    },
    {
      title: "Intelligence & Audit",
      items: [
        { id: "analytics" as AdminTab, label: "Learning Analytics", icon: BarChart3 },
        { id: "certificates" as AdminTab, label: "Certificates & QR", icon: Award },
        { id: "audit" as AdminTab, label: "Audit Logs", icon: History },
        { id: "settings" as AdminTab, label: "Platform Settings", icon: Settings },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Header Bar */}
      <div className="lg:hidden bg-[#1A1A2E] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#3E9BDB] flex items-center justify-center font-bold text-sm text-white">
            A
          </div>
          <div>
            <div className="font-bold text-sm">Learn LMS Admin</div>
            <div className="text-[10px] text-slate-400">Institutional Console</div>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar (Desktop persistent, Mobile drawer) */}
      <aside
        className={`${
          mobileMenuOpen ? "block" : "hidden"
        } lg:block w-full lg:w-64 bg-[#1A1A2E] text-slate-300 border-r border-slate-800 shrink-0 lg:min-h-screen flex flex-col justify-between`}
      >
        <div>
          {/* Desktop Brand Header */}
          <div className="p-5 border-b border-slate-800/80 hidden lg:flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#3E9BDB] to-[#50B2F2] flex items-center justify-center font-extrabold text-white text-base shadow-sm">
              L
            </div>
            <div>
              <div className="font-bold text-sm text-white tracking-tight">Learn LMS</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Shield className="h-3 w-3 text-amber-400" />
                <span>Admin Console</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-6">
            {navigationSections.map((section) => (
              <div key={section.title}>
                <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {section.title}
                </div>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onTabChange(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-[#3E9BDB] text-white shadow-sm font-semibold"
                            : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 text-xs">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-slate-700 text-white font-semibold flex items-center justify-center text-xs">
              {userName ? userName.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="overflow-hidden">
              <div className="font-medium text-slate-200 truncate">{userName || "Administrator"}</div>
              <div className="text-[10px] text-slate-400 truncate">{userEmail}</div>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <Link href={`/${locale}`} className="hover:text-slate-200">
              Public Portal
            </Link>
            <Link href={`/${locale}/instructor`} className="hover:text-[#3E9BDB]">
              Instructor View
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl">
        {/* Top Breadcrumb & Status Bar */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Admin</span>
            <span>/</span>
            <span className="font-semibold text-slate-900 capitalize">
              {currentTab.replace("-", " ")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Platform Operational
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
              PostgreSQL 18
            </span>
          </div>
        </div>

        {/* Tab Content */}
        {children}
      </main>
    </div>
  );
}
