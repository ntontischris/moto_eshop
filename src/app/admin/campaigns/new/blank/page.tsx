import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewCampaignForm } from "../../_components/new-campaign-form";

export default function BlankCampaignPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/campaigns/new"
        className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Πίσω στα templates
      </Link>
      <h1 className="font-display text-2xl text-text-primary">
        Άδεια καμπάνια
      </h1>
      <p className="mt-1 text-sm text-text-muted">
        Ξεκίνα από το μηδέν με τον πλήρη editor (12 blocks, A/B variants, AI
        brief).
      </p>
      <NewCampaignForm />
    </div>
  );
}
