import Link from "next/link";
import Image from "next/image";
import { HERO_VIDEO, HERO_POSTER } from "../../_lib/assets";

/* Hero — full-bleed cinematic frame. LCP = optimized poster <Image priority>;
   the muted loop video sits above it and only enhances (preload metadata, no
   layout shift, paused under reduced-motion). No scroll-jacking. */

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
        <video
          className="v3-hero-vid"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={HERO_POSTER}
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>
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
          <Link
            className="v3-btn-primary"
            href={`/category/${HELMET_SLUG}`}
          >
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

      <style precedence="default">{`
        .v3-hero {
          position: relative; isolation: isolate;
          min-height: clamp(560px, 92vh, 920px);
          display: flex; flex-direction: column; justify-content: flex-end;
          padding: var(--v3-gutter);
          border-bottom: 1px solid var(--v3-line);
          overflow: hidden;
        }
        .v3-hero-bg { position: absolute; inset: 0; z-index: -1;
          overflow: hidden; }
        .v3-hero-bg img {
          filter: saturate(1.05) contrast(1.05);
          animation: v3-kb 26s ease-in-out infinite alternate;
        }
        .v3-hero-vid {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; opacity: .92;
          animation: v3-kb 26s ease-in-out infinite alternate;
        }
        @keyframes v3-kb {
          from { transform: scale(1.02) translate3d(0,0,0); }
          to { transform: scale(1.12) translate3d(-1.5%,-1%,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .v3-hero-bg img, .v3-hero-vid { animation: none; }
        }
        .v3-hero-scrim {
          position: absolute; inset: 0;
          background:
            linear-gradient(90deg, rgba(8,9,11,.92) 0 30%,
              rgba(8,9,11,.45) 62%, rgba(8,9,11,.7) 100%),
            linear-gradient(0deg, rgba(8,9,11,.96) 0 8%,
              transparent 38% 70%, rgba(8,9,11,.4) 100%);
        }
        .v3-hero-inner { position: relative; max-width: 1340px;
          margin: 0 auto; width: 100%; }
        .v3-hero-kicker {
          display: inline-flex; align-items: center; gap: 12px;
          margin: 0 0 22px; color: var(--v3-bone);
        }
        .v3-hero-bar { width: 34px; height: 3px; background: var(--v3-red); }
        .v3-hero-title {
          margin: 0; color: var(--v3-bone);
          font-size: clamp(3.2rem, 12vw, 11rem); font-weight: 900;
          display: flex; flex-direction: column;
          transform: skewX(-7deg);
          text-shadow: 0 6px 30px rgba(0,0,0,.55);
        }
        .v3-hero-slash { color: var(--v3-red); margin-left: .12em; }
        .v3-hero-l3 {
          color: transparent;
          -webkit-text-stroke: 1.5px rgba(245,243,238,.55);
          align-self: flex-start; margin-left: clamp(0px, 8vw, 220px);
          white-space: nowrap;
        }
        .v3-hero-sub {
          margin: 26px 0 0; max-width: 520px; font-size: 1.05rem;
          line-height: 1.6; color: var(--v3-bone-dim);
        }
        .v3-hero-cta {
          margin-top: 32px; display: flex; flex-wrap: wrap; gap: 14px;
          align-items: center;
        }
        .v3-hero-btn2 {
          font-family: var(--v3-display); font-weight: 800;
          text-transform: uppercase; letter-spacing: .04em;
          padding: 15px 26px; border-radius: var(--v3-radius);
          background: rgba(245,243,238,.06); color: var(--v3-bone);
          border: 1px solid rgba(245,243,238,.22); text-decoration: none;
          backdrop-filter: blur(4px);
          transition: border-color .15s, background .15s;
        }
        .v3-hero-btn2:hover { border-color: var(--v3-red);
          background: rgba(245,243,238,.1); }
        .v3-hero-btn3 {
          color: var(--v3-bone-dim); text-decoration: none; font-weight: 600;
          font-size: .92rem; border-bottom: 1px solid transparent;
        }
        .v3-hero-btn3:hover { color: var(--v3-bone);
          border-bottom-color: var(--v3-red); }
        .v3-hero-btn2:focus-visible, .v3-hero-btn3:focus-visible {
          outline: 2px solid var(--v3-cyan); outline-offset: 3px;
        }
        .v3-hero-strip {
          position: relative; max-width: 1340px; margin: 40px auto 0;
          width: 100%; overflow: hidden;
          border-top: 1px solid rgba(245,243,238,.16); padding-top: 14px;
          -webkit-mask-image: linear-gradient(90deg, transparent,
            #000 6%, #000 94%, transparent);
          mask-image: linear-gradient(90deg, transparent,
            #000 6%, #000 94%, transparent);
        }
        .v3-hero-ticker { display: flex; width: max-content;
          animation: v3-tick 32s linear infinite; }
        .v3-hero-tickrow { display: flex; align-items: center; }
        .v3-hero-strip span {
          font-family: var(--v3-display); font-weight: 700;
          text-transform: uppercase; letter-spacing: .14em;
          font-size: .76rem; color: var(--v3-bone-dim); white-space: nowrap;
          padding: 0 22px;
        }
        .v3-hero-strip i { color: var(--v3-red); font-style: normal;
          font-weight: 800; }
        @keyframes v3-tick {
          from { transform: translate3d(0,0,0); }
          to { transform: translate3d(-50%,0,0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .v3-hero-vid { display: none; }
          .v3-hero-ticker { animation: none; }
        }
        @media (max-width: 720px) {
          .v3-hero-l3 { margin-left: 0;
            -webkit-text-stroke: 1px rgba(245,243,238,.5); }
          .v3-hero-scrim { background:
            linear-gradient(0deg, rgba(8,9,11,.95) 0 30%,
              rgba(8,9,11,.45) 100%); }
          .v3-hero-strip span { font-size: .66rem; padding: 0 14px; }
        }
      `}</style>
    </section>
  );
}
