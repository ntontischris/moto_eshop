import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { PHOTO } from "../../_lib/assets";
import { LqipImage } from "../fx/lqip-image";

/* S12 editorial chapter — a cinematic sticky scene. The outer section is tall;
   the inner stage pins (position: sticky) so the pit-lane media zooms out as you
   scroll through it and the manifesto quote reveals word-by-word, with the kicker
   and CTA following. The motion engine (startEditorial) enriches this on top of a
   fully-visible CSS baseline: under reduced-motion / no-JS the quote, kicker and
   CTA are all readable and the media sits at rest scale.

   Accessibility: the quote heading carries the full text as its aria-label, and
   the word-split spans are aria-hidden, so screen readers read it once. */
export async function EditorialBand() {
  const t = await getTranslations("home");
  const quote = `${t("editorialTitle1")} ${t("editorialTitle2")}`;

  return (
    <section
      className="v3-ed v3-ed--chapter"
      aria-label="Rider gear"
      data-editorial-chapter
    >
      <div className="v3-ed-stage" data-editorial-stage>
        <div className="v3-ed-media" data-editorial-media>
          <LqipImage
            src={PHOTO.editorial}
            alt={t("editorialAlt")}
            sizes="100vw"
          />
          <span className="v3-ed-scrim" aria-hidden="true" />
        </div>
        <div className="v3-ed-inner">
          <p className="v3-label v3-ed-kicker" data-editorial-lead>
            <span className="v3-ed-bar" /> Rider gear
          </p>
          {/* Visible markup mirrors the aria-label; the engine word-splits the
              second line on entry. <em> on line two flags the accent reveal. */}
          <h2 className="v3-display v3-ed-title" aria-label={quote}>
            <span className="v3-ed-quote" data-editorial-quote>
              {t("editorialTitle1")} <em>{t("editorialTitle2")}</em>
            </span>
          </h2>
          <p className="v3-ed-text" data-editorial-lead>
            {t("editorialText")}
          </p>
          <Link
            className="v3-btn-primary v3-ed-cta"
            href="/eksoplismos-anabath"
            data-editorial-lead
          >
            {t("editorialCta")} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
