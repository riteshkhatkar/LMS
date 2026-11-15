import type { Course, CourseFilters, Announcement, CertificateVerifyResult } from "@/lib/types";

export interface DataProvider {
  getCourses(filters?: CourseFilters): Promise<Course[]>;
  getCourseBySlug(slug: string): Promise<Course | null>;
  getAnnouncements(): Promise<Announcement[]>;
  verifyCertificate(id: string): Promise<CertificateVerifyResult>;
}
