import type { Metadata, Viewport } from "next";
import { Russo_One, Chakra_Petch } from "next/font/google";
import { Providers } from "./providers";
import "@/app/globals.css";

const russoOne = Russo_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-russo",
  display: "optional",
});

const chakraPetch = Chakra_Petch({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-chakra",
  display: "optional",
});

export const metadata: Metadata = {
  title: {
    default: "MotoMarket - Premium εξοπλισμός μοτοσυκλέτας",
    template: "%s | MotoMarket",
  },
  description:
    "Premium e-shop για εξοπλισμό αναβάτη και μοτοσυκλέτας: κράνη, μπουφάν, γάντια, μπότες, αξεσουάρ και ανταλλακτικά.",
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
    title: "MotoMarket - Premium εξοπλισμός μοτοσυκλέτας",
    description:
      "Luxury, performance-first e-shop για εξοπλισμό μοτοσυκλέτας στην Ελλάδα.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MotoMarket",
    description: "Premium εξοπλισμός μοτοσυκλέτας online",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#050608" },
    { media: "(prefers-color-scheme: dark)", color: "#050608" },
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
        {children}
        <Providers />
      </body>
    </html>
  );
}
