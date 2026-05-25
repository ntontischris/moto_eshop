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
    title: "Εξυπηρέτηση Πελατών | MotoMarket",
    description:
      "Αποστολές, επιστροφές, τρόποι πληρωμής, εγγύηση, οδηγός μεγεθών και πολιτικές της MotoMarket.",
    alternates: buildAlternates(locale, "/eksypiretisi"),
  };
}

const CARDS = [
  {
    href: "/eksypiretisi/apostoles-epistrofes",
    title: "Αποστολές & Επιστροφές",
    text: "Δωρεάν αποστολή άνω των 50€, επιστροφές σε 14 ημέρες.",
  },
  {
    href: "/eksypiretisi/tropoi-pliromis",
    title: "Τρόποι Πληρωμής",
    text: "Κάρτες, IRIS, PayPal, αντικαταβολή, τραπεζική κατάθεση.",
  },
  {
    href: "/eksypiretisi/eggyisi",
    title: "Εγγύηση",
    text: "Κάλυψη ελαττωμάτων υλικών και κατασκευής.",
  },
  {
    href: "/eksypiretisi/odigos-megethon",
    title: "Οδηγός Μεγεθών",
    text: "Πίνακες μεγεθών για κράνη, ένδυση και αξεσουάρ.",
  },
  {
    href: "/eksypiretisi/kranos-asfaleia",
    title: "Κράνος & Ασφάλεια",
    text: "Πρότυπα, σωστή εφαρμογή και αντικατάσταση κράνους.",
  },
  {
    href: "/eksypiretisi/syntirisi",
    title: "Συντήρηση Εξοπλισμού",
    text: "Φρόντισε το κράνος και τον εξοπλισμό σου σωστά.",
  },
];

export default function CustomerServiceIndex() {
  return (
    <article className="cs-article">
      <h1>Εξυπηρέτηση Πελατών</h1>
      <p className="cs-lead">
        Όλα όσα χρειάζεσαι για μια ασφαλή και ξεκούραστη αγορά — αποστολές,
        πληρωμές, εγγύηση και χρήσιμοι οδηγοί.
      </p>
      <div className="cs-cards">
        {CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="cs-card v3-cut">
            <span className="cs-card-title">{c.title}</span>
            <span className="cs-card-text">{c.text}</span>
            <span className="cs-card-go" aria-hidden="true">
              →
            </span>
          </Link>
        ))}
      </div>

      <style precedence="default">{`
        .cs-cards { display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 14px; margin-top: 8px; }
        .cs-card { position: relative; display: flex; flex-direction: column;
          gap: 6px; padding: 20px; text-decoration: none;
          background: var(--v3-surface); border: 1px solid var(--v3-line);
          transition: border-color .14s ease, transform .14s ease; }
        .cs-card:hover { border-color: var(--v3-red);
          transform: translateY(-2px); }
        .cs-card-title { color: var(--v3-bone); font-weight: 800;
          font-size: 1.02rem; }
        .cs-card-text { color: var(--v3-bone-dim); font-size: .9rem;
          line-height: 1.5; }
        .cs-card-go { color: var(--v3-red); font-weight: 900; margin-top: 4px; }
        @media (max-width: 560px) { .cs-cards { grid-template-columns: 1fr; } }
      `}</style>
    </article>
  );
}
