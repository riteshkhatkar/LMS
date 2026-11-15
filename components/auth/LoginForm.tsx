"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { LogIn, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { GoogleSignInButton } from "./GoogleSignInButton";

interface LoginFormProps {
  locale: string;
}

export function LoginForm({ locale }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect") || `/${locale}/learn/my-learning`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const emailParam = searchParams.get("email");

    if (emailParam) {
      setEmail(emailParam);
    }

    if (errorParam === "account_exists_link_required") {
      setError(
        "An account with this email already exists. Please enter your password to sign in and securely link your Google account."
      );
    } else if (errorParam === "account_deactivated") {
      setError("This account has been deactivated. Please contact an administrator.");
    } else if (errorParam === "google_cancelled") {
      setError("Google sign-in was cancelled.");
    } else if (errorParam === "oauth_exchange_failed") {
      setError("Google authentication could not be completed. Please try again.");
    }
  }, [searchParams]);

  const fillTestAccount = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Route based on role if no explicit redirect
      if (data.user.role === "ADMIN" && !searchParams.get("redirect")) {
        router.push(`/${locale}/admin`);
      } else if (data.user.role === "INSTRUCTOR" && !searchParams.get("redirect")) {
        router.push(`/${locale}/instructor`);
      } else {
        router.push(redirectParam);
      }
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 sm:p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-12 h-12 rounded-xl bg-[#EAF4FC] flex items-center justify-center text-[#3E9BDB] mb-3">
            <LogIn className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A2E]">Welcome back</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to track your course progress and certificates
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="name@example.com"
                className="block w-full rounded-lg border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#3E9BDB] focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <Link
                href={`/${locale}/help`}
                className="text-xs text-[#3E9BDB] hover:text-[#3286bf]"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="block w-full rounded-lg border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#3E9BDB] focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]/20"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#3E9BDB] hover:bg-[#3286bf] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Log in"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 text-gray-500 font-medium">or continue with</span>
          </div>
        </div>

        <GoogleSignInButton mode="signin" label="Continue with Google" returnTo={redirectParam} />

        <div className="mt-6 pt-5 border-t border-gray-100 text-center">
          <p className="text-sm text-gray-600">
            New to Learn LMS?{" "}
            <Link
              href={`/${locale}/register`}
              className="font-semibold text-[#3E9BDB] hover:text-[#3286bf]"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Demo Quick-Fill Accounts */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#1F9E94]" />
          <span>Quick-Fill Seeded Demo Accounts:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fillTestAccount("learner@learnlms.local", "Learner@123")}
            className="p-2 bg-white rounded-lg border border-slate-200 hover:border-[#3E9BDB] text-left transition-colors cursor-pointer"
          >
            <div className="font-semibold text-slate-900">Naval Officer</div>
            <div className="text-slate-500">learner@learnlms.local</div>
          </button>

          <button
            type="button"
            onClick={() => fillTestAccount("instructor@learnlms.local", "Instructor@123")}
            className="p-2 bg-white rounded-lg border border-slate-200 hover:border-[#3E9BDB] text-left transition-colors cursor-pointer"
          >
            <div className="font-semibold text-slate-900">Instructor</div>
            <div className="text-slate-500">instructor@learnlms.local</div>
          </button>

          <button
            type="button"
            onClick={() => fillTestAccount("admin@learnlms.local", "Admin@123")}
            className="p-2 bg-white rounded-lg border border-slate-200 hover:border-[#3E9BDB] text-left transition-colors cursor-pointer"
          >
            <div className="font-semibold text-slate-900">Administrator</div>
            <div className="text-slate-500">admin@learnlms.local</div>
          </button>
        </div>
      </div>
    </div>
  );
}
