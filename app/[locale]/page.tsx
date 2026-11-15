import type { Metadata } from "next";
import { mockDataProvider } from "@/lib/data/mock-provider";
import { brand } from "@/lib/brand";
import { HeroSection } from "@/components/home/HeroSection";
import { CourseSearch } from "@/components/home/CourseSearch";
import { AudienceShortcuts } from "@/components/home/AudienceShortcuts";
import { FeaturedCourses } from "@/components/home/FeaturedCourses";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TrainingCallout } from "@/components/home/TrainingCallout";
import { CertTrustSection } from "@/components/home/CertTrustSection";
import { WhyLearnLMS } from "@/components/home/WhyLearnLMS";
import { AnnouncementsSection } from "@/components/home/AnnouncementsSection";
import { HomeFAQ } from "@/components/home/HomeFAQ";

export const metadata: Metadata = {
  title: "Learn LMS | Online Learning and Verified Certificates",
  description:
    "Explore practical online courses, track progress, take quizzes and earn verifiable certificates with Learn LMS.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "Learn LMS | Online Learning and Verified Certificates",
    description:
      "Explore practical online courses, track progress, take quizzes and earn verifiable certificates with Learn LMS.",
    type: "website",
  },
};

export default async function HomePage() {
  const [courses, announcements] = await Promise.all([
    mockDataProvider.getCourses(),
    mockDataProvider.getAnnouncements(),
  ]);

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    url: brand.domain,
    description: "Online learning and verified certification platform.",
  };

  return (
    <>
      {/* Schema.org Organization JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />

      {/* 1. HeroSection */}
      <HeroSection />

      {/* 2. CourseSearch */}
      <CourseSearch />

      {/* 3. AudienceShortcuts */}
      <AudienceShortcuts />

      {/* 4. FeaturedCourses */}
      <FeaturedCourses courses={courses} />

      {/* 5. HowItWorks */}
      <HowItWorks />

      {/* 6. TrainingCallout */}
      <TrainingCallout />

      {/* 7. CertTrustSection */}
      <CertTrustSection />

      {/* 8. WhyLearnLMS */}
      <WhyLearnLMS />

      {/* 9. AnnouncementsSection */}
      <AnnouncementsSection announcements={announcements} />

      {/* 10. HomeFAQ */}
      <HomeFAQ />
    </>
  );
}
