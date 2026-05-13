import Link from "next/link";
import Image from "next/image";

interface Brand {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export function BrandsStrip({ brands }: { brands: Brand[] }) {
  if (brands.length === 0) return null;
  // Duplicate the list so the marquee loops seamlessly
  const loop = [...brands, ...brands];

  return (
    <section className="border-y border-neutral-800 bg-[#0a0a0a] py-10">
      <div className="container mx-auto px-4">
        <p className="mb-6 text-center font-russo text-xs uppercase tracking-[0.3em] text-brand-red">
          Brands που εμπιστευόμαστε
        </p>
      </div>
      <div className="overflow-hidden">
        <div className="marquee-track flex w-max items-center gap-8 px-4">
          {loop.map((b, i) => (
            <Link
              key={`${b.id}-${i}`}
              href={`/?brand=${b.slug}`}
              className="group flex h-14 w-32 flex-shrink-0 items-center justify-center rounded-lg border border-neutral-800 bg-[#141414] px-4 transition hover:border-brand-red/40 hover:bg-neutral-900"
              title={b.name}
            >
              {b.logo_url ? (
                <Image
                  src={b.logo_url}
                  alt={b.name}
                  width={96}
                  height={32}
                  className="max-h-8 w-auto opacity-70 transition group-hover:opacity-100"
                />
              ) : (
                <span className="font-russo text-xs uppercase tracking-wider text-neutral-400 group-hover:text-white">
                  {b.name}
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
