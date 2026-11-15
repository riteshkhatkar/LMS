import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { LocaleIncompleteBanner } from "@/components/ui/LocaleIncompleteBanner";
import { brand } from "@/lib/brand";
import "@/app/globals.css";

type Props = { children: React.ReactNode; params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL(brand.domain),
    alternates: {
      canonical: "/",
      languages: { en: "/en", hi: "/hi", mr: "/mr" },
    },
    openGraph: {
      siteName: brand.name,
      locale,
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-white text-[#1A1A2E] antialiased" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <SiteHeader locale={locale} />
        <LocaleIncompleteBanner locale={locale} />
        <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-hidden">
          {children}
        </main>
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}
