"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertAdminUser as assertAdmin } from "@/lib/auth/guards";
import { blocksSchema } from "@/lib/campaigns/blocks/schema";
import type { Json } from "@/types/database";

type ActionResult = { success: true } | { success: false; error: string };
type CreateResult =
  | { success: true; id: string }
  | { success: false; error: string };

const CampaignInputSchema = z.object({
  name: z.string().min(1, "Το όνομα είναι υποχρεωτικό"),
  slug: z
    .string()
    .min(1, "Το slug είναι υποχρεωτικό")
    .regex(/^[a-z0-9-]+$/, "Μόνο πεζά, αριθμοί και παύλες"),
  redirect_url: z.string().min(1).default("/"),
  serving_mode: z.enum(["split", "targeting", "mixed"]).default("split"),
  starts_at: z.string().nullable().optional(),
  expires_at: z.string().nullable().optional(),
  noindex: z.boolean().default(true),
  default_variant_id: z.string().uuid().nullable().optional(),
});

const VariantInputSchema = z.object({
  name: z.string().min(1, "Το όνομα variant είναι υποχρεωτικό"),
  blocks: blocksSchema,
  weight: z.coerce.number().int().min(0).default(1),
  targeting_rules: z.array(z.unknown()).default([]),
  seo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
    })
    .default({}),
});

function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Μη έγκυρα δεδομένα";
}

// ─── Campaign ───────────────────────────────────────────────────────

export async function createCampaign(
  input: z.input<typeof CampaignInputSchema>,
): Promise<CreateResult> {
  await assertAdmin();
  const parsed = CampaignInputSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: firstIssue(parsed.error) };

  const supabase = createAdminClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      name: parsed.data.name,
      slug: parsed.data.slug,
      redirect_url: parsed.data.redirect_url,
      serving_mode: parsed.data.serving_mode,
      starts_at: parsed.data.starts_at ?? null,
      expires_at: parsed.data.expires_at ?? null,
      noindex: parsed.data.noindex,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !campaign) {
    return { success: false, error: error?.message ?? "Αποτυχία δημιουργίας" };
  }

  // Seed a first variant and make it the default for deterministic serving.
  const { data: variant } = await supabase
    .from("campaign_variants")
    .insert({
      campaign_id: campaign.id,
      name: "A",
      blocks: [] as unknown as Json,
    })
    .select("id")
    .single();

  if (variant) {
    await supabase
      .from("campaigns")
      .update({ default_variant_id: variant.id })
      .eq("id", campaign.id);
  }

  revalidatePath("/admin/campaigns");
  return { success: true, id: campaign.id };
}

export async function updateCampaign(
  id: string,
  input: z.input<typeof CampaignInputSchema>,
): Promise<ActionResult> {
  await assertAdmin();
  const parsed = CampaignInputSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: firstIssue(parsed.error) };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("campaigns")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      redirect_url: parsed.data.redirect_url,
      serving_mode: parsed.data.serving_mode,
      starts_at: parsed.data.starts_at ?? null,
      expires_at: parsed.data.expires_at ?? null,
      noindex: parsed.data.noindex,
      default_variant_id: parsed.data.default_variant_id ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}/edit`);
  revalidatePath(`/lp/${parsed.data.slug}`);
  return { success: true };
}

export async function deleteCampaign(id: string): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/campaigns");
  return { success: true };
}

// ─── Status transitions ─────────────────────────────────────────────

export async function publishCampaign(id: string): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();

  const { data: variants } = await supabase
    .from("campaign_variants")
    .select("blocks")
    .eq("campaign_id", id);

  if (!variants || variants.length === 0) {
    return { success: false, error: "Χρειάζεται τουλάχιστον ένα variant" };
  }
  for (const v of variants) {
    const ok = blocksSchema.safeParse(v.blocks);
    if (!ok.success) {
      return { success: false, error: "Ένα variant έχει μη έγκυρα blocks" };
    }
  }

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .update({ status: "published", updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("slug")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/campaigns");
  if (campaign) revalidatePath(`/lp/${campaign.slug}`);
  return { success: true };
}

export async function setCampaignStatus(
  id: string,
  status: "draft" | "archived",
): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();
  const { data: campaign, error } = await supabase
    .from("campaigns")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/campaigns");
  if (campaign) revalidatePath(`/lp/${campaign.slug}`);
  return { success: true };
}

// ─── Variants ───────────────────────────────────────────────────────

export async function saveVariant(
  campaignId: string,
  variantId: string | null,
  input: z.input<typeof VariantInputSchema>,
): Promise<CreateResult> {
  await assertAdmin();
  const parsed = VariantInputSchema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: firstIssue(parsed.error) };

  const supabase = createAdminClient();
  const payload = {
    campaign_id: campaignId,
    name: parsed.data.name,
    blocks: parsed.data.blocks as unknown as Json,
    weight: parsed.data.weight,
    targeting_rules: parsed.data.targeting_rules as unknown as Json,
    seo: parsed.data.seo as unknown as Json,
  };

  if (variantId) {
    const { error } = await supabase
      .from("campaign_variants")
      .update(payload)
      .eq("id", variantId);
    if (error) return { success: false, error: error.message };
    revalidatePath(`/admin/campaigns/${campaignId}/edit`);
    return { success: true, id: variantId };
  }

  const { data, error } = await supabase
    .from("campaign_variants")
    .insert(payload)
    .select("id")
    .single();
  if (error || !data) {
    return { success: false, error: error?.message ?? "Αποτυχία αποθήκευσης" };
  }
  revalidatePath(`/admin/campaigns/${campaignId}/edit`);
  return { success: true, id: data.id };
}

export async function deleteVariant(
  campaignId: string,
  variantId: string,
): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("campaign_variants")
    .delete()
    .eq("id", variantId);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/admin/campaigns/${campaignId}/edit`);
  return { success: true };
}

