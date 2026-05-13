"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";

interface ProductCard {
  id: string;
  slug: string;
  name: string;
  brand: string;
  brand_slug: string;
  category_slug: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  primary_image_url: string;
  primary_image_alt: string;
  average_rating: number | null;
  review_count: number;
}

export function FeaturedProducts({ products }: { products: ProductCard[] }) {
  if (products.length === 0) return null;

  return (
    <section className="bg-[#0a0a0a] py-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="font-russo text-xs uppercase tracking-[0.3em] text-brand-red">
              Featured
            </p>
            <h2 className="mt-2 font-russo text-3xl uppercase text-white md:text-5xl">
              Top προϊόντα
            </h2>
          </div>
          <Link
            href="/prosfores"
            className="hidden text-sm font-medium text-brand-red hover:underline md:block"
          >
            Όλες οι προσφορές →
          </Link>
        </div>

        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 md:gap-6 md:px-0">
          {products.map((p) => {
            const discountPct =
              p.compare_at_price && p.compare_at_price > p.price
                ? Math.round(
                    ((p.compare_at_price - p.price) / p.compare_at_price) * 100,
                  )
                : null;
            const href = `/${p.category_slug || "prosfores"}/${p.slug}`;
            return (
              <Link
                key={p.id}
                href={href}
                className="group relative w-[240px] flex-shrink-0 snap-start overflow-hidden rounded-xl border border-neutral-800 bg-[#141414] transition hover:border-brand-red/40 md:w-[280px]"
              >
                <div className="relative aspect-square overflow-hidden bg-neutral-900">
                  {p.primary_image_url ? (
                    <Image
                      src={p.primary_image_url}
                      alt={p.primary_image_alt}
                      fill
                      sizes="280px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-xs text-neutral-600">
                      no image
                    </div>
                  )}
                  {discountPct !== null && (
                    <span className="absolute left-3 top-3 rounded-full bg-brand-red px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                      -{discountPct}%
                    </span>
                  )}
                  <div className="absolute right-3 top-3 flex flex-col gap-2 opacity-0 transition group-hover:opacity-100">
                    <button
                      aria-label="Wishlist"
                      className="grid h-9 w-9 place-items-center rounded-full bg-white/90 text-neutral-900 backdrop-blur transition hover:bg-white"
                    >
                      <Heart className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Quick add"
                      className="grid h-9 w-9 place-items-center rounded-full bg-brand-red text-white transition hover:scale-105"
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-red">
                    {p.brand}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-sm font-medium text-white">
                    {p.name}
                  </h3>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="font-russo text-lg text-white">
                      €{p.price.toFixed(2)}
                    </span>
                    {p.compare_at_price && p.compare_at_price > p.price && (
                      <span className="text-xs text-neutral-500 line-through">
                        €{p.compare_at_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
