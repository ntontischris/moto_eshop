import { createClient } from "@/lib/supabase/server";
import { blocksSchema } from "./blocks/schema";
import type {
  CampaignWithVariants,
  CampaignVariant,
  CampaignStatus,
  ServingMode,
} from "./types";

export async function getCampaignBySlug(
  slug: string,
): Promise<CampaignWithVariants | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      `id, name, slug, status, starts_at, expires_at, redirect_url,
       serving_mode, default_variant_id, noindex,
       campaign_variants!campaign_variants_campaign_id_fkey ( id, campaign_id,
                           name, blocks, weight, targeting_rules, seo )`,
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const variants: CampaignVariant[] = (data.campaign_variants ?? []).map(
    (v) => ({
      id: v.id,
      campaign_id: v.campaign_id,
      name: v.name,
      blocks: blocksSchema.parse(v.blocks),
      weight: v.weight,
      targeting_rules: Array.isArray(v.targeting_rules)
        ? v.targeting_rules
        : [],
      seo: (v.seo ?? {}) as { title?: string; description?: string },
    }),
  );

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    status: data.status as CampaignStatus,
    starts_at: data.starts_at,
    expires_at: data.expires_at,
    redirect_url: data.redirect_url,
    serving_mode: data.serving_mode as ServingMode,
    default_variant_id: data.default_variant_id,
    noindex: data.noindex,
    variants,
  };
}
