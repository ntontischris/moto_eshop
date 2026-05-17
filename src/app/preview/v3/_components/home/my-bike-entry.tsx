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
          <Link className="v3-btn-primary" href="/preview/v3/category/my-bike">
            Βρες εξοπλισμό
          </Link>
          <p className="v3-mb-note">Η επιλογή ανά μηχανή έρχεται σύντομα.</p>
        </div>
      </div>
      <style precedence="default">{`
        .v3-mb {
          padding: 64px var(--v3-gutter);
          background:
            linear-gradient(180deg, var(--v3-graphite), var(--v3-carbon));
          border-top: 1px solid var(--v3-line);
        }
        .v3-mb-inner {
          max-width: 1320px; margin: 0 auto; display: grid;
          grid-template-columns: 1fr 1fr; gap: 40px; align-items: center;
        }
        .v3-mb-copy h2 {
          margin: 0 0 12px; font-size: clamp(1.6rem, 3.4vw, 2.3rem);
          font-weight: 800; color: var(--v3-bone);
        }
        .v3-mb-copy p {
          margin: 0; color: var(--v3-bone-dim); line-height: 1.55;
          max-width: 460px;
        }
        .v3-mb-form {
          display: grid; grid-template-columns: 1fr 1fr; gap: 14px;
          align-items: end;
        }
        .v3-mb-field { display: flex; flex-direction: column; gap: 6px; }
        .v3-mb-field span {
          font-size: .82rem; color: var(--v3-bone-dim); font-weight: 600;
        }
        .v3-mb-field select {
          height: 48px; padding: 0 12px; border-radius: var(--v3-radius);
          background: var(--v3-surface); color: var(--v3-bone);
          border: 1px solid var(--v3-line);
        }
        .v3-mb-form .v3-btn-primary {
          grid-column: 1 / -1; text-align: center; text-decoration: none;
        }
        .v3-mb-note {
          grid-column: 1 / -1; margin: 0; font-size: .78rem;
          color: var(--v3-bone-dim);
        }
        @media (max-width: 860px) {
          .v3-mb-inner { grid-template-columns: 1fr; gap: 28px; }
        }
        @media (max-width: 480px) {
          .v3-mb-form { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
