import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { viewport } from "@/app/_viewport";
import { LocaleProvider } from "./locale-provider";

export { viewport };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr",
    ),
    title: { default: t("title"), template: "%s | MotoMarket" },
    description: t("description"),
    keywords: [
      "μοτοσυκλέτα",
      "εξοπλισμός μοτοσυκλέτας",
      "κράνη",
      "ενδυμασία μοτοσυκλέτας",
      "motomarket",
    ],
    authors: [{ name: "MotoMarket" }],
    creator: "MotoMarket",
    openGraph: {
      type: "website",
      siteName: "MotoMarket",
      title: t("title"),
      description: t("description"),
    },
    twitter: {
      card: "summary_large_image",
      title: "MotoMarket",
      description: t("description"),
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    // Russo One / Chakra Petch are campaign-LP-only fonts — loaded by
    // lp/[slug]/page.tsx, NOT here: keeping them off <html> removes 5
    // preloaded font files from every storefront page's LCP critical path.
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
