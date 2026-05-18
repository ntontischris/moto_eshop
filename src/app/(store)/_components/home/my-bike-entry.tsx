import Link from "next/link";

/* MyBikeEntry — fitment entry point. Selects are display-only for MVP
   (no fake behavior); CTA links to the my-bike category root. */

export function MyBikeEntry() {
  return (
    <section
      className="v3-mb"
      id="my-bike"
      aria-label="Βρες εξοπλισμό για τη μηχανή σου"
    >
      <div className="v3-mb-inner">
        <div className="v3-mb-copy">
          <h2>Βρες εξοπλισμό για τη μηχανή σου</h2>
          <p>
            Επίλεξε μάρκα και μοντέλο για να δεις προτεινόμενο εξοπλισμό και
            αξεσουάρ συμβατά με τη μηχανή σου.
          </p>
        </div>
        <div className="v3-mb-form">
          <label className="v3-mb-field">
            <span>Μάρκα</span>
            <select disabled defaultValue="">
              <option value="">Επίλεξε μάρκα</option>
            </select>
          </label>
          <label className="v3-mb-field">
            <span>Μοντέλο</span>
            <select disabled defaultValue="">
              <option value="">Επίλεξε μοντέλο</option>
            </select>
          </label>
          <Link className="v3-btn-primary" href="/category/my-bike">
            Βρες εξοπλισμό
          </Link>
          <p className="v3-mb-note">Η επιλογή ανά μηχανή έρχεται σύντομα.</p>
        </div>
      </div>
    </section>
  );
}
