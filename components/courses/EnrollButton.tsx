"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlayCircle, ArrowRight, CheckCircle2 } from "lucide-react";

interface EnrollButtonProps {
  locale: string;
  courseId: string;
  courseSlug: string;
  firstLessonId: string;
  isEnrolled: boolean;
  isLoggedIn: boolean;
}

export function EnrollButton({
  locale,
  courseId,
  courseSlug,
  firstLessonId,
  isEnrolled,
  isLoggedIn,
}: EnrollButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isLoggedIn) {
    return (
      <Link
        href={`/${locale}/login?redirect=/${locale}/courses/${courseSlug}`}
        className="w-full flex items-center justify-center py-3.5 px-6 rounded-xl bg-[#3E9BDB] hover:bg-[#2884c0] text-white font-bold text-base shadow-md hover:shadow-lg transition-all text-center focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB] focus:ring-offset-2"
      >
        <span>Enrol in Course</span>
      </Link>
    );
  }

  if (isEnrolled) {
    return (
      <Link
        href={`/${locale}/learn/course/${courseId}/lesson/${firstLessonId}`}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base shadow-md hover:shadow-lg transition-all text-center focus:outline-hidden"
      >
        <PlayCircle className="w-5 h-5" />
        <span>Continue Learning</span>
      </Link>
    );
  }

  const handleEnroll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (res.ok) {
        router.push(`/${locale}/learn/course/${courseId}/lesson/${firstLessonId}`);
        router.refresh();
      }
    } catch (err) {
      console.error("Enrollment failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleEnroll}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl bg-[#3E9BDB] hover:bg-[#2884c0] text-white font-bold text-base shadow-md hover:shadow-lg transition-all text-center disabled:opacity-50 cursor-pointer"
    >
      <span>{loading ? "Enrolling..." : "Enrol in Course"}</span>
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}
