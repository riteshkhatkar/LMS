import type { Announcement } from "@/lib/types";

export const demoAnnouncements: Announcement[] = [
  {
    id: "ann-001",
    title: "New Course: FPC Operations & Compliance Basics now available",
    excerpt: "We have added a comprehensive new course for FPC teams covering daily operations, compliance records and reporting. Enrol now to track your progress and earn a certificate.",
    publishedAt: "2026-11-01",
    category: "course",
  },
  {
    id: "ann-002", 
    title: "Platform update: Hindi language interface now in preview",
    excerpt: "We are progressively rolling out Hindi translations for the Learn LMS interface. Some sections remain in English while translations are reviewed.",
    publishedAt: "2026-10-20",
    category: "feature",
  },
  {
    id: "ann-003",
    title: "FPO Governance training: batch assignments for Q4 2026",
    excerpt: "Organisation admins can now view Q4 course assignments in the Onboarding Tracker. Contact your Naval Training Officer if your group has not yet received an assignment.",
    publishedAt: "2026-10-05",
    category: "general",
  },
];
