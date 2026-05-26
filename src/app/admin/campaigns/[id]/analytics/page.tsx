import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trophy } from "lucide-react";
import {
  getCampaignForEdit,
  getCampaignAnalytics,
} from "@/lib/queries/campaigns-admin";

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export default async function CampaignAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [campaign, analytics] = await Promise.all([
    getCampaignForEdit(id),
    getCampaignAnalytics(id),
  ]);
  if (!campaign) notFound();

  const stat =
    "rounded-xl border border-border-default bg-bg-surface p-4 text-center";

  return (
    <div>
      <Link
        href="/admin/campaigns"
        className="mb-4 inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Πίσω στις καμπάνιες
      </Link>
      <h1 className="font-display text-2xl text-text-primary">
        Στατιστικά — {campaign.name}
      </h1>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className={stat}>
          <p className="font-display text-2xl text-text-primary">
            {analytics.totals.views}
          </p>
          <p className="text-xs text-text-muted">Προβολές</p>
        </div>
        <div className={stat}>
          <p className="font-display text-2xl text-text-primary">
            {analytics.totals.purchases}
          </p>
          <p className="text-xs text-text-muted">Αγορές</p>
        </div>
        <div className={stat}>
          <p className="font-display text-2xl text-text-primary">
            €{analytics.totals.revenue.toFixed(2)}
          </p>
          <p className="text-xs text-text-muted">Έσοδα</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border-default bg-bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default text-left text-text-muted">
              <th className="px-4 py-3 font-medium">Variant</th>
              <th className="px-4 py-3 text-right font-medium">Προβολές</th>
              <th className="px-4 py-3 text-right font-medium">CTA</th>
              <th className="px-4 py-3 text-right font-medium">Καλάθι</th>
              <th className="px-4 py-3 text-right font-medium">Αγορές</th>
              <th className="px-4 py-3 text-right font-medium">Conv.</th>
              <th className="px-4 py-3 text-right font-medium">Έσοδα</th>
            </tr>
          </thead>
          <tbody>
            {analytics.variants.map((v) => (
              <tr
                key={v.variantId}
                className="border-b border-border-default last:border-0"
              >
                <td className="px-4 py-3 font-medium text-text-primary">
                  <span className="flex items-center gap-1">
                    {v.name}
                    {analytics.leadingVariantId === v.variantId &&
                      analytics.totals.views > 0 && (
                        <Trophy
                          className="h-4 w-4 text-yellow-400"
                          aria-label="Leading"
                        />
                      )}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  {v.views}
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  {v.ctaClicks}
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  {v.addToCart}
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  {v.purchases}
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  {pct(v.conversionRate)}
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  €{v.revenue.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-text-muted">
        Το «leading» variant έχει το υψηλότερο conversion rate. Χωρίς έλεγχο
        στατιστικής σημαντικότητας (v1).
      </p>
    </div>
  );
}
