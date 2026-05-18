import Link from "next/link";
import type { ProductListItem } from "@/lib/queries/products";
import { ProductCard } from "../commerce/product-card";

/* OffersSection — red-accented rail. Discount % shown by PriceDisplay only when
   compare_at_price is genuinely higher (no fabricated discounts, PRD §22). */

export function OffersSection({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) return null;
  return (
    <section className="v3-off" aria-label="Προσφορές">
      <div className="v3-off-inner">
        <div className="v3-off-head">
          <div className="v3-off-htitle">
            <span className="v3-off-idx v3-display" aria-hidden="true">
              02
            </span>
            <h2>
              <span className="v3-off-tag v3-display">Προσφορές</span>
            </h2>
          </div>
          <Link href="/category/prosfores" className="v3-off-all">
            Όλες οι προσφορές <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="v3-off-track">
          {products.map((p) => (
            <div key={p.id} className="v3-off-item">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
