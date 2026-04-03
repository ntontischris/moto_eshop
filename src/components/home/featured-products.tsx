"use client";

import Link from "next/link";
import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { Container } from "@/components/layout/container";
import { H2, SectionLabel } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

interface FeaturedProduct {
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

interface FeaturedProductsProps {
  products: FeaturedProduct[];
}

const formatPrice = (n: number) =>
  new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(
    n,
  );

const calcDiscount = (original: number, current: number) =>
  Math.round(((original - current) / original) * 100);

const Stars = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className={`h-3.5 w-3.5 ${star <= Math.round(rating) ? "fill-gold text-gold" : "text-bg-elevated"}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
    <span className="ml-1 text-xs text-text-muted">({rating})</span>
  </div>
);

const ProductCard = ({ product }: { product: FeaturedProduct }) => (
  <Link
    href={`/${product.category_slug}/${product.slug}`}
    className="group w-[240px] shrink-0 overflow-hidden rounded-lg border border-border-default bg-bg-deep transition-all duration-300 hover:border-brand-teal/30 hover:glow-teal"
  >
    <div className="relative aspect-square bg-bg-elevated">
      <div className="flex h-full items-center justify-center text-sm text-text-muted transition-transform duration-300 group-hover:scale-[1.02]">
        {product.brand}
      </div>

      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {product.compare_at_price !== null && (
          <Badge variant="sale">
            -{calcDiscount(product.compare_at_price, product.price)}%
          </Badge>
        )}
      </div>

      {product.stock === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-deep/70">
          <span className="text-sm font-semibold text-error">Εξαντλήθηκε</span>
        </div>
      )}

      {product.stock > 0 && (
        <div className="absolute inset-x-0 bottom-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0">
          <button
            type="button"
            className="w-full bg-brand-teal py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Προσθήκη στο Καλάθι
          </button>
        </div>
      )}
    </div>

    <div className="p-4">
      <p className="text-xs text-text-chrome">{product.brand}</p>
      <h3 className="mt-1 text-sm font-semibold text-text-primary">
        {product.name}
      </h3>
      <Stars rating={product.average_rating ?? 0} />
      <div className="mt-2 flex items-center gap-2">
        <span className="text-lg font-bold text-brand-teal">
          {formatPrice(product.price)}
        </span>
        {product.compare_at_price !== null && (
          <span className="text-sm text-text-muted line-through">
            {formatPrice(product.compare_at_price)}
          </span>
        )}
      </div>
    </div>
  </Link>
);

export const FeaturedProducts = ({ products }: FeaturedProductsProps) => (
  <section className="bg-bg-surface py-16 diagonal-top md:py-24">
    <Container>
      <ScrollReveal>
        <SectionLabel className="mb-3">Δημοφιλή</SectionLabel>
        <H2 className="mb-10 text-text-primary">TOP SELLERS</H2>
      </ScrollReveal>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
        {products.map((product, i) => (
          <ScrollReveal
            key={product.id}
            delay={i * 0.08}
            className="snap-start"
          >
            <ProductCard product={product} />
          </ScrollReveal>
        ))}
      </div>
    </Container>
  </section>
);
