import type { Metadata } from "next";
import MotoMarketLanding from "./_components/mm-landing";

export const metadata: Metadata = {
  title: "MM Landing · Dark",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MotoMarketLanding mode="dark" />;
}
