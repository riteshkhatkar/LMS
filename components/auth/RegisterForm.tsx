"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  UserPlus,
  Lock,
  Mail,
  User,
  Building,
  GraduationCap,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import type { LearnerGroup } from "@/lib/types";
import { GoogleSignInButton } from "./GoogleSignInButton";

interface RegisterFormProps {
  locale: string;
}

export function RegisterForm({ locale }: RegisterFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [learnerGroup, setLearnerGroup] = useState<LearnerGroup>("NAVAL_OFFICER");
  const [organizationName, setOrganizationName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError("Please accept the Terms of Use and Privacy Policy to continue.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          learnerGroup,
          organizationName: organizationName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      router.push(`/${locale}/learn/my-learning`);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred during registration");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-sm p-6 sm:p-8">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-xl bg-[#EAF4FC] flex items-center justify-center text-[#3E9BDB] mb-3">
          <UserPlus className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold text-[#1A1A2E]">Create an account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Register to access courses, track learning progress, and earn verified credentials
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
        {/* Full Name */}
        <div>
          <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <User className="h-4 w-4" />
            </div>
            <input
              id="reg-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lt. Vikram Rathore"
              className="block w-full rounded-lg border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#3E9BDB] focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]/20"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="reg-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="block w-full rounded-lg border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#3E9BDB] focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]/20"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="reg-password" className="block text-sm font-medium text-gray-700 mb-1">
            Password <span className="text-gray-400 font-normal">(min. 8 characters)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="reg-password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="block w-full rounded-lg border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#3E9BDB] focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]/20"
            />
          </div>
        </div>

        {/* Learner Group */}
        <div>
          <label htmlFor="reg-group" className="block text-sm font-medium text-gray-700 mb-1">
            Who are you learning for?
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <GraduationCap className="h-4 w-4" />
            </div>
            <select
              id="reg-group"
              value={learnerGroup}
              onChange={(e) => setLearnerGroup(e.target.value as LearnerGroup)}
              className="block w-full rounded-lg border border-gray-300 pl-10 pr-8 py-2.5 text-sm text-gray-900 bg-white focus:border-[#3E9BDB] focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]/20"
            >
              <option value="NAVAL_OFFICER">Naval Officer</option>
              <option value="FPO">FPO Member</option>
              <option value="FPC">FPC Team Member</option>
              <option value="STUDENT">Student / General Learner</option>
            </select>
          </div>
        </div>

        {/* Organisation Name (optional) */}
        <div>
          <label htmlFor="reg-org" className="block text-sm font-medium text-gray-700 mb-1">
            Organisation name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Building className="h-4 w-4" />
            </div>
            <input
              id="reg-org"
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Western Naval Command or Sahyadri FPC"
              className="block w-full rounded-lg border border-gray-300 pl-10 pr-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#3E9BDB] focus:outline-hidden focus:ring-2 focus:ring-[#3E9BDB]/20"
            />
          </div>
        </div>

        {/* Terms Consent */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="reg-consent"
            type="checkbox"
            required
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 h-4 w-4 rounded-sm border-gray-300 text-[#3E9BDB] focus:ring-[#3E9BDB]"
          />
          <label htmlFor="reg-consent" className="text-xs text-gray-600 leading-relaxed">
            I agree to the{" "}
            <Link href={`/${locale}/terms`} className="text-[#3E9BDB] underline hover:text-[#3286bf]">
              Terms of Use
            </Link>{" "}
            and acknowledge the{" "}
            <Link href={`/${locale}/privacy`} className="text-[#3E9BDB] underline hover:text-[#3286bf]">
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#3E9BDB] hover:bg-[#3286bf] px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Creating account..." : "Complete Registration"}
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

      <GoogleSignInButton mode="signup" label="Sign up with Google" returnTo={`/${locale}/learn/my-learning`} />

      <div className="mt-6 pt-5 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-600">
          Already registered?{" "}
          <Link
            href={`/${locale}/login`}
            className="font-semibold text-[#3E9BDB] hover:text-[#3286bf]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
