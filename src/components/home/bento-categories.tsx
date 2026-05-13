import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface Category {
  id: string;
  slug: string;
  name: string;
  image_url: string | null;
  position?: number;
}

// Fixed bento layout: big tile + 2 medium + 2 small + 1 wide
// Falls back gracefully if fewer than 6 categories provided.
const TILE_CLASSES = [
  "md:col-span-2 md:row-span-2 aspect-square md:aspect-auto",
  "md:col-span-1 md:row-span-1 aspect-square",
  "md:col-span-1 md:row-span-1 aspect-square",
  "md:col-span-1 md:row-span-1 aspect-square",
  "md:col-span-1 md:row-span-1 aspect-square",
  "md:col-span-3 md:row-span-1 aspect-[3/1]",
];

const FALLBACK_GRADIENTS = [
  "from-red-600/30 to-neutral-900",
  "from-orange-500/20 to-neutral-900",
  "from-amber-400/15 to-neutral-900",
  "from-rose-500/20 to-neutral-900",
  "from-yellow-500/15 to-neutral-900",
  "from-red-700/25 to-neutral-900",
];

export function BentoCategories({ categories }: { categories: Category[] }) {
  const tiles = categories.slice(0, 6);
  if (tiles.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="font-russo text-xs uppercase tracking-[0.3em] text-brand-red">
            Κατηγορίες
          </p>
          <h2 className="mt-2 font-russo text-3xl uppercase text-white md:text-5xl">
            Βρες ό,τι χρειάζεσαι
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:grid-rows-3">
        {tiles.map((c, i) => (
          <Link
            key={c.id}
            href={`/${c.slug}`}
            className={`group relative overflow-hidden rounded-2xl border border-neutral-800 ${TILE_CLASSES[i]}`}
          >
            {c.image_url ? (
              <Image
                src={c.image_url}
                alt={c.name}
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div
                className={`absolute inset-0 bg-gradient-to-br ${FALLBACK_GRADIENTS[i % FALLBACK_GRADIENTS.length]}`}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-end p-5 md:p-7">
              <h3 className="font-russo text-2xl uppercase leading-tight text-white md:text-3xl">
                {c.name}
              </h3>
              <span className="mt-2 inline-flex items-center gap-2 text-sm text-brand-red opacity-0 transition group-hover:opacity-100">
                Δες όλα
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </div>
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-transparent transition group-hover:ring-brand-red/40" />
          </Link>
        ))}
      </div>
    </section>
  );
}
