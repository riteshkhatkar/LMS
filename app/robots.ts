import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/courses", "/training", "/how-it-works", "/verify", "/about", "/help"],
        disallow: ["/learn/", "/admin/", "/instructor/", "/verify/", "/login", "/register", "/api/"],
      },
    ],
    sitemap: `${brand.domain}/sitemap.xml`,
  };
}
