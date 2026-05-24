import { Link } from "@/i18n/navigation";
import type { ProductListItem } from "@/lib/queries/products";
import { ProductRailScroller } from "./product-rail-scroller";

export interface ProductRailProps {
  title: string;
  products: ProductListItem[];
  href?: string;
}

export function ProductRail({ title, products, href }: ProductRailProps) {
  if (products.length === 0) return null;

  const galleryProducts = products.slice(0, 16);

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

        <ProductRailScroller products={galleryProducts} />
      </div>
    </section>
  );
}
