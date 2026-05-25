import type { CampaignWithVariants, CampaignVariant } from "./types";

/**
 * Foundation resolver: returns the default variant (or the first).
 * Sub-project C extends this with split/targeting by visitor signals.
 */
export function resolveVariant(
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
