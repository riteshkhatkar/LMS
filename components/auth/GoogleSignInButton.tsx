"use client";

import React, { useState } from "react";

interface GoogleSignInButtonProps {
  mode?: "signin" | "signup";
  label?: string;
  className?: string;
  returnTo?: string;
}

export function GoogleSignInButton({
  mode = "signin",
  label,
  className = "",
  returnTo = "/en/learn/my-learning",
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false);

  const defaultText = mode === "signup" ? "Sign up with Google" : "Continue with Google";
  const buttonText = label || defaultText;

  const handleGoogleClick = () => {
    setLoading(true);
    const redirectUrl = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
    window.location.href = redirectUrl;
  };

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <svg
          className="animate-spin h-5 w-5 text-slate-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          ></path>
        </svg>
      ) : (
        /* Official Google 'G' Multicolor Logo */
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.93 6.72-4.93z"
          />
        </svg>
      )}
      <span>{buttonText}</span>
    </button>
  );
}
