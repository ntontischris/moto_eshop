import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { fontVars, viewport } from "@/app/_chrome";
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
    <html lang={locale} suppressHydrationWarning className={fontVars}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <LocaleProvider locale={locale}>{children}</LocaleProvider>
      </body>
    </html>
  );
}
