import type { CampaignWithVariants, CampaignVariant } from "./types";
import type { Signals } from "./signals";
import { parseRules, matchesRules } from "./targeting";

function defaultVariant(
  campaign: CampaignWithVariants,
): CampaignVariant | null {
  if (campaign.variants.length === 0) return null;
  if (campaign.default_variant_id) {
    const found = campaign.variants.find(
      (v) => v.id === campaign.default_variant_id,
    );
    if (found) return found;
  }
  return campaign.variants[0];
}

function weightedPick(
  variants: CampaignVariant[],
  bucket: number,
): CampaignVariant | null {
  const total = variants.reduce((s, v) => s + Math.max(0, v.weight), 0);
  if (total <= 0) return variants[0] ?? null;
  const target = bucket * total;
  let acc = 0;
  for (const v of variants) {
    acc += Math.max(0, v.weight);
    if (target < acc) return v;
  }
  return variants[variants.length - 1] ?? null;
}

/**
 * Pick a variant. Without signals (e.g. metadata generation) returns the
 * default/first. With signals, applies serving_mode: targeting rules first,
 * then weighted split (sticky via bucket), then default.
 */
export function resolveVariant(
  campaign: CampaignWithVariants,
  signals?: Signals,
): CampaignVariant | null {
  const { variants } = campaign;
  if (variants.length === 0) return null;
  if (!signals) return defaultVariant(campaign);

  const mode = campaign.serving_mode;

  if (mode === "targeting" || mode === "mixed") {
    for (const v of variants) {
      if (matchesRules(parseRules(v.targeting_rules), signals)) return v;
    }
  }

  if (mode === "split" || mode === "mixed") {
    const picked = weightedPick(variants, signals.bucket);
    if (picked) return picked;
  }

  return defaultVariant(campaign);
}
