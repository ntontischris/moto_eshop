import type { StorefrontState } from "../types";
import { BASE_PROMPT_EL } from "./base";
import { MULTILINGUAL_ADDENDUM } from "./multilingual";

function formatPriceEUR(cents: number, currency: string): string {
  const euros = (cents / 100).toFixed(2).replace(".", ",");
  return `${euros} ${currency}`;
}

function formatBike(bike: StorefrontState["bike"]): string {
  if (!bike) return "καμία";
  const parts = [bike.brand, bike.model, bike.year].filter(Boolean).join(" ");
  const cc = bike.cc ? ` (${bike.cc}cc)` : "";
  return parts ? `${parts}${cc}` : "καμία";
}

function buildInjectedContext(s: StorefrontState): string {
  return [
    "Πλαίσιο τώρα:",
    `Γλώσσα σελίδας: ${s.locale}`,
    `Τρέχουσα σελίδα: ${s.pathname}`,
    `Καλάθι: ${s.cart.itemCount} προϊόντα, σύνολο ${formatPriceEUR(s.cart.totalCents, s.cart.currency)}`,
    `Καταχωρημένη μηχανή: ${formatBike(s.bike)}`,
    `Wishlist: ${s.wishlistCount}`,
    `Στυλ οδήγησης (αν ξέρουμε): ${s.ridingStyle ?? "άγνωστο"}`,
    `Σημειώσεις από προηγούμενες συνομιλίες: ${s.notes ?? "—"}`,
  ].join("\n");
}

export function buildSystemPrompt(state: StorefrontState): string {
  const multilingual = MULTILINGUAL_ADDENDUM.replaceAll(
    "{site_locale}",
    state.locale,
  );
  const context = buildInjectedContext(state);
  return `${BASE_PROMPT_EL}\n\n${multilingual}\n\n${context}`;
}
