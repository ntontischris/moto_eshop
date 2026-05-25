"use server";

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { buildCatalogContext, type CatalogContext } from "./catalog-context";
import { repairVariants, type DraftVariant } from "./repair";

type GenerateResult =
  | { success: true; variants: DraftVariant[] }
  | { success: false; error: string };

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = (profile?.role as string) ?? "user";
  if (role !== "admin" && role !== "super_admin") throw new Error("Forbidden");
}

function buildSystemPrompt(catalog: CatalogContext): string {
  const cats = catalog.categories
    .map((c) => `${c.slug} (${c.name})`)
    .join(", ");
  const brands = catalog.brands.map((b) => `${b.slug} (${b.name})`).join(", ");

  return `Είσαι marketing copywriter για το MotoMarket, ελληνικό eshop εξοπλισμού μοτοσικλέτας (κράνη, μπουφάν, γάντια, αξεσουάρ). Ύφος: αγωνιστικό, άμεσο, με ενέργεια pit-lane. Γράφεις στα ελληνικά.

Φτιάχνεις landing pages συναρμολογώντας ΜΟΝΟ από τα παρακάτω blocks (JSON). ΔΕΝ εφευρίσκεις τιμές ή προϊόντα.

BLOCKS:
- hero: { "type":"hero", "headline": string, "subhead"?: string, "mediaUrl": string (βάλε "" αν δεν ξέρεις), "mediaType":"image"|"video", "primaryCta": {"label":string,"href":string}, "secondaryCta"?: {...} }
- productRail: { "type":"productRail", "title"?: string, "source": {"mode":"auto","by":"category"|"brand","value": <slug>,"limit": number } }
- discountBanner: { "type":"discountBanner", "code": string, "text": string }
- countdown: { "type":"countdown", "title"?: string, "targetAt": ISO datetime }
- richText: { "type":"richText", "html": string (απλό HTML: h2,p,ul,li,strong) }
- editorial: { "type":"editorial", "title": string, "body": string, "imageUrl": string, "imagePosition":"left"|"right" }
- faq: { "type":"faq", "title"?: string, "items": [{"q":string,"a":string}] }
- socialProof: { "type":"socialProof", "title"?: string, "stats": [{"value":string,"label":string}] }
- brandStrip: { "type":"brandStrip", "title"?: string, "logos": [{"name":string,"imageUrl":string}] }
- emailCapture: { "type":"emailCapture", "title": string, "subtitle"?: string }
- stickyCta: { "type":"stickyCta", "label": string, "href": string }

ΚΑΝΟΝΕΣ:
- Για productRail χρησιμοποίησε ΜΟΝΟ αυτά τα slugs.
  Κατηγορίες: ${cats || "(καμία)"}.
  Brands: ${brands || "(κανένα)"}.
- Τυπική σειρά: hero → (discountBanner ή countdown) → productRail → socialProof/editorial → faq → emailCapture. Προσαρμόσου στο brief.
- mediaUrl/imageUrl: βάλε "" αν δεν έχεις πραγματικό URL.
- Κάθε variant 4-7 blocks.

ΕΠΕΣΤΡΕΨΕ ΜΟΝΟ έγκυρο JSON αυτής της μορφής (χωρίς markdown, χωρίς σχόλια):
{ "variants": [ { "name": string, "seoTitle"?: string, "blocks": [ ...blocks... ] } ] }`;
}

export async function generateCampaignVariants(input: {
  brief: string;
  variantCount?: number;
}): Promise<GenerateResult> {
  await assertAdmin();

  if (!process.env.ANTHROPIC_API_KEY) {
    return { success: false, error: "Λείπει το ANTHROPIC_API_KEY στο .env" };
  }
  const brief = input.brief?.trim();
  if (!brief) return { success: false, error: "Δώσε ένα brief" };
  const count = Math.min(Math.max(input.variantCount ?? 1, 1), 4);

  const catalog = await buildCatalogContext();
  const client = new Anthropic();

  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      system: [
        {
          type: "text",
          text: buildSystemPrompt(catalog),
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: `Φτιάξε ${count} variant(s) για αυτή την καμπάνια.\n\nBrief: ${brief}`,
        },
      ],
    });

    const text = msg.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("");
    const variants = repairVariants(text, count);
    if (variants.length === 0) {
      return { success: false, error: "Το AI δεν επέστρεψε έγκυρα variants" };
    }
    return { success: true, variants };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Σφάλμα AI",
    };
  }
}
