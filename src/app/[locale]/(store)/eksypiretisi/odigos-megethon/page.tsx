/* eslint-disable @next/next/no-img-element -- external size-chart images mirrored from the legacy shop; not part of the optimized asset pipeline yet */
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
    title: "Οδηγός Μεγεθών | MotoMarket",
    description:
      "Πίνακες μεγεθών για κράνη, ένδυση και αξεσουάρ — βρες το σωστό μέγεθος πριν την αγορά.",
    alternates: buildAlternates(locale, "/eksypiretisi/odigos-megethon"),
  };
}

const SHOP = "https://www.motomarket-shop.gr/assets/site/content";

const CHARTS = [
  { label: "Κράνη", src: `${SHOP}/Helmet-Size-Guide.jpg` },
  { label: "Nordcode / Nordcap", src: `${SHOP}/nordcap_size_guide.jpg` },
  { label: "Rev'It — Ανδρικά", src: `${SHOP}/revit_men_size_guide.jpg` },
  { label: "Rev'It — Γυναικεία", src: `${SHOP}/revit_lady_size_guide.jpg` },
  { label: "Tucano Urbano", src: `${SHOP}/Tucano_Urbano_size_guide.jpg` },
  {
    label: "Tucano Urbano — Γυναικεία",
    src: `${SHOP}/tucano_lady_size_guide.jpg`,
  },
];

export default function SizeGuidePage() {
  return (
    <article className="cs-article cs-article--wide">
      <h1>Οδηγός Μεγεθών</h1>
      <p className="cs-lead">
        Βρες το σωστό μέγεθος πριν παραγγείλεις. Παρακάτω θα βρεις τους πίνακες
        μεγεθών ανά κατηγορία και brand.
      </p>

      <h2>Πώς να μετρήσεις</h2>
      <ul>
        <li>
          <strong>Κράνος:</strong> μέτρησε την περίμετρο του κεφαλιού ~1 εκ.
          πάνω από τα φρύδια, στο πιο φαρδύ σημείο.
        </li>
        <li>
          <strong>Μπουφάν / μπλούζα:</strong> μέτρησε την περίμετρο στήθους, στο
          πιο φαρδύ σημείο, με τα χέρια χαλαρά.
        </li>
        <li>
          <strong>Παντελόνι:</strong> μέτρησε περίμετρο μέσης και ισχίου.
        </li>
        <li>
          <strong>Γάντια:</strong> μέτρησε την περίμετρο της παλάμης (χωρίς τον
          αντίχειρα).
        </li>
      </ul>

      <h2>Πίνακες μεγεθών</h2>
      <div className="sg-grid">
        {CHARTS.map((c) => (
          <figure key={c.src} className="sg-card">
            <img
              src={c.src}
              alt={`Πίνακας μεγεθών: ${c.label}`}
              loading="lazy"
            />
            <figcaption>{c.label}</figcaption>
          </figure>
        ))}
      </div>

      <p className="cs-note">
        Αν έχεις αμφιβολία για το μέγεθος, επικοινώνησε μαζί μας — το αλλάζουμε
        εύκολα σε κράνη, μπουφάν, γάντια και μπότες.
      </p>

      <style precedence="default">{`
        .cs-article--wide { max-width: 920px; }
        .sg-grid { display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 16px; margin: 8px 0 20px; }
        .sg-card { margin: 0; border: 1px solid var(--v3-line);
          background: var(--v3-surface); }
        .sg-card img { display: block; width: 100%; height: auto;
          background: #fff; }
        .sg-card figcaption { padding: 10px 14px; color: var(--v3-bone);
          font-weight: 700; font-size: .9rem; border-top: 1px solid var(--v3-line); }
        @media (max-width: 720px) { .sg-grid { grid-template-columns: 1fr; } }
      `}</style>
    </article>
  );
}
