import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, Lightbulb } from "lucide-react";
import { getTemplate, getTemplateWalkthrough } from "@/lib/campaigns/templates";
import { TemplateForm } from "../../_components/template-form";

export default async function NewCampaignFromTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tpl = getTemplate(id);
  if (!tpl) notFound();
  const walk = getTemplateWalkthrough(id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/admin/campaigns/new"
        className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Πίσω στα templates
      </Link>
      <div className="mb-6 flex items-center gap-3">
        <div className="text-4xl">{tpl.icon}</div>
        <div>
          <h1 className="font-display text-2xl text-text-primary">
            {tpl.label}
          </h1>
          <p className="text-sm text-text-muted">{tpl.description}</p>
        </div>
      </div>

      {walk && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border-default bg-bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <CheckCircle2 className="h-4 w-4 text-brand-teal" />
              Τι θα φτιάξεις
            </h2>
            <ul className="space-y-1 text-xs text-text-secondary">
              {walk.whatYouGet.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-text-muted">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border-default bg-bg-surface p-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <Lightbulb className="h-4 w-4 text-yellow-400" />
              Tips
            </h2>
            <ul className="space-y-1 text-xs text-text-secondary">
              {walk.tips.map((line, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-text-muted">·</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <TemplateForm templateId={tpl.id} />
    </div>
  );
}
