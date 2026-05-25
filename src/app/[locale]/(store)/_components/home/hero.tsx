import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { HERO_POSTER, HERO_POSTER_MOBILE } from "../../_lib/assets";

const HERO_ACTIONS = [
  {
    label: "Racing / Sport",
    href: "/category/eksoplismos-anabath--kranh-endoep-nies-kameres",
    meta: "Track fit",
  },
  {
    label: "Touring",
    href: "/category/eksoplismos-motosikletas",
    meta: "Long ride",
  },
  { label: "Urban", href: "/category/eksoplismos-anabath", meta: "Daily fit" },
  { label: "Adventure", href: "/category/off-road", meta: "Off-road ready" },
] as const;

export async function Hero() {
  const t = await getTranslations("home");

  const GEAR_ROOM_TILES = [
    {
      key: "helmet",
      label: t("tileCranea"),
      href: "/category/eksoplismos-anabath--kranh-endoep-nies-kameres",
      meta: "Full face / flip up",
    },
    {
      key: "jacket",
      label: t("tileMpoyfan"),
      href: "/category/endysh--mpoyfan",
      meta: "Textile / leather",
    },
    {
      key: "luggage",
      label: t("tileBalitses"),
      href: "/category/eksoplismos-motosikletas--balitses",
      meta: "Touring setup",
    },
    {
      key: "oil",
      label: t("tileLipantika"),
      href: "/category/lipantika",
      meta: "Service ready",
    },
  ] as const;

  return (
    <section
      className="v3-hero v3-hero--race-control v3-hero--ride-commerce"
      aria-label="MotoMarket"
    >
      <div className="v3-hero-bg" aria-hidden="true">
        <picture className="v3-hero-picture">
          <source media="(max-width: 720px)" srcSet={HERO_POSTER_MOBILE} />
          <img src={HERO_POSTER} alt="" fetchPriority="high" decoding="async" />
        </picture>
        <span className="v3-hero-scrim" />
      </div>

      <div className="v3-hero-inner">
        <div className="v3-hero-grid">
          <div className="v3-hero-copy">
            <p className="v3-hero-kicker v3-label">
              <span className="v3-hero-bar" /> MotoMarket Performance Shop
            </p>

            <h1 className="v3-hero-title v3-display">
              <span>{t("heroTitle1")}</span>
              <span>
                {t("heroTitle2")}
                <span className="v3-hero-slash">/</span>
              </span>
              <span className="v3-hero-l3">
                {t("heroTitle3")}{" "}
                <span className="v3-hero-mobile-break">{t("heroTitle4")}</span>
              </span>
            </h1>

            <p className="v3-hero-sub">{t("heroSub")}</p>

            <div className="v3-hero-cta">
              <Link
                className="v3-btn-primary"
                href="/category/eksoplismos-anabath--kranh-endoep-nies-kameres"
              >
                Shop by ride <span aria-hidden="true">→</span>
              </Link>
              <Link
                className="v3-hero-btn2"
                href="/category/eksoplismos-anabath"
              >
                {t("heroRiderGear")}
              </Link>
              <a className="v3-hero-btn3" href="#my-bike">
                My Bike
              </a>
            </div>

            <div className="v3-hero-activity" aria-label={t("heroQuickUse")}>
              {HERO_ACTIONS.map((action) => (
                <Link key={action.label} href={action.href}>
                  <span>{action.label}</span>
                  <em>{action.meta}</em>
                </Link>
              ))}
            </div>
          </div>

          <aside
            className="v3-hero-control v3-hero-gear-room"
            aria-label="Race control gear room"
          >
            <div className="v3-hero-finder">
              <div className="v3-hero-finder-head">
                <p className="v3-hero-control-title">Bike Finder</p>
                <span>fit first</span>
              </div>
              <div className="v3-hero-finder-fields">
                <a href="#my-bike">{t("heroBrand")}</a>
                <a href="#my-bike">{t("heroModel")}</a>
              </div>
            </div>

            <div className="v3-hero-gear-grid">
              {GEAR_ROOM_TILES.map((tile) => (
                <Link
                  className="v3-hero-gear-tile"
                  href={tile.href}
                  key={tile.key}
                >
                  <span>{tile.label}</span>
                  <em>{tile.meta}</em>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>

      <div className="v3-hero-strip" aria-hidden="true">
        <div className="v3-hero-ticker">
          {Array.from({ length: 2 }).map((_, k) => (
            <div className="v3-hero-tickrow" key={k}>
              <span>ECE 22.06</span>
              <i>/</i>
              <span>Official brands</span>
              <i>/</i>
              <span>{t("heroShipping")}</span>
              <i>/</i>
              <span>{t("heroCodes")}</span>
              <i>/</i>
              <span>{t("heroSizeChange")}</span>
              <i>/</i>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
