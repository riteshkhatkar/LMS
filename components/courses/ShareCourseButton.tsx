"use client";

import React, { useState } from "react";
import { Share2, Check } from "lucide-react";

export function ShareCourseButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.error("Failed to copy URL", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#3E9BDB]"
      aria-label="Copy course link to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-600" />
          <span className="text-emerald-700">Link copied to clipboard!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4 text-gray-500" />
          <span>Copy link to share</span>
        </>
      )}
    </button>
  );
}

export default ShareCourseButton;
