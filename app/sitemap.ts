import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
import { mockDataProvider } from "@/lib/data/mock-provider";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const courses = await mockDataProvider.getCourses();
  const baseUrl = brand.domain;
  
  const staticRoutes = [
    { url: baseUrl, lastModified: new Date(), priority: 1.0 },
    { url: `${baseUrl}/courses`, lastModified: new Date(), priority: 0.9 },
    { url: `${baseUrl}/training`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), priority: 0.7 },
    { url: `${baseUrl}/verify`, lastModified: new Date(), priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), priority: 0.5 },
    { url: `${baseUrl}/help`, lastModified: new Date(), priority: 0.6 },
  ];
  
  const courseRoutes = courses.map((course) => ({
    url: `${baseUrl}/courses/${course.slug}`,
    lastModified: new Date(course.lastUpdated),
    priority: 0.8,
  }));
  
  return [...staticRoutes, ...courseRoutes];
}
