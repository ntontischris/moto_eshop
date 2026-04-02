import Image from "next/image";
import Link from "next/link";

import { PriceDisplay } from "@/components/ui/price-display";
import { CertificationBadge } from "@/components/ui/certification-badge";
import { RatingStars } from "@/components/ui/rating-stars";
import type { ProductListItem } from "@/lib/queries/products";

interface ProductCardProps {
  product: ProductListItem;
}

export function ProductCard({ product }: ProductCardProps) {
  const href = `/${product.category_slug}/${product.slug}`;
  const isOutOfStock = product.stock <= 0;
  const hasDiscount =
    product.compare_at_price !== null &&
    product.compare_at_price > product.price;

  return (
    <article className="group relative flex flex-col rounded-lg border bg-card transition-shadow hover:shadow-md">
      <Link
        href={href}
        className="relative aspect-square overflow-hidden rounded-t-lg"
      >
        <Image
          src={product.primary_image_url}
          alt={product.primary_image_alt}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <span className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900">
              Εξαντλημένο
            </span>
          </div>
        )}
        {hasDiscount && !isOutOfStock && (
          <span className="absolute left-2 top-2 rounded-md bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
            ΠΡΟΣΦΟΡΑ
          </span>
        )}
        {product.certification && (
          <div className="absolute right-2 top-2">
            <CertificationBadge certification={product.certification} />
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {product.brand}
        </span>
        <Link
          href={href}
          className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
        >
          {product.name}
        </Link>
        {product.average_rating !== null && product.review_count > 0 && (
          <RatingStars
            rating={product.average_rating}
            reviewCount={product.review_count}
            size="sm"
          />
        )}
        <div className="mt-auto pt-2">
          <PriceDisplay
            price={product.price}
            compareAtPrice={product.compare_at_price}
            size="sm"
          />
        </div>
      </div>
    </article>
  );
}
