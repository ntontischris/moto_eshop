"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import { HERO_C_RANGES, type HeroCBeat } from "../hero-c/beats";
import { HeroCPanels } from "../hero-c/panels";
import {
  useIsMobile,
  useReducedMotion,
  useScrollProgress,
} from "../hero-c/use-scroll-progress";

const HeroCBikeScene = dynamic(
  () => import("./scene-bike").then((m) => ({ default: m.HeroCBikeScene })),
  { ssr: false },
);

const SCROLL_VH = 900;

const BEATS: HeroCBeat[] = [
  {
    range: HERO_C_RANGES[0],
    position: "center",
    eyebrow: "Race-grade equipment",
    title: (
      <>
        Ride. <span className="text-brand-red">Protected.</span>
      </>
    ),
    body: "Επίσημοι αντιπρόσωποι κορυφαίων brands εξοπλισμού μοτοσικλέτας. Από κράνη και ενδοεπικοινωνίες μέχρι ολοκληρωμένες λύσεις touring, sport και adventure.",
    ctas: [
      {
        label: "Δες τον κατάλογο",
        href: "/eksoplismos-anabath",
        variant: "primary",
      },
      { label: "Προσφορές", href: "/prosfores", variant: "ghost" },
    ],
  },
  {
    range: HERO_C_RANGES[1],
    position: "right",
    eyebrow: "City lights",
    title: "Νύχτα. Φώτα. Δρόμος.",
    body: "Κράνη, ενδοεπικοινωνίες και φωτισμός για ασφάλεια όταν η πόλη ξυπνά. HJC, Shoei, Caberg, Airoh — εμπιστευμένα από αναβάτες σε όλη την Ελλάδα.",
    ctas: [
      {
        label: "Δες κράνη",
        href: "/eksoplismos-anabath/kranh-endoep-nies-kameres",
        variant: "primary",
      },
    ],
  },
  {
    range: HERO_C_RANGES[2],
    position: "left",
    eyebrow: "Race day",
    title: "Track-ready. Day one.",
    body: "Sport gear που δοκιμάζεται σε πραγματικές πίστες. Από κράνη Full-Face με πιστοποίηση ECE 22.06 μέχρι ελαστικά και αξεσουάρ απόδοσης.",
    ctas: [
      {
        label: "Race & Track",
        href: "/eksoplismos-motosikletas",
        variant: "primary",
      },
    ],
  },
  {
    range: HERO_C_RANGES[3],
    position: "right",
    eyebrow: "Open road",
    title: "Ride. Every road, every season.",
    body: "Από τη Μάνη μέχρι τα Μετέωρα — εξοπλισμός που σε ακολουθεί σε κάθε διαδρομή. Adventure, touring, αστικό. Με ασφάλεια και στυλ.",
    ctas: [
      {
        label: "Δες όλα τα ρούχα",
        href: "/eksoplismos-anabath/endysh",
        variant: "primary",
      },
    ],
  },
  {
    range: HERO_C_RANGES[4],
    position: "left",
    eyebrow: "Crafted with care",
    title: "Αυθεντικά. Με εγγύηση.",
    body: "Επίσημοι αντιπρόσωποι των κορυφαίων brands. Κάθε προϊόν που πουλάμε είναι πραγματικό, με εγγύηση κατασκευαστή και υπηρεσίες υποστήριξης από Σίνδο, Αθήνα και Beinoglou 3PL.",
    ctas: [
      {
        label: "Σχετικά με εμάς",
        href: "/eksoplismos-motosikletas",
        variant: "primary",
      },
    ],
  },
];

export function HeroCBikeClient() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const isMobile = useIsMobile();
  const progress = useScrollProgress(sectionRef, reducedMotion);

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-black text-white"
      style={{ height: `${SCROLL_VH}vh` }}
    >
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">
        <div className="absolute inset-0 z-0">
          <HeroCBikeScene
            progress={progress}
            reducedMotion={reducedMotion}
            isMobile={isMobile}
          />
        </div>
        <HeroCPanels
          beats={BEATS}
          progress={progress}
          reducedMotion={reducedMotion}
          isMobile={isMobile}
        />
        {/* Progress hairline */}
        <div className="pointer-events-none absolute right-4 top-1/2 z-30 hidden h-40 w-px -translate-y-1/2 bg-white/10 md:block">
          <div
            className="absolute left-0 top-0 w-full bg-brand-red"
            style={{
              height: `${Math.min(100, Math.max(0, progress * 100))}%`,
              transition: "height 80ms linear",
            }}
          />
        </div>
      </div>
    </section>
  );
}
