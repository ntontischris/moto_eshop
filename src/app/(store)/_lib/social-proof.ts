/* Real, externally-sourced social proof shown on the homepage.
 * Update these figures periodically (they are curated, not live-fetched).
 *
 * Sources (verified 2026-05-23):
 *  - Google — "Moto Market SA, Θεσσαλονίκη": 5.0★ / 2,727 reviews (brand/stores)
 *      via citymaps.gr aggregation of Google Maps reviews
 *  - Skroutz — "Motomarket-Shop" (the eshop), shop 1002: 5.0★ / 75 reviews,
 *      50+ orders/week, 10+ years on the platform
 *  - Business operating for ~4 decades
 */

export interface ProofStat {
  value: string;
  unit: string;
  label: string;
}

export interface ProofQuote {
  body: string;
  author: string;
  source: string;
}

export const PROOF_STATS: ProofStat[] = [
  { value: "5.0", unit: "★", label: "2.700+ αξιολογήσεις στο Google" },
  { value: "5.0", unit: "★", label: "Άριστο κατάστημα στο Skroutz" },
  { value: "40+", unit: "χρόνια", label: "δίπλα στον αναβάτη" },
];

export const PROOF_QUOTES: ProofQuote[] = [
  {
    body: "Ήρθα για κράνος για τον γιο μου! Άψογη εξυπηρέτηση από τους υπαλλήλους. Πολύ καλές τιμές και ποιότητα!",
    author: "Ε. Ζ.",
    source: "Google",
  },
  {
    body: "Υπέροχος χώρος με άπειρες επιλογές! Άριστη εξυπηρέτηση σε ό,τι κι αν ζητήσαμε και σε πολύ καλές τιμές.",
    author: "Σ. Λ.",
    source: "Google",
  },
  {
    body: "Αγορά κράνους, απόλυτα ικανοποιημένος από την εξυπηρέτηση των παιδιών που εργάζονται εκεί.",
    author: "Α. Μ.",
    source: "Google",
  },
];
