"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LogOut, BookOpen, Shield, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { NotificationBell } from "@/components/communication/NotificationBell";
import type { SessionUser } from "@/lib/auth/session";

export interface SiteHeaderProps {
  locale: string;
}

export function SiteHeader({ locale }: SiteHeaderProps) {
  const pathname = usePathname() || `/${locale}`;
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push(`/${locale}`);
      router.refresh();
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const navLinks = [
    { label: "Courses", href: `/${locale}/courses` },
    { label: "Naval & FPO Training", href: `/${locale}/training` },
    { label: "How It Works", href: `/${locale}/how-it-works` },
    { label: "Verify Certificate", href: `/${locale}/verify` },
    { label: "Help", href: `/${locale}/help` },
  ];

  if (user) {
    navLinks.unshift(
      { label: "My Learning", href: `/${locale}/learn/my-learning` },
      { label: "My Training", href: `/${locale}/learn/training` }
    );
  }

  const languages = [
    { code: "en", label: "EN", name: "English", beta: false },
    { code: "hi", label: "HI", name: "हिन्दी", beta: true },
    { code: "mr", label: "MR", name: "मराठी", beta: true },
  ];

  const getLocaleHref = (targetLocale: string) => {
    const parts = pathname.split("/");
    if (parts.length > 1 && ["en", "hi", "mr"].includes(parts[1])) {
      parts[1] = targetLocale;
      return parts.join("/") || `/${targetLocale}`;
    }
    return `/${targetLocale}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md transition-shadow duration-200 border-b border-slate-200/80 ${
          isScrolled ? "shadow-md" : "shadow-xs"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Brand */}
            <div className="flex items-center gap-8">
              <Link
                href={`/${locale}`}
                className="flex items-center gap-2.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#3E9BDB] rounded-lg p-1"
                aria-label="Learn LMS - Home"
              >
                <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src="/brand/logo.svg"
                    alt="Learn LMS Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg sm:text-xl leading-none text-[#1A1A2E] tracking-tight">
                    Learn<span className="text-[#3E9BDB]">LMS</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                    Knowledge &amp; Verification
                  </span>
                </div>
              </Link>

              {/* Desktop Nav Links */}
              <nav
                className="hidden md:flex items-center gap-1 sm:gap-2"
                aria-label="Main navigation"
              >
                {navLinks.map((link) => {
                  const isActive =
                    pathname === link.href ||
                    (link.href !== `/${locale}` && pathname.startsWith(link.href));

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                        isActive
                          ? "text-[#3E9BDB] bg-sky-50"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Right Side: Language & Auth Actions */}
            <div className="hidden lg:flex items-center gap-3">
              {/* Language Switcher */}
              <div
                className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200"
                role="group"
                aria-label="Language selection"
              >
                {languages.map((lang) => {
                  const isCurrent = locale === lang.code;
                  return (
                    <Link
                      key={lang.code}
                      href={getLocaleHref(lang.code)}
                      title={lang.beta ? `${lang.name} (in progress)` : lang.name}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                        isCurrent
                          ? "bg-white text-[#3E9BDB] shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                      aria-current={isCurrent ? "true" : undefined}
                    >
                      <span>{lang.label}</span>
                      {lang.beta && (
                        <span
                          className={`text-[9px] px-1 rounded font-normal ${
                            isCurrent
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          Beta
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="h-5 w-px bg-slate-200 mx-1" aria-hidden="true" />

              {/* Action Buttons / User Menu */}
              {user ? (
                <div className="flex items-center gap-2.5">
                  <NotificationBell locale={locale} />

                  {user.role === "ADMIN" && (
                    <Link
                      href={`/${locale}/admin`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-50 text-[#8E6BBF] border border-purple-200 hover:bg-purple-100"
                    >
                      <Shield className="h-3.5 w-3.5" />
                      <span>Admin Portal</span>
                    </Link>
                  )}

                  {user.role === "INSTRUCTOR" && (
                    <Link
                      href={`/${locale}/instructor`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-50 text-[#1F9E94] border border-teal-200 hover:bg-teal-100"
                    >
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span>Instructor</span>
                    </Link>
                  )}

                  <Link
                    href={`/${locale}/learn/my-learning`}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-slate-800 hover:text-[#3E9BDB]"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#3E9BDB]/10 text-[#3E9BDB] flex items-center justify-center font-bold text-xs">
                      {(user.name || user.fullName || "User").charAt(0).toUpperCase()}
                    </div>
                    <span className="truncate max-w-[120px]">{(user.name || user.fullName || "User").split(" ")[0]}</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Log out"
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Button
                    as="a"
                    href={`/${locale}/login`}
                    variant="ghost"
                    size="sm"
                    className="font-semibold text-slate-700 hover:text-slate-900"
                  >
                    Log in
                  </Button>
                  <Button
                    as="a"
                    href={`/${locale}/register`}
                    variant="primary"
                    size="sm"
                    className="font-semibold shadow-xs"
                  >
                    Get Started
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex items-center gap-2 lg:hidden">
              {user && <NotificationBell locale={locale} />}
              {user ? (
                <Link
                  href={`/${locale}/learn/my-learning`}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-[#3E9BDB] text-white"
                >
                  My Learning
                </Link>
              ) : (
                <Button
                  as="a"
                  href={`/${locale}/register`}
                  variant="primary"
                  size="sm"
                  className="font-semibold"
                >
                  Get Started
                </Button>
              )}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#3E9BDB]"
                aria-label="Open main menu"
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <MobileMenu
        locale={locale}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        navLinks={navLinks}
        languages={languages}
        currentLocale={locale}
        getLocaleHref={getLocaleHref}
      />
    </>
  );
}
