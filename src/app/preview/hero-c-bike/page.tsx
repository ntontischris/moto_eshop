import type { Metadata } from "next";
import { HeroCBikeClient } from "@/components/preview/hero-c-bike/hero-c-bike-client";

export const metadata: Metadata = {
  title: "Hero Preview · Architecture C · Bike on track",
  robots: { index: false, follow: false },
};

export default function HeroCBikePreviewPage() {
  return (
    <main className="bg-black text-white">
      <HeroCBikeClient />
      <section className="bg-black px-6 py-24 text-center text-neutral-400">
        <p className="font-russo text-xs uppercase tracking-[0.3em] text-brand-red">
          Architecture C · Variant Bike
        </p>
        <h3 className="mt-4 font-russo text-2xl uppercase text-white">
          Sport bike on race track
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-sm">
          Stylized procedural motorcycle (wheels, frame, fairing, exhaust),
          scrolling asphalt with red/white curbs and lane dashes, MOTOMARKET
          wordmark floating above. Lean into corner during race-day beat.
        </p>
      </section>
    </main>
  );
}
