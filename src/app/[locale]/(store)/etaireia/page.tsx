import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import { buildAlternates } from "@/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Η Εταιρεία | MotoMarket",
    description:
      "Από το 1982 στον κόσμο της μοτοσικλέτας. Η ιστορία, οι αξίες και τα δικά μας brands — Pilot, Nordcode, Fovos.",
    alternates: buildAlternates(locale, "/etaireia"),
  };
}

const STATS = [
  { value: "1982", label: "Από την ίδρυση" },
  { value: "6.000 τ.μ.", label: "Αποθήκες & καταστήματα" },
  { value: "3", label: "Δικά μας brands" },
  { value: "ISO 9001", label: "Πιστοποίηση ποιότητας" },
];

const OWN_BRANDS = [
  {
    name: "Pilot",
    cat: "Κράνη",
    text: "Η σειρά κρανών μας, σχεδιασμένη για ασφάλεια και αξία.",
  },
  {
    name: "Nordcode",
    cat: "Ένδυση αναβάτη",
    text: "Ένδυση αποκλειστικά για μοτοσικλετιστές, με σωστή εφαρμογή και πρότυπα ασφαλείας.",
  },
  {
    name: "Fovos",
    cat: "Off-road",
    text: "Σχεδιασμός για τις ανάγκες του off-road αναβάτη — άνεση, ασφάλεια, ποιότητα.",
  },
];

