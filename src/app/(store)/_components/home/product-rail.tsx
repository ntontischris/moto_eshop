import Link from "next/link";
import type { ProductListItem } from "@/lib/queries/products";
import { ProductRailCard } from "./product-rail-card";

export interface ProductRailProps {
  title: string;
  products: ProductListItem[];
  href?: string;
}

export function ProductRail({ title, products, href }: ProductRailProps) {
  if (products.length === 0) return null;

  const galleryProducts = products.slice(0, 5);

  return (
    <section
      className="v3-rail v3-rail--reconstructed v3-rail--nour-gallery"
      aria-label={title}
    >
      <div className="v3-rail-inner">
        <div className="v3-rail-head">
          <div className="v3-rail-htitle">
            <div>
              <p className="v3-label">New arrivals</p>
              <h2 className="v3-display">{title}</h2>
            </div>
          </div>
          {href && (
            <Link href={href} className="v3-rail-all">
              Δες συλλογή <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>

        <div className="v3-gallery-grid">
          {galleryProducts.map((p, index) => (
            <ProductRailCard key={p.id} product={p} rank={index + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
