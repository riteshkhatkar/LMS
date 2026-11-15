import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in | Learn LMS",
  description: "Log in to your Learn LMS account to continue your learning journey.",
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

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;

  return (
    <div className="py-12 sm:py-16 bg-gray-50/50 min-h-[calc(100vh-160px)] flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-[480px]">
        <LoginForm locale={locale} />
      </div>
    </div>
  );
}
