import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getMyBikeBrands } from "@/lib/queries/categories";
import { BikeSelector } from "./bike-selector";

export async function MyBikeEntry() {
  const t = await getTranslations("home");
  const brands = await getMyBikeBrands();
  if (brands.length === 0) return null;

  return (
    <section
      className="v3-mb v3-mb--reconstructed"
      id="my-bike"
      aria-label="Bike finder"
    >
      <div className="v3-mb-bg" aria-hidden="true">
        <Image
          src="/mega-menu/category-my-bike.webp"
          alt=""
          fill
          sizes="100vw"
        />
      </div>
      <div className="v3-mb-scrim" aria-hidden="true" />

      <div className="v3-mb-inner">
        <div className="v3-mb-copy">
          <p className="v3-label">Bike finder</p>
          <h2 className="v3-display">{t("myBikeHeading")}</h2>
          <p>{t("myBikeText")}</p>
        </div>

        <BikeSelector brands={brands} />
      </div>
    </section>
  );
}
