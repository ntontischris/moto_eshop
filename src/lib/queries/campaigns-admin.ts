import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CampaignWithVariants,
  CampaignVariant,
  CampaignStatus,
  ServingMode,
} from "@/lib/campaigns/types";
import type { Blocks } from "@/lib/campaigns/blocks/schema";

export interface AdminCampaignListItem {
  id: string;
  name: string;
  slug: string;
  status: CampaignStatus;
  starts_at: string | null;
  expires_at: string | null;
  variantCount: number;
}

export async function getAdminCampaigns(): Promise<AdminCampaignListItem[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      `id, name, slug, status, starts_at, expires_at,
       campaign_variants!campaign_variants_campaign_id_fkey ( id )`,
    )
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    status: c.status as CampaignStatus,
    starts_at: c.starts_at,
    expires_at: c.expires_at,
    variantCount: Array.isArray(c.campaign_variants)
      ? c.campaign_variants.length
      : 0,
  }));
}

/**
 * Full campaign + variants for the admin editor — bypasses RLS (any status)
 * and does NOT strictly parse blocks, so an in-progress draft is still loadable.
 */
export async function getCampaignForEdit(
  id: string,
): Promise<CampaignWithVariants | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("campaigns")
    .select(
      `id, name, slug, status, starts_at, expires_at, redirect_url,
       serving_mode, default_variant_id, noindex,
       campaign_variants!campaign_variants_campaign_id_fkey ( id, campaign_id,
                           name, blocks, weight, targeting_rules, seo )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const variants: CampaignVariant[] = (data.campaign_variants ?? []).map(
    (v) => ({
      id: v.id,
      campaign_id: v.campaign_id,
      name: v.name,
      blocks: (v.blocks ?? []) as Blocks,
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

export interface VariantAnalytics {
  variantId: string;
  name: string;
  views: number;
  ctaClicks: number;
  addToCart: number;
  purchases: number;
  revenue: number;
  conversionRate: number;
}

export interface CampaignAnalytics {
  variants: VariantAnalytics[];
  totals: { views: number; purchases: number; revenue: number };
  leadingVariantId: string | null;
}

export async function getCampaignAnalytics(
  campaignId: string,
): Promise<CampaignAnalytics> {
  const supabase = createAdminClient();
  const [{ data: variants }, { data: events }] = await Promise.all([
    supabase
      .from("campaign_variants")
      .select("id, name")
      .eq("campaign_id", campaignId),
    supabase
      .from("campaign_events")
      .select("variant_id, type, value")
      .eq("campaign_id", campaignId),
  ]);

  const rows: VariantAnalytics[] = (variants ?? []).map((v) => ({
    variantId: v.id,
    name: v.name,
    views: 0,
    ctaClicks: 0,
    addToCart: 0,
    purchases: 0,
    revenue: 0,
    conversionRate: 0,
  }));
  const byId = new Map(rows.map((r) => [r.variantId, r]));

  for (const e of events ?? []) {
    const r = e.variant_id ? byId.get(e.variant_id) : undefined;
    if (!r) continue;
    if (e.type === "view") r.views++;
    else if (e.type === "cta_click") r.ctaClicks++;
    else if (e.type === "add_to_cart") r.addToCart++;
    else if (e.type === "purchase") {
      r.purchases++;
      r.revenue += Number(e.value ?? 0);
    }
  }

  let leadingVariantId: string | null = null;
  let best = -1;
  for (const r of rows) {
    r.conversionRate = r.views > 0 ? r.purchases / r.views : 0;
    if (r.views >= 1 && r.conversionRate > best) {
      best = r.conversionRate;
      leadingVariantId = r.variantId;
    }
  }

  const totals = rows.reduce(
    (t, r) => ({
      views: t.views + r.views,
      purchases: t.purchases + r.purchases,
      revenue: t.revenue + r.revenue,
    }),
    { views: 0, purchases: 0, revenue: 0 },
  );

  return { variants: rows, totals, leadingVariantId };
}
