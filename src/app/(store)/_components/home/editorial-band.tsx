import Link from "next/link";
import Image from "next/image";
import { PHOTO } from "../../_lib/assets";

export function EditorialBand() {
  return (
    <section className="v3-ed v3-ed--reconstructed" aria-label="Rider gear">
      <div className="v3-ed-media">
        <Image
          src={PHOTO.editorial}
          alt="Premium εξοπλισμός MotoMarket"
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
        <span className="v3-ed-scrim" aria-hidden="true" />
      </div>
      <div className="v3-ed-inner">
        <p className="v3-label v3-ed-kicker">
          <span className="v3-ed-bar" /> Rider gear
        </p>
        <h2 className="v3-display v3-ed-title">
          Προστασία που δείχνει
          <br />
          όσο καλά δουλεύει.
        </h2>
        <p className="v3-ed-text">
          Κράνη, μπουφάν, γάντια και μπότες για κάθε ρυθμό οδήγησης.
        </p>
        <Link className="v3-btn-primary" href="/category/eksoplismos-anabath">
          Δες rider gear <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
