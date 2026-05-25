import { notFound } from "next/navigation";
import { getCampaignForEdit } from "@/lib/queries/campaigns-admin";
import { BlockRenderer } from "@/lib/campaigns/blocks/block-renderer";
import { blockSchema, type Blocks } from "@/lib/campaigns/blocks/schema";

export default async function CampaignPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ v?: string }>;
}) {
  const { id } = await params;
  const { v } = await searchParams;
  const campaign = await getCampaignForEdit(id);
  if (!campaign) notFound();

  const variant =
    campaign.variants.find((x) => x.id === v) ?? campaign.variants[0];
  if (!variant) notFound();

  // Render only blocks that currently validate, so an in-progress draft
  // previews its good blocks instead of failing entirely.
  const raw = variant.blocks as unknown as unknown[];
  const valid: Blocks = raw.flatMap((b) => {
    const r = blockSchema.safeParse(b);
    return r.success ? [r.data] : [];
  });
  const skipped = raw.length - valid.length;

  return (
    <main className="min-h-screen rounded-xl border border-border-default bg-black">
      <div className="bg-bg-elevated px-4 py-2 text-center text-xs text-text-muted">
        Preview — {campaign.name} · {variant.name}
        {skipped > 0 && (
          <span className="ml-2 text-yellow-400">
            ({skipped} block(s) με σφάλματα παραλείφθηκαν)
          </span>
        )}
      </div>
      <BlockRenderer blocks={valid} />
    </main>
  );
}
