import Link from "next/link";
import type { ProductListItem } from "@/lib/queries/products";
import { ProductCard } from "../commerce/product-card";

export interface ProductRailProps {
  title: string;
  products: ProductListItem[];
  href?: string;
}

export function ProductRail({ title, products, href }: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <section className="v3-rail v3-rail--reconstructed" aria-label={title}>
      <div className="v3-rail-inner">
        <div className="v3-rail-head">
          <div className="v3-rail-htitle">
            <div>
              <p className="v3-label">Ready to shop</p>
              <h2 className="v3-display">{title}</h2>
            </div>
          </div>
          {href && (
            <Link href={href} className="v3-rail-all">
              Δες συλλογή <span aria-hidden="true">→</span>
            </Link>
          )}
        </div>
        <div className="v3-rail-track">
          {products.map((p, i) => (
            <div key={p.id} className="v3-rail-item">
              <ProductCard product={p} rank={i + 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
