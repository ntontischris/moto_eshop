import type { Blocks } from "./blocks/schema";

export type CampaignStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "expired"
  | "archived";

export type ServingMode = "split" | "targeting" | "mixed";

export interface Campaign {
  id: string;
  name: string;
  slug: string;
  status: CampaignStatus;
  starts_at: string | null;
  expires_at: string | null;
  redirect_url: string;
  serving_mode: ServingMode;
  default_variant_id: string | null;
  noindex: boolean;
}

export interface CampaignVariant {
  id: string;
  campaign_id: string;
  name: string;
  blocks: Blocks;
  weight: number;
  targeting_rules: unknown[]; // typed in sub-project C
  seo: { title?: string; description?: string };
}

export interface CampaignWithVariants extends Campaign {
  variants: CampaignVariant[];
}
