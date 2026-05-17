import type { Metadata } from "next";
import { HeroA } from "@/components/preview/hero-a/hero-a";
import { LenisProvider } from "@/components/preview/hero-a/lenis-provider";
import type { Beat } from "@/components/preview/hero-a/beats";

export const metadata: Metadata = {
  title: "Hero Preview · Architecture A",
  robots: { index: false, follow: false },
};

const beats: Beat[] = [
  {
    range: [0.0, 0.15],
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
    range: [0.2, 0.35],
    position: "right",
    eyebrow: "City lights",
    title: "Νύχτα. Φώτα. Δρόμος.",
    body: "Κράνη, ενδοεπικοινωνίες και φωτισμός για ασφάλεια όταν η πόλη ξυπνά. HJC, Shoei, Caberg, Airoh — εμπιστευμένα από αναβάτες σε όλη την Ελλάδα.",
    ctas: [
      {
        label: "Δες κράνη",
        href: "/eksoplismos-anabath/kranh-endoep-nies-kameres",
      },
    ],
  },
  {
    range: [0.4, 0.55],
    position: "left",
    eyebrow: "Race day",
    title: "Track-ready. Day one.",
    body: "Sport gear που δοκιμάζεται σε πραγματικές πίστες. Από κράνη Full-Face με πιστοποίηση ECE 22.06 μέχρι ελαστικά και αξεσουάρ απόδοσης.",
    ctas: [{ label: "Race & Track", href: "/eksoplismos-motosikletas" }],
  },
  {
    range: [0.6, 0.78],
    position: "right",
    eyebrow: "Open road",
    title: "Ride. Every road, every season.",
    body: "Από τη Μάνη μέχρι τα Μετέωρα — εξοπλισμός που σε ακολουθεί σε κάθε διαδρομή. Adventure, touring, αστικό. Με ασφάλεια και στυλ.",
    ctas: [
      {
        label: "Δες όλα τα ρούχα",
        href: "/eksoplismos-anabath/endysh",
      },
    ],
  },
  {
    range: [0.82, 0.97],
    position: "left",
    eyebrow: "Crafted with care",
    title: "Αυθεντικά. Με εγγύηση.",
    body: "Επίσημοι αντιπρόσωποι των κορυφαίων brands. Κάθε προϊόν που πουλάμε είναι πραγματικό, με εγγύηση κατασκευαστή και υπηρεσίες υποστήριξης από Σίνδο, Αθήνα και Beinoglou 3PL.",
    ctas: [{ label: "Σχετικά με εμάς", href: "/eksoplismos-motosikletas" }],
  },
];

export default function HeroAPreviewPage() {
  return (
    <LenisProvider>
      <main className="bg-black text-white">
        <HeroA beats={beats} scrollHeightVh={800} />
        <section className="bg-black px-6 py-24 text-center text-neutral-400">
          <p className="font-russo text-xs uppercase tracking-[0.3em] text-brand-red">
            Architecture A
          </p>
          <h3 className="mt-4 font-russo text-2xl uppercase text-white">
            HTML5 video + GSAP ScrollTrigger panels
          </h3>
          <p className="mx-auto mt-4 max-w-xl text-sm">
            Looping H.264 video as cinematic backdrop. DOM panels animate via
            transform + opacity on scroll. No frame extraction, no canvas, no
            per-scroll image swap.
          </p>
        </section>
      </main>
    </LenisProvider>
  );
}
