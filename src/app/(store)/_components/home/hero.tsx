import Link from "next/link";
import { HERO_POSTER, HERO_POSTER_MOBILE } from "../../_lib/assets";

const HERO_ACTIONS = [
  { label: "Racing / Sport", href: "/category/racing-gear", meta: "Track fit" },
  { label: "Adventure", href: "/category/off-road", meta: "Long ride" },
  { label: "Urban", href: "/category/eksoplismos-anabath", meta: "Daily" },
  { label: "Parts", href: "/category/antallaktika", meta: "Bike setup" },
] as const;

const RACE_METRICS = [
  ["Brands", "official"],
  ["Delivery", "1-3 ημέρες"],
  ["Returns", "14 ημέρες"],
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
          <img
            src={HERO_POSTER}
            alt=""
            fetchPriority="high"
            decoding="async"
          />
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
              <span>Διάλεξε</span>
              <span>
                τρόπο οδήγησης<span className="v3-hero-slash">/</span>
              </span>
              <span className="v3-hero-l3">πάρε σωστό gear</span>
            </h1>

            <p className="v3-hero-sub">
              Premium εξοπλισμός, αξεσουάρ και ανταλλακτικά για αναβάτες που
              αγοράζουν με σκοπό, όχι με τύχη.
            </p>

            <div className="v3-hero-cta">
              <Link className="v3-btn-primary" href="/category/racing-gear">
                Shop racing gear <span aria-hidden="true">→</span>
              </Link>
              <Link className="v3-hero-btn2" href="/category/eksoplismos-anabath">
                Εξοπλισμός αναβάτη
              </Link>
              <a className="v3-hero-btn3" href="#my-bike">
                Βρες προϊόντα για τη μηχανή σου
              </a>
            </div>

            <div className="v3-hero-activity" aria-label="Γρήγορη επιλογή χρήσης">
              {HERO_ACTIONS.map((action) => (
                <Link key={action.label} href={action.href}>
                  <span>{action.label}</span>
                  <em>{action.meta}</em>
                </Link>
              ))}
            </div>
          </div>

          <aside className="v3-hero-control" aria-label="MotoMarket highlights">
            <p className="v3-hero-control-title">Ready to ride</p>
            <div className="v3-hero-meter" aria-hidden="true">
              <span />
            </div>
            <dl className="v3-hero-metrics">
              {RACE_METRICS.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <div className="v3-hero-control-line">
              <span>11.000+ κωδικοί</span>
              <strong>fast choice</strong>
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
