import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCampaignForEdit } from "@/lib/queries/campaigns-admin";
import { CampaignEditor } from "../../_components/campaign-editor";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getCampaignForEdit(id);
  if (!campaign) notFound();

  return (
    <div>
      <Link
        href="/admin/campaigns"
        className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Πίσω στις καμπάνιες
      </Link>
      <CampaignEditor campaign={campaign} />
    </div>
  );
}
