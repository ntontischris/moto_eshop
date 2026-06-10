import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import type { ProductListItem } from "@/lib/queries/products";
import { ProductCard } from "../commerce/product-card";
import { OfferCountdown } from "./offer-countdown";

export async function OffersSection({
  products,
}: {
  products: ProductListItem[];
}) {
  if (products.length === 0) return null;
  const t = await getTranslations("home");

  return (
    <section
      className="v3-off v3-off--reconstructed"
      aria-label={t("offersSection")}
    >
      <div className="v3-off-bg" aria-hidden="true" data-offers-drift>
        {`${t("offersBackdrop")} / `.repeat(4)}
      </div>
      <div className="v3-off-inner">
        <div className="v3-off-panel">
          <p className="v3-label">Live deals</p>
          <h2 className="v3-display">{t("offersHeading")}</h2>
          <OfferCountdown
            label={t("offersCountdownLabel")}
            expiredLabel={t("offersCountdownExpired")}
          />
          <Link href="/prosfores" className="v3-off-all">
            {t("offersAll")} <span aria-hidden="true">→</span>
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
