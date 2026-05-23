import Link from "next/link";
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

const GEAR_ROOM_TILES = [
  {
    label: "Κράνη",
    href: "/category/eksoplismos-anabath--kranh-endoep-nies-kameres",
    meta: "Full face / flip up",
  },
  {
    label: "Μπουφάν",
    href: "/category/endysh--mpoyfan",
    meta: "Textile / leather",
  },
  {
    label: "Βαλίτσες",
    href: "/category/eksoplismos-motosikletas--balitses",
    meta: "Touring setup",
  },
  {
    label: "Λιπαντικά",
    href: "/category/lipantika",
    meta: "Service ready",
  },
] as const;

export function Hero() {
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
              <span>Σωστό gear</span>
              <span>
                για τη μηχανή<span className="v3-hero-slash">/</span>
              </span>
              <span className="v3-hero-l3">
                και τη{" "}
                <span className="v3-hero-mobile-break">διαδρομή σου</span>
              </span>
            </h1>

            <p className="v3-hero-sub">
              Premium εξοπλισμός, αξεσουάρ και ανταλλακτικά σε ένα πιο καθαρό
              πρώτο βήμα: διάλεξε χρήση, μπες σε κατηγορία ή ξεκίνα από τη
              μηχανή σου.
            </p>

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
                Εξοπλισμός αναβάτη
              </Link>
              <a className="v3-hero-btn3" href="#my-bike">
                My Bike
              </a>
            </div>

            <div
              className="v3-hero-activity"
              aria-label="Γρήγορη επιλογή χρήσης"
            >
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
                <a href="#my-bike">Μάρκα</a>
                <a href="#my-bike">Μοντέλο</a>
              </div>
            </div>

            <div className="v3-hero-gear-grid">
              {GEAR_ROOM_TILES.map((tile) => (
                <Link
                  className="v3-hero-gear-tile"
                  href={tile.href}
                  key={tile.label}
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
              <span>Αποστολή 1-3 ημέρες</span>
              <i>/</i>
              <span>11.000+ κωδικοί</span>
              <i>/</i>
              <span>Αλλαγή μεγέθους</span>
              <i>/</i>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
