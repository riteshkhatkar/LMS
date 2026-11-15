import React from "react";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DemoBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  message: string;
  variant?: "demo" | "mock-ledger" | "warning";
}

export function DemoBanner({
  message,
  variant = "demo",
  className,
  ...props
}: DemoBannerProps) {
  const config = {
    demo: {
      wrapper: "bg-amber-50 border-amber-300 text-amber-900",
      icon: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" aria-hidden="true" />,
      badge: "Demo Mode",
    },
    "mock-ledger": {
      wrapper: "bg-[#EAF4FC] border-[#3E9BDB]/40 text-[#123E62]",
      icon: <Info className="h-5 w-5 text-[#3E9BDB] shrink-0" aria-hidden="true" />,
      badge: "Mock Ledger",
    },
    warning: {
      wrapper: "bg-orange-50 border-orange-300 text-orange-950",
      icon: <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" aria-hidden="true" />,
      badge: "Notice",
    },
  }[variant];

  return (
    <div
      role="region"
      aria-label={`${config.badge}: ${message}`}
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-xs",
        config.wrapper,
        className
      )}
      {...props}
    >
      {config.icon}
      <div className="flex-1 flex flex-wrap items-center gap-2">
        <span className="font-semibold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded-full bg-white/70 border border-current/20">
          {config.badge}
        </span>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
}
