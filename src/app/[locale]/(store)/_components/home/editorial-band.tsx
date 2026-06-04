import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { PHOTO } from "../../_lib/assets";

export async function EditorialBand() {
  const t = await getTranslations("home");

  return (
    <section className="v3-ed v3-ed--reconstructed" aria-label="Rider gear">
      <div className="v3-ed-media">
        <Image
          src={PHOTO.editorial}
          alt={t("editorialAlt")}
          fill
          sizes="(max-width: 860px) 100vw, 58vw"
          style={{ objectFit: "cover" }}
        />
        <span className="v3-ed-scrim" aria-hidden="true" />
      </div>
      <div className="v3-ed-inner">
        <p className="v3-label v3-ed-kicker">
          <span className="v3-ed-bar" /> Rider gear
        </p>
        <h2 className="v3-display v3-ed-title">
          {t("editorialTitle1")}
          <br />
          {t("editorialTitle2")}
        </h2>
        <p className="v3-ed-text">{t("editorialText")}</p>
        <Link className="v3-btn-primary" href="/eksoplismos-anabath">
          {t("editorialCta")} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
