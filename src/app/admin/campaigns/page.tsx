import Link from "next/link";
import { Plus, Pencil, ExternalLink, BarChart3 } from "lucide-react";
import { getAdminCampaigns } from "@/lib/queries/campaigns-admin";
import { CampaignRowActions } from "./_components/campaign-row-actions";

const STATUS_BADGE: Record<string, string> = {
  draft: "bg-yellow-500/20 text-yellow-400",
  scheduled: "bg-blue-500/20 text-blue-400",
  published: "bg-green-500/20 text-green-400",
  expired: "bg-gray-500/20 text-gray-400",
  archived: "bg-gray-500/20 text-gray-400",
};

function fmtDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("el-GR");
}

export default async function AdminCampaignsPage() {
  const campaigns = await getAdminCampaigns();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-text-primary">Καμπάνιες</h1>
          <p className="mt-1 text-sm text-text-muted">
            {campaigns.length} landing pages
          </p>
        </div>
        <Link
          href="/admin/campaigns/new"
          className="flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal-hover"
        >
          <Plus className="h-4 w-4" />
          Νέα Καμπάνια
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border-default bg-bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default text-left text-text-muted">
              <th className="px-4 py-3 font-medium">Καμπάνια</th>
              <th className="px-4 py-3 font-medium">Κατάσταση</th>
              <th className="px-4 py-3 text-center font-medium">Variants</th>
              <th className="px-4 py-3 font-medium">Λήξη</th>
              <th className="px-4 py-3 text-right font-medium">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr
                key={c.id}
                className="border-b border-border-default last:border-0"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-text-primary">{c.name}</p>
                  <p className="flex items-center gap-1 text-xs text-text-muted">
                    /lp/{c.slug}
                    {c.status === "published" && (
                      <a
                        href={`/lp/${c.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-brand-teal"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[c.status] ?? ""}`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-text-secondary">
                  {c.variantCount}
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {fmtDate(c.expires_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/campaigns/${c.id}/analytics`}
                      className="rounded p-1 text-text-muted transition-colors hover:bg-bg-elevated hover:text-brand-teal"
                      aria-label="Στατιστικά"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Link>
                    <Link
                      href={`/admin/campaigns/${c.id}/edit`}
                      className="rounded p-1 text-text-muted transition-colors hover:bg-bg-elevated hover:text-brand-teal"
                      aria-label="Επεξεργασία"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <CampaignRowActions id={c.id} status={c.status} />
                  </div>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  Καμία καμπάνια ακόμη
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
