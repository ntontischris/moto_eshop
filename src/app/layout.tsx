import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { Russo_One, Chakra_Petch } from "next/font/google";
import { Providers } from "./providers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CartProviderServer } from "@/lib/cart/cart-provider-server";
import "@/app/globals.css";

const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-russo",
  display: "swap",
});

const chakraPetch = Chakra_Petch({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-chakra",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MotoMarket — Εξοπλισμός Μοτοσυκλέτας",
    template: "%s | MotoMarket",
  },
  description:
    "Το μεγαλύτερο ηλεκτρονικό κατάστημα εξοπλισμού μοτοσυκλέτας στην Ελλάδα. Κράνη, ενδυμασία, μπότες, γάντια και αξεσουάρ από τις κορυφαίες μάρκες.",
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
    locale: "el_GR",
    siteName: "MotoMarket",
    title: "MotoMarket — Εξοπλισμός Μοτοσυκλέτας",
    description:
      "Το μεγαλύτερο ηλεκτρονικό κατάστημα εξοπλισμού μοτοσυκλέτας στην Ελλάδα.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MotoMarket",
    description: "Εξοπλισμός μοτοσυκλέτας online",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0B0F14" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0F14" },
  ],
  width: "device-width",
  initialScale: 1,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="el"
      suppressHydrationWarning
      className={`${russoOne.variable} ${chakraPetch.variable}`}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          <Suspense>
            <CartProviderServer>
              <div className="flex min-h-screen flex-col">
                <Suspense>
                  <Header />
                </Suspense>
                <Suspense>
                  <main className="flex-1 pb-16 md:pb-0">{children}</main>
                </Suspense>
                <Footer />
              </div>
              <Suspense>
                <MobileNav />
              </Suspense>
            </CartProviderServer>
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}
