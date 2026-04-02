"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { Container } from "@/components/layout/container";
import { H2, SectionLabel } from "@/components/ui/typography";

const CATEGORIES = [
  {
    name: "Κράνη",
    href: "/kranea",
    area: "helmets",
    gradient: "from-red-900/40 to-bg-deep/80",
  },
  {
    name: "Ενδυμασία",
    href: "/endymasia",
    area: "apparel",
    gradient: "from-slate-800/60 to-bg-deep/80",
  },
  {
    name: "Μπότες & Γάντια",
    href: "/mpotes-gantia",
    area: "boots",
    gradient: "from-amber-900/30 to-bg-deep/80",
  },
  {
    name: "Αξεσουάρ",
    href: "/axesouar",
    area: "accessories",
    gradient: "from-blue-900/30 to-bg-deep/80",
  },
  {
    name: "Ανταλλακτικά",
    href: "/antalaktika",
    area: "parts",
    gradient: "from-emerald-900/30 to-bg-deep/80",
  },
];

export const BentoCategories = () => (
  <section className="py-16 md:py-24">
    <Container>
      <ScrollReveal>
        <SectionLabel className="mb-3">Κατηγορίες</SectionLabel>
        <H2 className="mb-10 text-text-primary">ΕΞΟΠΛΙΣΕ ΤΗ ΜΗΧΑΝΗ ΣΟΥ</H2>
      </ScrollReveal>

      <div
        className="grid gap-3 md:grid-cols-3 md:grid-rows-2"
        style={{
          gridTemplateAreas: `
            "helmets helmets apparel"
            "helmets helmets boots"
            "accessories parts parts"
          `,
        }}
      >
        {CATEGORIES.map(({ name, href, area, gradient }, i) => (
          <ScrollReveal key={area} delay={i * 0.1}>
            <Link
              href={href}
              className="group relative flex min-h-[160px] items-end overflow-hidden rounded-lg bg-bg-surface p-6 transition-all duration-300 hover:glow-red md:min-h-[200px]"
              style={{ gridArea: area }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-300 group-hover:opacity-80`}
              />
              <div className="relative z-10">
                <h3 className="font-display text-xl tracking-wider text-text-primary md:text-2xl">
                  {name}
                </h3>
                <p className="mt-1 translate-y-2 text-sm text-text-chrome opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                  Δες τα προϊόντα &rarr;
                </p>
              </div>
            </Link>
          </ScrollReveal>
        ))}
      </div>
    </Container>
  </section>
);
