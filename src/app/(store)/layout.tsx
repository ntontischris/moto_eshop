import { Sofia_Sans_Extra_Condensed, Commissioner } from "next/font/google";
import "./_styles/tokens.css";
import { V3Provider } from "./_components/shell/v3-provider";
import { UtilityBar } from "./_components/shell/utility-bar";
import { Header } from "./_components/shell/header";
import { MegaMenu } from "./_components/shell/mega-menu";
import { MobileNav } from "./_components/shell/mobile-nav";
import { Footer } from "./_components/shell/footer";
import { ScrollProgress } from "./_components/fx/scroll-progress";

const display = Sofia_Sans_Extra_Condensed({
  subsets: ["greek", "latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-v3-display",
  display: "swap",
});

const body = Commissioner({
  subsets: ["greek", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-v3-body",
  display: "swap",
});

export default function V3Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`v3-root ${display.variable} ${body.variable}`} data-v3>
      <V3Provider>
        <ScrollProgress />
        <UtilityBar />
        <Header />
        <MegaMenu />
        <main>{children}</main>
        <Footer />
        <MobileNav />
      </V3Provider>
    </div>
  );
}
