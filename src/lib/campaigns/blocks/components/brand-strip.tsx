import type { Block } from "../schema";

type BrandStrip = Extract<Block, { type: "brandStrip" }>;

export function BrandStripBlock({ block }: { block: BrandStrip }) {
  return (
    <section className="container mx-auto px-4 py-10">
      {block.title && (
        <h2 className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-neutral-400">
          {block.title}
        </h2>
      )}
      <div className="flex flex-wrap items-center justify-center gap-8">
        {block.logos.map((logo, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={logo.imageUrl}
            alt={logo.name}
            className="h-8 w-auto object-contain opacity-70 transition-opacity hover:opacity-100"
          />
        ))}
      </div>
    </section>
  );
}