export default function CompanyPage() {
  return (
    <div className="et">
      <header className="et-hero">
        <p className="v3-label et-kicker">Η Εταιρεία</p>
        <h1 className="et-title">Από το 1982 στον κόσμο της μοτοσικλέτας</h1>
        <p className="et-sub">
          Το πάθος για τη μοτοσικλέτα ήταν το έναυσμα της ίδρυσης της MotoMarket
          το 1982. Από ένα μικρό κατάστημα στη Θεσσαλονίκη, σήμερα είμαστε ένας
          από τους μεγαλύτερους προμηθευτές εξοπλισμού αναβάτη και μοτοσικλέτας
          στην Ελλάδα και τη ΝΑ Ευρώπη.
        </p>
      </header>

      <section className="et-stats" aria-label="Η εταιρεία με αριθμούς">
        {STATS.map((s) => (
          <div key={s.label} className="et-stat">
            <span className="et-stat-v">{s.value}</span>
            <span className="et-stat-l">{s.label}</span>
          </div>
        ))}
      </section>

      <section className="et-story">
        <h2 className="et-h2">Το ταξίδι μας</h2>
        <p>
          Ξεκινήσαμε με ένα μικρό κατάστημα στο κέντρο της Θεσσαλονίκης. Η άμεση
          επαφή με την ιταλική αγορά είχε ως αποτέλεσμα, στην πορεία των ετών,
          την αντιπροσώπευση γνωστών ευρωπαϊκών brands. Έως το 2000 το μικρό
          κατάστημα είχε μεταμορφωθεί σε σύγχρονες εγκαταστάσεις στη βιομηχανική
          περιοχή της Θεσσαλονίκης.
        </p>
        <p>
          Σήμερα διαθέτουμε 6.000 τ.μ. αποθηκών και καταστημάτων, καθώς και
          εκατοντάδες συνεργάτες στην ελληνική επικράτεια και τη Νοτιοανατολική
          Ευρώπη. Η ομαδικότητα, ως κύρια αξία της MotoMarket, είναι ο πυλώνας
          για τη συνεχή βελτίωση των υπηρεσιών μας. Το ταξίδι συνεχίζεται.
        </p>
      </section>

      <section className="et-values">
        <div className="et-value v3-cut">
          <h3>Ασφάλεια — Design — Τιμή</h3>
          <p>
            Το τρίπτυχο που καθοδηγεί κάθε επιλογή προϊόντος, για τον καθημερινό
            αναβάτη scooter μέχρι τον κάτοχο superbike μεγάλου κυβισμού.
          </p>
        </div>
        <div className="et-value v3-cut">
          <h3>Ποιότητα στην εξυπηρέτηση</h3>
          <p>
            Η ποιότητα του προϊόντος δεν αρκεί από μόνη της. Επενδύουμε σε
            υποδομές και εξειδικευμένο ανθρώπινο δυναμικό για άμεση, ποιοτική
            εξυπηρέτηση.
          </p>
        </div>
        <div className="et-value v3-cut">
          <h3>Όραμα</h3>
          <p>
            Ένα καινοτόμο περιβάλλον για τον σύγχρονο αναβάτη, που εμπνέει το
            κοινό να αποκτά εικόνες και αναμνήσεις — με ασφάλεια.
          </p>
        </div>
      </section>

      <section className="et-brands">
        <h2 className="et-h2">Τα δικά μας brands</h2>
        <p className="et-brands-intro">
          Διακρίνοντας το κενό ανάμεσα στα φθηνά–κακής ποιότητας και στα
          ποιοτικά–αλλά–ακριβά προϊόντα, δημιουργήσαμε τα δικά μας brands για να
          προσφέρουμε ποιότητα σε πραγματικά ανταγωνιστικές τιμές.
        </p>
        <div className="et-brand-grid">
          {OWN_BRANDS.map((b) => (
            <div key={b.name} className="et-brand v3-cut">
              <span className="et-brand-cat v3-label">{b.cat}</span>
              <span className="et-brand-name">{b.name}</span>
              <p>{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="et-facility">
        <h2 className="et-h2">Εγκαταστάσεις & πιστοποιήσεις</h2>
        <p>
          Από το 1999 οι κεντρικές μας εγκαταστάσεις βρίσκονται στη βιομηχανική
          περιοχή της Σίνδου Θεσσαλονίκης — με μεγάλους αποθηκευτικούς χώρους
          που εξυπηρετούν με συνέπεια λιανική και χονδρική. Η εταιρεία είναι
          πιστοποιημένη κατά ISO 9001 (Σύστημα Διαχείρισης Ποιότητας).
        </p>
        <p className="et-gemh">Αρ. ΓΕΜΗ: 058969304000</p>
      </section>

      <section className="et-cta">
        <Link className="v3-btn-primary" href="/">
          Δες το κατάστημα <span aria-hidden="true">→</span>
        </Link>
        <Link className="et-cta-alt" href="/epikoinonia">
          Επικοινωνία & καταστήματα
        </Link>
      </section>

      <CompanyStyles />
    </div>
  );
}

function CompanyStyles() {
  return (
    <style precedence="default">{`
      .et { max-width: 1080px; margin: 0 auto;
        padding: 36px var(--v3-gutter) 96px; }
      .et-kicker { color: var(--v3-red); margin: 0 0 12px; }
      .et-title { margin: 0; max-width: 16ch; color: var(--v3-bone);
        font-family: var(--v3-display); font-weight: 900; line-height: .92;
        text-transform: uppercase; transform: skewX(-6deg);
        font-size: clamp(2.2rem, 7vw, 4.4rem); }
      .et-sub { margin: 22px 0 0; max-width: 62ch; color: var(--v3-bone-dim);
        font-size: 1.08rem; line-height: 1.65; }

      .et-stats { display: grid; grid-template-columns: repeat(4, 1fr);
        gap: 1px; background: var(--v3-line); border: 1px solid var(--v3-line);
        margin: 48px 0; }
      .et-stat { background: var(--v3-surface); padding: 22px 18px;
        display: flex; flex-direction: column; gap: 6px; }
      .et-stat-v { font-family: var(--v3-display); font-weight: 900;
        font-size: clamp(1.5rem, 4vw, 2.2rem); color: var(--v3-bone); }
      .et-stat-l { font-size: .8rem; color: var(--v3-bone-dim);
        text-transform: uppercase; letter-spacing: .06em; }

      .et-h2 { color: var(--v3-bone); font-family: var(--v3-display);
        font-weight: 800; text-transform: uppercase; font-size: 1.6rem;
        margin: 0 0 18px; }
      .et-story { margin: 40px 0; }
      .et-story p { color: var(--v3-bone-dim); line-height: 1.75;
        margin: 0 0 16px; max-width: 70ch; }

      .et-values { display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 18px; margin: 48px 0; }
      .et-value { background: var(--v3-surface); border: 1px solid var(--v3-line);
        padding: 24px; }
      .et-value h3 { margin: 0 0 10px; color: var(--v3-bone);
        font-size: 1.05rem; font-weight: 800; }
      .et-value p { margin: 0; color: var(--v3-bone-dim); line-height: 1.6;
        font-size: .94rem; }

      .et-brands { margin: 48px 0; }
      .et-brands-intro { color: var(--v3-bone-dim); line-height: 1.7;
        max-width: 68ch; margin: 0 0 24px; }
      .et-brand-grid { display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 18px; }
      .et-brand { background: var(--v3-surface-2);
        border: 1px solid var(--v3-line); padding: 24px;
        display: flex; flex-direction: column; gap: 8px; }
      .et-brand-cat { color: var(--v3-cyan); }
      .et-brand-name { font-family: var(--v3-display); font-weight: 900;
        font-size: 1.8rem; color: var(--v3-bone); text-transform: uppercase; }
      .et-brand p { margin: 4px 0 0; color: var(--v3-bone-dim);
        font-size: .92rem; line-height: 1.55; }

      .et-facility { margin: 48px 0; }
      .et-facility p { color: var(--v3-bone-dim); line-height: 1.75;
        max-width: 70ch; margin: 0 0 12px; }
      .et-gemh { font-family: var(--v3-display); letter-spacing: .04em;
        color: var(--v3-bone-dim); }

      .et-cta { display: flex; align-items: center; gap: 20px;
        flex-wrap: wrap; margin-top: 40px; }
      .et-cta .v3-btn-primary { text-decoration: none; }
      .et-cta-alt { color: var(--v3-cyan); text-decoration: none;
        font-weight: 600; }

      @media (max-width: 820px) {
        .et-stats { grid-template-columns: repeat(2, 1fr); }
        .et-values, .et-brand-grid { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}
