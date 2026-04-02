import { Container } from "@/components/layout/container";
import { SectionLabel } from "@/components/ui/typography";

const BRANDS = [
  "AGV",
  "Shoei",
  "Arai",
  "Dainese",
  "Alpinestars",
  "Rev'It",
  "Sena",
  "HJC",
  "LS2",
  "Held",
  "Forma",
  "TCX",
  "Scorpion",
  "Shark",
  "Nolan",
];

const BrandLogo = ({ name }: { name: string }) => (
  <div className="flex h-12 w-28 shrink-0 items-center justify-center rounded border border-border-default bg-bg-surface px-4 text-sm font-semibold text-text-muted transition-colors duration-300 hover:border-brand-teal/30 hover:text-text-primary">
    {name}
  </div>
);

export const BrandsStrip = () => (
  <section className="py-16 md:py-20">
    <Container>
      <SectionLabel className="mb-8 text-center">
        Brands που εμπιστευόμαστε
      </SectionLabel>
    </Container>

    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-bg-deep to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-bg-deep to-transparent" />

      <div
        className="flex gap-4 hover:[animation-play-state:paused]"
        style={{
          animation: "scrollInfinite 30s linear infinite",
          width: "max-content",
        }}
      >
        {[...BRANDS, ...BRANDS].map((brand, i) => (
          <BrandLogo key={`${brand}-${i}`} name={brand} />
        ))}
      </div>
    </div>
  </section>
);
