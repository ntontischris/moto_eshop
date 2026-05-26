import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TEMPLATES } from "@/lib/campaigns/templates";

export default function NewCampaignGalleryPage() {
  return (
    <div>
      <Link
        href="/admin/campaigns"
        className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Πίσω στις καμπάνιες
      </Link>
      <h1 className="font-display text-2xl text-text-primary">Νέα Καμπάνια</h1>
      <p className="mt-1 text-sm text-text-muted">
        Διάλεξε ένα template. Συμπληρώνεις λίγα πεδία και η σελίδα είναι live.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TEMPLATES.map((t) => (
          <Link
            key={t.id}
            href={`/admin/campaigns/new/${t.id}`}
            className="flex flex-col gap-2 rounded-xl border border-border-default bg-bg-surface p-5 transition-colors hover:border-brand-teal hover:bg-bg-elevated"
          >
            <div className="text-4xl">{t.icon}</div>
            <h3 className="font-display text-base text-text-primary">
              {t.label}
            </h3>
            <p className="text-xs text-text-muted">{t.description}</p>
            <span className="mt-auto flex items-center gap-1 text-xs font-medium text-brand-teal">
              Διάλεξε <ArrowRight className="h-3 w-3" />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-8 border-t border-border-default pt-4">
        <Link
          href="/admin/campaigns/new/blank"
          className="text-xs text-text-muted hover:text-text-primary"
        >
          → Ή ξεκίνα από <span className="underline">άδεια καμπάνια</span> (για
          προχωρημένο editor)
        </Link>
      </div>
    </div>
  );
}
