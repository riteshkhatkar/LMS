import React from "react";
import { Globe, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LocaleIncompleteBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  locale: string;
}

export function LocaleIncompleteBanner({
  locale,
  className,
  ...props
}: LocaleIncompleteBannerProps) {
  if (locale === "en") {
    return null;
  }

  const langNames: Record<string, string> = {
    hi: "हिन्दी (Hindi)",
    mr: "मराठी (Marathi)",
  };

  const currentLang = langNames[locale] || locale.toUpperCase();

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs sm:text-sm font-medium",
        className
      )}
      {...props}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-amber-700 shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">{currentLang}:</strong> Translation in progress — displaying English.
          </span>
        </div>
        <span className="hidden sm:inline-block bg-amber-200/70 text-amber-900 text-[11px] font-semibold px-2 py-0.5 rounded-full">
          Beta
        </span>
      </div>
    </div>
  );
}
