import Link from "next/link";
import type { ProductListItem } from "@/lib/queries/products";
import { ProductCard } from "../commerce/product-card";

/* ProductRail — horizontal scroll-snap row of cards. CSS scroll only. */

export interface ProductRailProps {
  title: string;
  products: ProductListItem[];
  href?: string;
  index?: string;
}

export function ProductRail({
  title,
  products,
  href,
  index = "01",
}: ProductRailProps) {
  if (products.length === 0) return null;
  return (
    <section className="v3-rail" aria-label={title}>
      <div className="v3-rail-inner">
        <div className="v3-rail-head">
          <div className="v3-rail-htitle">
            <span className="v3-rail-idx v3-display" aria-hidden="true">
              {index}
            </span>
            <h2 className="v3-display">{title}</h2>
          </div>
          {href && (
            <Link href={href} className="v3-rail-all">
              Δείτε όλα <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
        <div className="v3-rail-track">
          {products.map((p) => (
            <div key={p.id} className="v3-rail-item">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
