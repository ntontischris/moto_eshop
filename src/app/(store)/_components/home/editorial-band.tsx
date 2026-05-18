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
        <Link className="v3-btn-primary" href="/category/eksoplismos-anabath">
          Δες τον εξοπλισμό <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
