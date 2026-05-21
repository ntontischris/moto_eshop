import Link from "next/link";
import { Bike, ChevronRight, SlidersHorizontal } from "lucide-react";

const STEPS = ["Μάρκα", "Μοντέλο", "Χρήση", "Setup"];

export function MyBikeEntry() {
  return (
    <section className="v3-mb v3-mb--reconstructed" id="my-bike" aria-label="Bike finder">
      <div className="v3-mb-inner">
        <div className="v3-mb-copy">
          <p className="v3-label">Bike finder</p>
          <h2 className="v3-display">Αγόρασε γύρω από τη μηχανή σου.</h2>
          <p>
            Βαλίτσες, βάσεις, ζελατίνες, λιπαντικά και αξεσουάρ που ταιριάζουν
            στον τρόπο που οδηγείς.
          </p>
        </div>

        <div className="v3-mb-console">
          <div className="v3-mb-console-head">
            <Bike size={22} aria-hidden="true" />
            <span>Garage selector</span>
            <SlidersHorizontal size={18} aria-hidden="true" />
          </div>
          <div className="v3-mb-steps">
            {STEPS.map((step, i) => (
              <span key={step}>
                <em>{String(i + 1).padStart(2, "0")}</em>
                {step}
              </span>
            ))}
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
              Βρες setup <ChevronRight size={18} aria-hidden="true" />
            </Link>
          </div>
          <p className="v3-mb-note">
            Η επιλογή ανά ακριβές μοντέλο ενεργοποιείται σύντομα.
          </p>
        </div>
      </div>
    </section>
  );
}
