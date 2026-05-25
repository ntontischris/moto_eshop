import { blockSchema, type Blocks } from "@/lib/campaigns/blocks/schema";

export interface DraftVariant {
  name: string;
  seoTitle?: string;
  blocks: Blocks;
}

/** Pull a JSON object out of a model reply that may be fenced or chatty. */
export function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}

/**
 * Validate model output into publishable draft variants. Every block is checked
 * against the Zod blockSchema; invalid blocks are dropped, variants with no
 * valid blocks are skipped. The AI assembles, this guarantees correctness.
 */
export function repairVariants(text: string, max = 4): DraftVariant[] {
  const parsed = extractJson(text);
  if (!parsed || typeof parsed !== "object") return [];
  const arr = (parsed as { variants?: unknown }).variants;
  if (!Array.isArray(arr)) return [];

  const out: DraftVariant[] = [];
  for (const v of arr) {
    if (!v || typeof v !== "object") continue;
    const rec = v as Record<string, unknown>;
    const blocksRaw = Array.isArray(rec.blocks) ? rec.blocks : [];
    const blocks: Blocks = blocksRaw.flatMap((b) => {
      const r = blockSchema.safeParse(b);
      return r.success ? [r.data] : [];
    });
    if (blocks.length === 0) continue;
    out.push({
      name:
        typeof rec.name === "string" && rec.name
          ? rec.name
          : `Variant ${out.length + 1}`,
      seoTitle: typeof rec.seoTitle === "string" ? rec.seoTitle : undefined,
      blocks,
    });
    if (out.length >= max) break;
  }
  return out;
}
