import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewCampaignForm } from "../_components/new-campaign-form";

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-xl">
      <Link
        href="/admin/campaigns"
        className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Πίσω στις καμπάνιες
      </Link>
      <h1 className="font-display text-2xl text-text-primary">Νέα Καμπάνια</h1>
      <p className="mt-1 text-sm text-text-muted">
        Δώσε όνομα και URL slug. Θα προστεθεί ένα πρώτο κενό variant που μπορείς
        να επεξεργαστείς αμέσως μετά.
      </p>
      <NewCampaignForm />
    </div>
  );
}
