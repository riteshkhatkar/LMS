import type { DataProvider } from "./provider";
import type { Course, CourseFilters, Announcement, CertificateVerifyResult } from "@/lib/types";
import { demoCourses } from "./fixtures/courses";
import { demoAnnouncements } from "./fixtures/announcements";
import { getDemoCertificate } from "./fixtures/verify-demo";

export const mockDataProvider: DataProvider = {
  async getCourses(filters?: CourseFilters): Promise<Course[]> {
    let courses = demoCourses.filter((c) => c.publishStatus === "published");

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.subtitle.toLowerCase().includes(q) ||
          c.topicTags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filters?.audience?.length) {
      courses = courses.filter((c) =>
        c.audienceGroups.some((g) => filters.audience!.includes(g))
      );
    }
    if (filters?.category) {
      courses = courses.filter((c) => c.category === filters.category);
    }
    if (filters?.level) {
      courses = courses.filter((c) => c.level === filters.level);
    }
    if (filters?.language) {
      courses = courses.filter((c) => c.language === filters.language);
    }
    if (filters?.certificateAvailable !== undefined) {
      courses = courses.filter((c) => c.certificateAvailable === filters.certificateAvailable);
    }
    return courses;
  },

  async getCourseBySlug(slug: string): Promise<Course | null> {
    return demoCourses.find((c) => c.slug === slug) ?? null;
  },

  async getAnnouncements(): Promise<Announcement[]> {
    return demoAnnouncements;
  },

  async verifyCertificate(id: string): Promise<CertificateVerifyResult> {
    await new Promise((r) => setTimeout(r, 400));
    return getDemoCertificate(id);
  },
};
