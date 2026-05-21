import Link from "next/link";
import type { ProductListItem } from "@/lib/queries/products";
import { ProductCard } from "../commerce/product-card";

export function OffersSection({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) return null;

  return (
    <section className="v3-off v3-off--reconstructed" aria-label="Προσφορές">
      <div className="v3-off-inner">
        <div className="v3-off-panel">
          <p className="v3-label">Live deals</p>
          <h2 className="v3-display">Προσφορές που αξίζουν χώρο στο καλάθι.</h2>
          <Link href="/category/prosfores" className="v3-off-all">
            Όλες οι προσφορές <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="v3-off-track">
          {products.map((p, i) => (
            <div key={p.id} className="v3-off-item">
              <ProductCard product={p} rank={i + 1} compact />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
