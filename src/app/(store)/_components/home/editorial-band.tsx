import Link from "next/link";
import Image from "next/image";
import { PHOTO } from "../../_lib/assets";

/* EditorialBand — full-bleed brand statement. Single optimized image (lazy,
   below the fold), fixed ratio → no CLS. The grid-breaking "premium" moment. */

export function EditorialBand() {
  return (
    <section className="v3-ed" aria-label="MotoMarket">
      <div className="v3-ed-media">
        <Image
          src={PHOTO.editorial}
          alt="Αναβάτης με πλήρη εξοπλισμό MotoMarket"
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <span className="v3-ed-scrim" aria-hidden="true" />
      </div>
      <div className="v3-ed-inner">
        <p className="v3-label v3-ed-kicker">
          <span className="v3-ed-bar" /> Φτιαγμένο για τον δρόμο
        </p>
        <h2 className="v3-display v3-ed-title">
          Δεν πουλάμε προϊόντα.
          <br />
          Σε <span>εξοπλίζουμε</span>.
        </h2>
        <p className="v3-ed-text">
          Επίσημες αντιπροσωπείες, γνήσια προϊόντα, πιστοποιήσεις που ισχύουν.
          Από το πρώτο σου κράνος μέχρι το επόμενο track day.
        </p>
        <Link
          className="v3-btn-primary"
          href="/category/eksoplismos-anabath"
        >
          Δες τον εξοπλισμό <span aria-hidden="true">→</span>
        </Link>
      </div>
      <style precedence="default">{`
        .v3-ed {
          position: relative; isolation: isolate;
          min-height: clamp(440px, 70vh, 720px);
          display: flex; align-items: center;
          padding: var(--v3-gutter);
          border-block: 1px solid var(--v3-line);
        }
        .v3-ed-media { position: absolute; inset: 0; z-index: -1; }
        .v3-ed-media img { object-fit: cover;
          filter: grayscale(.15) contrast(1.06); }
        .v3-ed-scrim {
          position: absolute; inset: 0;
          background: linear-gradient(100deg, rgba(8,9,11,.93) 0 38%,
            rgba(8,9,11,.5) 66%, rgba(8,9,11,.2) 100%);
        }
        .v3-ed-inner { max-width: 1340px; margin: 0 auto; width: 100%; }
        .v3-ed-kicker { display: inline-flex; align-items: center;
          gap: 12px; color: var(--v3-bone); margin: 0 0 18px; }
        .v3-ed-bar { width: 34px; height: 3px; background: var(--v3-red); }
        .v3-ed-title {
          margin: 0; color: var(--v3-bone); font-weight: 900;
          font-size: clamp(2.4rem, 7vw, 6rem); line-height: .96;
          transform: skewX(-6deg);
        }
        .v3-ed-title span { color: var(--v3-red); }
        .v3-ed-text {
          margin: 24px 0 30px; max-width: 460px; color: var(--v3-bone-dim);
          line-height: 1.6; font-size: 1.04rem;
        }
        @media (max-width: 720px) {
          .v3-ed-scrim { background: linear-gradient(0deg,
            rgba(8,9,11,.95) 0 36%, rgba(8,9,11,.45) 100%); }
        }
      `}</style>
    </section>
  );
}
