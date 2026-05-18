import Link from "next/link";
import Image from "next/image";
import { HERO_POSTER } from "../../_lib/assets";

/* Hero — static full-bleed image (LCP = optimized poster <Image priority>).
   No video: PRD bans a video hero, the old clip read as a stray remnant,
   and dropping it removes ~1.9MB + autoplay decode from the critical path. */

const HELMET_SLUG = "eksoplismos-anabath";

export function Hero() {
  return (
    <section className="v3-hero" aria-label="MotoMarket">
      <div className="v3-hero-bg" aria-hidden="true">
        <Image
          src={HERO_POSTER}
          alt=""
          fill
          priority
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <span className="v3-hero-scrim" />
      </div>

      <div className="v3-hero-inner">
        <p className="v3-hero-kicker v3-label">
          <span className="v3-hero-bar" /> MotoMarket — Performance Commerce
        </p>

        <h1 className="v3-hero-title v3-display">
          <span>Εξοπλισμός</span>
          <span>
            μηχανής<span className="v3-hero-slash">/</span>
          </span>
          <span className="v3-hero-l3">χωρίς όρια</span>
        </h1>

        <p className="v3-hero-sub">
          Κράνη, μπουφάν, γάντια και αξεσουάρ από επίσημους προμηθευτές. Διάλεξε
          με βάση χρήση, μέγεθος και πιστοποίηση — όχι τύχη.
        </p>

        <div className="v3-hero-cta">
          <Link className="v3-btn-primary" href={`/category/${HELMET_SLUG}`}>
            Αγόρασε κράνη <span aria-hidden="true">→</span>
          </Link>
          <Link className="v3-hero-btn2" href="/category/prosfores">
            Προσφορές
          </Link>
          <a className="v3-hero-btn3" href="#my-bike">
            Βρες με βάση τη μηχανή σου
          </a>
        </div>
      </div>

      <div className="v3-hero-strip" aria-hidden="true">
        <div className="v3-hero-ticker">
          {Array.from({ length: 2 }).map((_, k) => (
            <div className="v3-hero-tickrow" key={k}>
              <span>ECE 22.06</span>
              <i>/</i>
              <span>Επίσημοι προμηθευτές</span>
              <i>/</i>
              <span>Αποστολή 1–3 ημέρες</span>
              <i>/</i>
              <span>11.000+ κωδικοί</span>
              <i>/</i>
              <span>Γνήσια προϊόντα</span>
              <i>/</i>
              <span>Αλλαγή μεγέθους 14 ημέρες</span>
              <i>/</i>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
