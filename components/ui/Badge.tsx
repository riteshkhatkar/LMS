import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-semibold transition-colors leading-none",
  {
    variants: {
      variant: {
        audience:
          "bg-[#EAF4FC] text-[#1A6498] border border-[#BCE0FD]",
        category:
          "bg-[#E6F7F5] text-[#136862] border border-[#A2E3DC]",
        level:
          "bg-[#E8F5E9] text-[#2E7D32] border border-[#C8E6C9]",
        demo:
          "bg-[#FFF3CD] text-[#856404] border border-[#FFECB5]",
        default:
          "bg-slate-100 text-slate-800 border border-slate-200",
        outline:
          "border border-slate-300 text-slate-700 bg-transparent",
      },
      size: {
        sm: "px-2 py-0.5 text-[11px]",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {children}
    </span>
  );
}
