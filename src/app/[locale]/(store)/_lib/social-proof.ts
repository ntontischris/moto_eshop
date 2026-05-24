/* Real, externally-sourced social proof shown on the homepage.
 * Curated (not live-fetched) — Skroutz/Google block bots. Update periodically.
 *
 * Sources (verified 2026-05-24):
 *  - Google — "Moto Market SA, Καλαμαριά Θεσσαλονίκης": 4.9★ / 3,172 reviews
 *      (brand/physical stores, count as of 2026-05-24 — round DOWN when
 *      updating the label so it is never an overclaim)
 *  - Skroutz — "Motomarket-Shop" (eshop), shop 1002: 5.0★ / 75 reviews,
 *      50+ orders/week, 10+ years on the platform
 *  - Business operating for ~4 decades
 */

export const GOOGLE_REVIEWS_URL =
  "https://www.google.com/maps/search/?api=1&query=Moto+Market+SA+%CE%9A%CE%B1%CE%BB%CE%B1%CE%BC%CE%B1%CF%81%CE%B9%CE%AC+%CE%98%CE%B5%CF%83%CF%83%CE%B1%CE%BB%CE%BF%CE%BD%CE%AF%CE%BA%CE%B7";
export const SKROUTZ_SHOP_URL =
  "https://www.skroutz.gr/shop/1002/Motomarket-Shop";

export interface ProofStat {
  value: string;
  unit: string;
  label: string;
  source: string;
  href?: string;
}

export interface ProofQuote {
  body: string;
  author: string;
  source: string;
  href: string;
}

export const PROOF_STATS: ProofStat[] = [
  {
    value: "4.9",
    unit: "★",
    label: "3.100+ αξιολογήσεις",
    source: "Google",
    href: GOOGLE_REVIEWS_URL,
  },
  {
    value: "5.0",
    unit: "★",
    label: "Άριστο κατάστημα",
    source: "Skroutz",
    href: SKROUTZ_SHOP_URL,
  },
  {
    value: "40+",
    unit: "χρόνια",
    label: "δίπλα στον αναβάτη",
    source: "MotoMarket",
  },
];

export const PROOF_QUOTES: ProofQuote[] = [
  {
    body: "Ήρθα για κράνος για τον γιο μου! Άψογη εξυπηρέτηση από τους υπαλλήλους, πολύ καλές τιμές και ποιότητα.",
    author: "Ε. Ζ.",
    source: "Google",
    href: GOOGLE_REVIEWS_URL,
  },
  {
    body: "Υπέροχος χώρος με άπειρες επιλογές! Άριστη εξυπηρέτηση σε ό,τι κι αν ζητήσαμε.",
    author: "Σ. Λ.",
    source: "Google",
    href: GOOGLE_REVIEWS_URL,
  },
  {
    body: "Ευγενικό προσωπικό με τέλεια εξυπηρέτηση. Δεν είναι τυχαία το κορυφαίο κατάστημα!",
    author: "Τ. Π.",
    source: "Google",
    href: GOOGLE_REVIEWS_URL,
  },
  {
    body: "Οι καλύτεροι και με διαφορά. Τέλεια εξυπηρέτηση από όλους, ευχάριστο περιβάλλον.",
    author: "Σ. Τ.",
    source: "Google",
    href: GOOGLE_REVIEWS_URL,
  },
  {
    body: "Ολοκληρωμένο κατάστημα με εξειδικευμένο προσωπικό, πάντα πρόθυμο να εξυπηρετήσει.",
    author: "Γ. Π.",
    source: "Google",
    href: GOOGLE_REVIEWS_URL,
  },
  {
    body: "Εξαιρετική εξυπηρέτηση. Τα παιδιά πολύ πρόθυμα να σε ενημερώσουν και να βοηθήσουν.",
    author: "Π. Κ.",
    source: "Google",
    href: GOOGLE_REVIEWS_URL,
  },
  {
    body: "Τα πάντα για τον αναβάτη, τέλεια εξυπηρέτηση, πολύ καλές τιμές. Τέλειο.",
    author: "Ν. Δ.",
    source: "Google",
    href: GOOGLE_REVIEWS_URL,
  },
  {
    body: "Δεν έχω λόγια! Τα παιδιά άψογα, η εξυπηρέτηση τέλεια, οι τιμές σούπερ!",
    author: "Γ. Τ.",
    source: "Google",
    href: GOOGLE_REVIEWS_URL,
  },
];
