"use client";

import { ScrollReveal } from "@/components/effects/scroll-reveal";
import { Container } from "@/components/layout/container";
import { H2, SectionLabel } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: "AGV K6 S",
    brand: "AGV",
    price: 449.99,
    originalPrice: 529.99,
    rating: 4.8,
    reviews: 124,
    inStock: true,
    isNew: false,
  },
  {
    id: 2,
    name: "Dainese Racing 4",
    brand: "Dainese",
    price: 389.0,
    rating: 4.9,
    reviews: 89,
    inStock: true,
    isNew: true,
  },
  {
    id: 3,
    name: "Alpinestars SMX-6 v2",
    brand: "Alpinestars",
    price: 249.95,
    rating: 4.7,
    reviews: 203,
    inStock: true,
    isNew: false,
  },
  {
    id: 4,
    name: "Shoei GT-Air 3",
    brand: "Shoei",
    price: 599.0,
    originalPrice: 649.0,
    rating: 4.9,
    reviews: 67,
    inStock: false,
    isNew: false,
  },
  {
    id: 5,
    name: "Rev'It Sand 4 H2O",
    brand: "Rev'It",
    price: 329.99,
    rating: 4.6,
    reviews: 156,
    inStock: true,
    isNew: true,
  },
  {
    id: 6,
    name: "Sena 50S Mesh",
    brand: "Sena",
    price: 329.0,
    rating: 4.5,
    reviews: 312,
    inStock: true,
    isNew: false,
  },
];

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

interface ProductCardProps {
  product: (typeof MOCK_PRODUCTS)[number];
}

const ProductCard = ({ product }: ProductCardProps) => (
  <div className="group w-[240px] shrink-0 overflow-hidden rounded-lg border border-border-default bg-bg-deep transition-all duration-300 hover:border-brand-teal/30 hover:glow-teal">
    <div className="relative aspect-square bg-bg-elevated">
      <div className="flex h-full items-center justify-center text-sm text-text-muted transition-transform duration-300 group-hover:scale-[1.02]">
        {product.brand}
      </div>

      <div className="absolute top-2 left-2 flex flex-col gap-1">
        {product.originalPrice && (
          <Badge variant="sale">
            -{calcDiscount(product.originalPrice, product.price)}%
          </Badge>
        )}
        {product.isNew && <Badge variant="new">NEW</Badge>}
      </div>

      {!product.inStock && (
        <div className="absolute inset-0 flex items-center justify-center bg-bg-deep/70">
          <span className="text-sm font-semibold text-error">Εξαντλήθηκε</span>
        </div>
      )}

      {product.inStock && (
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
      <Stars rating={product.rating} />
      <div className="mt-2 flex items-center gap-2">
        <span className="text-lg font-bold text-brand-teal">
          {formatPrice(product.price)}
        </span>
        {product.originalPrice && (
          <span className="text-sm text-text-muted line-through">
            {formatPrice(product.originalPrice)}
          </span>
        )}
      </div>
    </div>
  </div>
);

export const FeaturedProducts = () => (
  <section className="bg-bg-surface py-16 diagonal-top md:py-24">
    <Container>
      <ScrollReveal>
        <SectionLabel className="mb-3">Δημοφιλή</SectionLabel>
        <H2 className="mb-10 text-text-primary">TOP SELLERS</H2>
      </ScrollReveal>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
        {MOCK_PRODUCTS.map((product, i) => (
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
