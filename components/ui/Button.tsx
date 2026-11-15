import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        primary:
          "bg-[#3E9BDB] hover:bg-[#2b88c7] text-white shadow-xs focus-visible:ring-[#3E9BDB] active:bg-[#2378b2]",
        secondary:
          "border border-[#3E9BDB] text-[#3E9BDB] bg-transparent hover:bg-[#EAF4FC] focus-visible:ring-[#3E9BDB] active:bg-[#d8eefc]",
        ghost:
          "text-[#1A1A2E] hover:bg-slate-100 hover:text-black focus-visible:ring-[#3E9BDB] active:bg-slate-200",
        danger:
          "bg-red-600 hover:bg-red-700 text-white focus-visible:ring-red-600 active:bg-red-800",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-md gap-1.5",
        md: "h-10 px-4 py-2 text-sm rounded-lg gap-2",
        lg: "h-12 px-6 text-base rounded-lg gap-2.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  as?: "button" | "a";
  href?: string;
  target?: string;
  rel?: string;
}

export const Button = React.forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonProps
>(({ className, variant, size, as = "button", href, children, ...props }, ref) => {
  const combinedClassName = cn(buttonVariants({ variant, size, className }));

  if (as === "a" || href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={combinedClassName}
        {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      type={props.type || "button"}
      className={combinedClassName}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";
