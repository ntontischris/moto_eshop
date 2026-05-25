import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { buildAlternates } from "@/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: "Επικοινωνία | MotoMarket",
    description:
      "Καταστήματα, τηλέφωνα, email και ωράριο εξυπηρέτησης της MotoMarket σε Αθήνα, Θεσσαλονίκη και Σίνδο.",
    alternates: buildAlternates(locale, "/epikoinonia"),
  };
}

type Store = {
  name: string;
  tag: string;
  address: string[];
  phone: string;
  email?: string;
};

const STORES: Store[] = [
  {
    name: "Κατάστημα Αθήνας",
    tag: "Λιανική",
    address: ["Θησέως 25 (Ελ. Βενιζέλου)", "176 71 Καλλιθέα"],
    phone: "210 92 22 349",
    email: "venizelou@motomarket.gr",
  },
  {
    name: "Κατάστημα Θεσσαλονίκης",
    tag: "Λιανική",
    address: ["Εθνικής Αντιστάσεως 139", "551 34 Καλαμαριά"],
    phone: "2310 444 466",
    email: "kalamaria@motomarket.gr",
  },
  {
    name: "Κεντρικά Γραφεία & Αποθήκες",
    tag: "Σίνδος — Showroom",
    address: ["Βι.Πε. Σίνδου, Δρόμος Α5 – Νο 38", "57022 Σίνδος, Θεσσαλονίκη"],
    phone: "2310 795 615",
    email: "customer@motomarket.gr",
  },
  {
    name: "Χονδρική Αθηνών",
    tag: "B2B",
    address: ["Θησέως 25 (Ελ. Βενιζέλου)", "176 71 Καλλιθέα, Αθήνα"],
    phone: "210 95 15 706",
    email: "sales1@motomarket.gr",
  },
];

const telHref = (phone: string) => `tel:${phone.replace(/\s+/g, "")}`;

export default function ContactPage() {
  return (
    <div className="ep">
      <header className="ep-hero">
        <p className="v3-label ep-kicker">Επικοινωνία</p>
        <h1 className="ep-title">Είμαστε εδώ για εσένα</h1>
        <p className="ep-sub">
          Επικοινώνησε μαζί μας για οποιαδήποτε πληροφορία ή διευκρίνιση.
        </p>
      </header>

      <section className="ep-quick" aria-label="Γενική εξυπηρέτηση">
        <div className="ep-quick-item">
          <span className="v3-label">Ωράριο</span>
          <strong>Δευτέρα – Παρασκευή</strong>
          <span>10:00 – 18:00</span>
        </div>
        <div className="ep-quick-item">
          <span className="v3-label">Email</span>
          <a href="mailto:customer@motomarket.gr">customer@motomarket.gr</a>
        </div>
        <div className="ep-quick-item">
          <span className="v3-label">Online παραγγελίες</span>
          <a href={telHref("698 16 69 462")}>698 16 69 462</a>
        </div>
      </section>

      <section className="ep-stores">
        <h2 className="ep-h2">Καταστήματα</h2>
        <div className="ep-grid">
          {STORES.map((s) => (
            <div key={s.name} className="ep-store v3-cut">
              <span className="ep-store-tag v3-label">{s.tag}</span>
              <h3 className="ep-store-name">{s.name}</h3>
              <address className="ep-store-addr">
                {s.address.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </address>
              <div className="ep-store-contact">
                <a href={telHref(s.phone)}>Τ. {s.phone}</a>
                {s.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="ep-note-sec">
        <p className="cs-note ep-note">
          Πέρα από τα παραπάνω σημεία, θα βρεις προϊόντα MotoMarket και σε
          συνεργαζόμενα καταστήματα σε όλη την Ελλάδα (Καβάλα, Κομοτηνή, Ξάνθη,
          Σέρρες, Λάρισα, Καρδίτσα, Πτολεμαΐδα, Ρόδος) καθώς και στην Πρίστινα
          (Κόσοβο).
        </p>
        <p className="ep-gemh">Moto Market — Αρ. ΓΕΜΗ: 058969304000</p>
      </section>

      <ContactStyles />
    </div>
  );
}

function ContactStyles() {
  return (
    <style precedence="default">{`
      .ep { max-width: 1080px; margin: 0 auto;
        padding: 36px var(--v3-gutter) 96px; }
      .ep-kicker { color: var(--v3-red); margin: 0 0 12px; }
      .ep-title { margin: 0; color: var(--v3-bone);
        font-family: var(--v3-display); font-weight: 900; line-height: .92;
        text-transform: uppercase; transform: skewX(-6deg);
        font-size: clamp(2.1rem, 6vw, 3.6rem); }
      .ep-sub { margin: 18px 0 0; color: var(--v3-bone-dim);
        font-size: 1.05rem; max-width: 56ch; }

      .ep-quick { display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 1px; background: var(--v3-line); border: 1px solid var(--v3-line);
        margin: 44px 0; }
      .ep-quick-item { background: var(--v3-surface); padding: 22px;
        display: flex; flex-direction: column; gap: 6px; }
      .ep-quick-item .v3-label { color: var(--v3-bone-dim); }
      .ep-quick-item strong { color: var(--v3-bone); }
      .ep-quick-item span { color: var(--v3-bone-dim); }
      .ep-quick-item a { color: var(--v3-cyan); text-decoration: none;
        font-weight: 600; }

      .ep-h2 { color: var(--v3-bone); font-family: var(--v3-display);
        font-weight: 800; text-transform: uppercase; font-size: 1.6rem;
        margin: 0 0 20px; }
      .ep-grid { display: grid; grid-template-columns: repeat(2, 1fr);
        gap: 18px; }
      .ep-store { background: var(--v3-surface); border: 1px solid var(--v3-line);
        padding: 24px; display: flex; flex-direction: column; gap: 10px; }
      .ep-store-tag { color: var(--v3-cyan); }
      .ep-store-name { margin: 0; color: var(--v3-bone); font-size: 1.15rem;
        font-weight: 800; }
      .ep-store-addr { font-style: normal; display: flex;
        flex-direction: column; gap: 2px; color: var(--v3-bone-dim);
        line-height: 1.5; }
      .ep-store-contact { display: flex; flex-direction: column; gap: 4px;
        margin-top: 6px; }
      .ep-store-contact a { color: var(--v3-cyan); text-decoration: none;
        font-weight: 600; font-size: .94rem; }

      .ep-note-sec { margin-top: 40px; }
      .ep-note { margin: 0 0 16px; color: var(--v3-bone-dim); }
      .ep-gemh { font-family: var(--v3-display); letter-spacing: .04em;
        color: var(--v3-bone-dim); }

      @media (max-width: 820px) {
        .ep-quick, .ep-grid { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}
