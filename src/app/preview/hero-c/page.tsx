import type { Metadata } from "next";
import { HeroCClient } from "@/components/preview/hero-c/hero-c-client";

export const metadata: Metadata = {
  title: "Hero Preview · Architecture C",
  robots: { index: false, follow: false },
};

export default function HeroCPreviewPage() {
  return (
    <main className="bg-black text-white">
      <HeroCClient />
      <section className="bg-black px-6 py-24 text-center text-neutral-400">
        <p className="font-russo text-xs uppercase tracking-[0.3em] text-brand-red">
          Architecture C
        </p>
        <h3 className="mt-4 font-russo text-2xl uppercase text-white">
          Three.js procedural scene
        </h3>
        <p className="mx-auto mt-4 max-w-xl text-sm">
          No video, no photographic assets. Real-time GPU rendering of fog, god
          rays, particle streaks, and abstract geometry driven by scroll
          progress. Lightest payload, biggest tradeoff: no real footage.
        </p>
      </section>
    </main>
  );
}
