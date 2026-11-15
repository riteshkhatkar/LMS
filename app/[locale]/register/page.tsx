import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Create an account | Learn LMS",
  description: "Register for Learn LMS to access courses, practice with quizzes, track progress, and earn verifiable certificates.",
  robots: {
    index: false,
    follow: false,
  },
};

interface Props {
  params: Promise<{
    locale: string;
  }>;
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="py-12 sm:py-16 bg-gray-50/50 min-h-[calc(100vh-160px)] flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-[520px]">
        <RegisterForm locale={locale} />
      </div>
    </div>
  );
}
