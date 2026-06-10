import { Suspense } from "react";
import { Sofia_Sans_Extra_Condensed, Commissioner } from "next/font/google";
import { setRequestLocale, getTranslations } from "next-intl/server";
import "./_styles/tokens.css";
import "./_styles/components.css";
import { V3Provider } from "./_components/shell/v3-provider";
import { CommandPaletteProvider } from "./_components/shell/command-palette-provider";
import { UtilityBar } from "./_components/shell/utility-bar";
import { Header } from "./_components/shell/header";
import { MegaMenu } from "./_components/shell/mega-menu";
import { MobileNav } from "./_components/shell/mobile-nav";
import { Footer } from "./_components/shell/footer";
import { ScrollProgress } from "./_components/fx/scroll-progress";
import { TrackRail } from "./_components/fx/track-rail";
import { MobileCtaBar } from "./_components/fx/mobile-cta-bar";
import { MotionProvider } from "./_components/fx/motion-provider";
import { HeroRippleProvider } from "./_components/fx/hero-ripple-provider";
import { ChatMount } from "./_components/chat/chat-mount";

// display: "optional" — the giant skewed headlines must NOT reflow when the
// webfont swaps in (that was the dominant CLS source). With "optional" the
// browser uses the metric-adjusted fallback if the font isn't ready in ~100ms,
// for the whole session → zero layout shift on the big type.
const display = Sofia_Sans_Extra_Condensed({
  subsets: ["greek", "latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-v3-display",
  display: "optional",
  preload: true,
});

const body = Commissioner({
  subsets: ["greek", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-v3-body",
  display: "optional",
  preload: true,
});

export default async function V3Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "shell" });
  return (
    <>
      <div className={`v3-root ${display.variable} ${body.variable}`} data-v3>
        <V3Provider>
          <CommandPaletteProvider>
            <ScrollProgress />
            <TrackRail gearLabel={t("hudGear")} />
            <MotionProvider />
            <HeroRippleProvider />
            <Suspense fallback={null}>
              <UtilityBar />
              <Header />
              <MegaMenu />
            </Suspense>
            <main>{children}</main>
            <Suspense fallback={null}>
              <Footer />
              <MobileCtaBar
                shopLabel={t("ctaBarShop")}
                bikeLabel={t("ctaBarBike")}
              />
              <MobileNav />
            </Suspense>
          </CommandPaletteProvider>
        </V3Provider>
      </div>
      <Suspense fallback={null}>
        <ChatMount />
      </Suspense>
    </>
  );
}
