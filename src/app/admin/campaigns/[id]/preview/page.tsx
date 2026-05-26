import { notFound } from "next/navigation";
import { getCampaignForEdit } from "@/lib/queries/campaigns-admin";
import { BlockRenderer } from "@/lib/campaigns/blocks/block-renderer";
import { blockSchema, type Blocks } from "@/lib/campaigns/blocks/schema";
import { PreviewToolbar } from "../../_components/preview-toolbar";

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

  const raw = variant.blocks as unknown as unknown[];
  const valid: Blocks = raw.flatMap((b) => {
    const r = blockSchema.safeParse(b);
    return r.success ? [r.data] : [];
  });
  const skipped = raw.length - valid.length;

  return (
    <main className="min-h-screen overflow-hidden rounded-xl border border-border-default bg-black">
      <PreviewToolbar
        campaignId={campaign.id}
        campaignName={campaign.name}
        variantName={variant.name}
        status={campaign.status}
        slug={campaign.slug}
        skipped={skipped}
      />
      <BlockRenderer blocks={valid} />
    </main>
  );
}
