import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTemplate } from "@/lib/campaigns/templates";
import { TemplateForm } from "../../_components/template-form";

export default async function NewCampaignFromTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tpl = getTemplate(id);
  if (!tpl) notFound();

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
      <TemplateForm templateId={tpl.id} />
    </div>
  );
}
