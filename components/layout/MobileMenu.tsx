"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { X, Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  pathname?: string;
  navLinks?: { label: string; href: string }[];
  languages?: { code: string; label: string; name?: string; beta?: boolean }[];
  currentLocale?: string;
  getLocaleHref?: (targetLocale: string) => string;
}

export function MobileMenu({
  isOpen,
  onClose,
  locale,
  pathname = `/${locale}`,
  navLinks: customNavLinks,
  getLocaleHref: customGetLocaleHref,
}: MobileMenuProps) {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape & trap focus
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus close button on open
    setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Compute locale switched href
  const defaultGetLocaleHref = (targetLocale: string) => {
    const parts = pathname.split("/");
    if (parts.length > 1 && ["en", "hi", "mr"].includes(parts[1])) {
      parts[1] = targetLocale;
      return parts.join("/") || `/${targetLocale}`;
    }
    return `/${targetLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  };

  const getLocaleHref = customGetLocaleHref || defaultGetLocaleHref;

  const defaultNavLinks = [
    { label: "Courses", href: `/${locale}/courses` },
    { label: "FPO/FPC Training", href: `/${locale}/training` },
    { label: "How It Works", href: `/${locale}/how-it-works` },
    { label: "Verify Certificate", href: `/${locale}/verify` },
    { label: "Help", href: `/${locale}/help` },
  ];

  const navLinks = customNavLinks || defaultNavLinks;

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Navigation menu"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 motion-reduce:transition-none"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 transition-transform duration-300 motion-reduce:transition-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3E9BDB] flex items-center justify-center text-white font-bold">
              L
            </div>
            <span className="font-bold text-lg text-[#1A1A2E]">
              Learn <span className="text-[#3E9BDB]">LMS</span>
            </span>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3E9BDB]"
            aria-label="Close navigation menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Navigation links */}
        <div className="p-5 flex-1 space-y-6">
          <nav aria-label="Mobile main navigation" className="space-y-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-[#EAF4FC] text-[#3E9BDB] font-semibold"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="h-4 w-4 opacity-40" />
                </Link>
              );
            })}
          </nav>

          {/* Language Switcher */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              <Globe className="h-4 w-4" />
              <span>Select Language</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { code: "en", label: "English", short: "EN", beta: false },
                { code: "hi", label: "हिन्दी", short: "HI", beta: true },
                { code: "mr", label: "मराठी", short: "MR", beta: true },
              ].map((lang) => {
                const isSelected = locale === lang.code;
                return (
                  <Link
                    key={lang.code}
                    href={getLocaleHref(lang.code)}
                    onClick={onClose}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-[#3E9BDB] text-white border-[#3E9BDB] shadow-xs"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                    title={lang.beta ? `${lang.label} (in progress)` : lang.label}
                  >
                    <span className="font-bold">{lang.short}</span>
                    <span className="text-[10px] opacity-80">{lang.label}</span>
                    {lang.beta && (
                      <span
                        className={`text-[9px] mt-0.5 px-1 rounded ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        Beta
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* CTA Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-2.5">
          <Button
            as="a"
            href={`/${locale}/login`}
            variant="ghost"
            className="w-full justify-center border border-slate-200 bg-white"
            onClick={onClose}
          >
            Log in
          </Button>
          <Button
            as="a"
            href={`/${locale}/register`}
            variant="primary"
            className="w-full justify-center"
            onClick={onClose}
          >
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
}