export async function setDefaultVariant(
  campaignId: string,
  variantId: string,
): Promise<ActionResult> {
  await assertAdmin();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("campaigns")
    .update({ default_variant_id: variantId })
    .eq("id", campaignId);
  if (error) return { success: false, error: error.message };
  revalidatePath(`/admin/campaigns/${campaignId}/edit`);
  return { success: true };
}

// ─── Clone ──────────────────────────────────────────────────────────

export async function cloneCampaign(id: string): Promise<CreateResult> {
  await assertAdmin();
  const supabase = createAdminClient();

  const { data: src, error: srcErr } = await supabase
    .from("campaigns")
    .select(
      `name, slug, redirect_url, serving_mode, noindex,
       campaign_variants!campaign_variants_campaign_id_fkey ( name, blocks, weight, targeting_rules, seo )`,
    )
    .eq("id", id)
    .single();

  if (srcErr || !src) {
    return { success: false, error: srcErr?.message ?? "Δεν βρέθηκε" };
  }

  const suffix = Math.random().toString(36).slice(2, 6);
  const { data: clone, error } = await supabase
    .from("campaigns")
    .insert({
      name: `${src.name} (copy)`,
      slug: `${src.slug}-copy-${suffix}`,
      redirect_url: src.redirect_url,
      serving_mode: src.serving_mode,
      noindex: src.noindex,
      status: "draft",
    })
    .select("id")
    .single();

  if (error || !clone) {
    return { success: false, error: error?.message ?? "Αποτυχία κλωνοποίησης" };
  }

  const srcVariants = Array.isArray(src.campaign_variants)
    ? src.campaign_variants
    : [];
  if (srcVariants.length > 0) {
    const { data: inserted } = await supabase
      .from("campaign_variants")
      .insert(
        srcVariants.map((v) => ({
          campaign_id: clone.id,
          name: v.name,
          blocks: v.blocks,
          weight: v.weight,
          targeting_rules: v.targeting_rules,
          seo: v.seo,
        })),
      )
      .select("id");
    if (inserted && inserted[0]) {
      await supabase
        .from("campaigns")
        .update({ default_variant_id: inserted[0].id })
        .eq("id", clone.id);
    }
  }

  revalidatePath("/admin/campaigns");
  return { success: true, id: clone.id };
}

// ─── Product picker (for productRail / comparison blocks) ────────────

export interface PickerProduct {
  id: string;
  name: string;
  image: string | null;
  brand: string;
}

function mapPicker(row: {
  id: string;
  name: string;
  images: unknown;
  brands: unknown;
}): PickerProduct {
  const imgs = (row.images as { url: string; position: number }[]) ?? [];
  const sorted = [...imgs].sort((a, b) => a.position - b.position);
  const brand = row.brands as { name: string } | null;
  return {
    id: row.id,
    name: row.name,
    image: sorted[0]?.url ?? null,
    brand: brand?.name ?? "",
  };
}

export async function searchProductsForPicker(
  query: string,
): Promise<PickerProduct[]> {
  await assertAdmin();
  if (!query || query.trim().length < 2) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, images, brands ( name )")
    .ilike("name", `%${query.trim()}%`)
    .eq("status", "active")
    .limit(10);
  return (data ?? []).map(mapPicker);
}

export async function getPickerProducts(
  ids: string[],
): Promise<PickerProduct[]> {
  await assertAdmin();
  if (ids.length === 0) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("products")
    .select("id, name, images, brands ( name )")
    .in("id", ids);
  return (data ?? []).map(mapPicker);
}

// ─── Create-from-template (8 preset templates) ───────────────────────

export async function createCampaignFromTemplate(input: {
  templateId: string;
  name: string;
  slug: string;
  fields: Record<string, unknown>;
}): Promise<CreateResult> {
  await assertAdmin();
  const { getTemplate } = await import("@/lib/campaigns/templates");
  const tpl = getTemplate(input.templateId);
  if (!tpl) return { success: false, error: "Άγνωστο template" };

  // Validate campaign settings (name/slug rules) via the existing schema.
  const settings = CampaignInputSchema.safeParse({
    name: input.name,
    slug: input.slug,
  });
  if (!settings.success) {
    return { success: false, error: firstIssue(settings.error) };
  }

  // Build + strictly validate the blocks produced by the template.
  const builtBlocks = tpl.build(input.fields);
  const blocks = blocksSchema.safeParse(builtBlocks);
  if (!blocks.success) {
    return {
      success: false,
      error: "Λείπει κάτι ή δεν είναι σωστό στα πεδία",
    };
  }
  if (blocks.data.length === 0) {
    return { success: false, error: "Συμπλήρωσε τα υποχρεωτικά πεδία" };
  }

  const supabase = createAdminClient();

  const { data: campaign, error } = await supabase
    .from("campaigns")
    .insert({
      name: settings.data.name,
      slug: settings.data.slug,
      redirect_url: "/",
      serving_mode: "split",
      noindex: true,
      status: "draft",
    })
    .select("id")
    .single();
  if (error || !campaign) {
    return { success: false, error: error?.message ?? "Αποτυχία δημιουργίας" };
  }

  const { data: variant } = await supabase
    .from("campaign_variants")
    .insert({
      campaign_id: campaign.id,
      name: "A",
      blocks: blocks.data as unknown as Json,
    })
    .select("id")
    .single();

  if (variant) {
    await supabase
      .from("campaigns")
      .update({ default_variant_id: variant.id })
      .eq("id", campaign.id);
  }

  revalidatePath("/admin/campaigns");
  return { success: true, id: campaign.id };
}
