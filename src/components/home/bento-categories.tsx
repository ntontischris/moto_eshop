import Link from "next/link";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { Container } from "@/components/layout/container";
import { H2, SectionLabel } from "@/components/ui/typography";

const GRADIENTS = [
  "from-red-900/40 to-bg-deep/80",
  "from-slate-800/60 to-bg-deep/80",
  "from-amber-900/30 to-bg-deep/80",
  "from-blue-900/30 to-bg-deep/80",
  "from-emerald-900/30 to-bg-deep/80",
];

const AREAS = ["helmets", "apparel", "boots", "accessories", "parts"];

interface BentoCategoriesProps {
  categories: {
    id: string;
    slug: string;
    name: string;
    image_url: string | null;
    position: number;
  }[];
}

export const BentoCategories = ({ categories }: BentoCategoriesProps) => (
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
            "${AREAS[0] ?? ""} ${AREAS[0] ?? ""} ${AREAS[1] ?? ""}"
            "${AREAS[0] ?? ""} ${AREAS[0] ?? ""} ${AREAS[2] ?? ""}"
            "${AREAS[3] ?? ""} ${AREAS[4] ?? ""} ${AREAS[4] ?? ""}"
          `,
        }}
      >
        {categories.map((cat, i) => (
          <ScrollReveal key={cat.id} delay={i * 0.1}>
            <Link
              href={`/${cat.slug}`}
              className="group relative flex min-h-[160px] items-end overflow-hidden rounded-lg bg-bg-surface p-6 transition-all duration-300 hover:glow-teal md:min-h-[200px]"
              style={{ gridArea: AREAS[i] ?? undefined }}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${GRADIENTS[i % GRADIENTS.length]} transition-opacity duration-300 group-hover:opacity-80`}
              />
              <div className="relative z-10">
                <h3 className="font-display text-xl tracking-wider text-text-primary md:text-2xl">
                  {cat.name}
                </h3>
                <p className="mt-1 translate-y-2 text-sm text-brand-teal opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
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
