import type { CampaignVariant, CampaignWithVariants } from "./types";
import { extractSignals, type SignalInput, type Signals } from "./signals";
import { isCampaignExpired, isCampaignVisible } from "./visibility";
import { resolveVariant } from "./resolve-variant";

export interface CampaignDecisionInput {
  now: Date;
  signalInput: SignalInput;
}

/**
 * The outcome of campaign decisioning, independent of any framework. The route
 * maps each kind onto redirect / notFound / render — but the decision itself
 * carries no Next.js concerns, so it is unit-testable.
 */
export type CampaignDecision =
  | { kind: "expired"; redirectUrl: string }
  | { kind: "hidden" }
  | { kind: "serve"; variant: CampaignVariant; signals: Signals };

/**
 * Single entry point for "given this campaign and request, what do we serve?".
 * Concentrates the expired → visible → signals → variant ordering that used to
 * live inline in the campaign route, behind one interface.
 */
export function decideCampaign(
  campaign: CampaignWithVariants,
  input: CampaignDecisionInput,
): CampaignDecision {
  if (isCampaignExpired(campaign, input.now)) {
    return { kind: "expired", redirectUrl: campaign.redirect_url };
  }
  if (!isCampaignVisible(campaign, input.now)) {
    return { kind: "hidden" };
  }

  const signals = extractSignals(input.signalInput);
  const variant = resolveVariant(campaign, signals);
  if (!variant) return { kind: "hidden" };

  return { kind: "serve", variant, signals };
}
