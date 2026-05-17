import type { Metadata } from "next";
import MotoMarketLanding from "../landing-v2/_components/mm-landing";

export const metadata: Metadata = {
  title: "MM Landing · Light",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MotoMarketLanding mode="light" />;
}
