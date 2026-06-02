import { notFound } from "next/navigation";
import { Suspense } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "@/i18n/navigation";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { buildAlternates } from "@/i18n/metadata";
import { getCampaignBySlug } from "@/lib/campaigns/queries";
import { resolveVariant } from "@/lib/campaigns/resolve-variant";
import { decideCampaign } from "@/lib/campaigns/decide";
import { variantBucket } from "@/lib/campaigns/sticky";
import { BlockRenderer } from "@/lib/campaigns/blocks/block-renderer";
import { CampaignTracker } from "@/lib/campaigns/campaign-tracker";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) return { title: "Δεν βρέθηκε" };
  const variant = resolveVariant(campaign);
  return {
    title: variant?.seo.title ?? campaign.name,
    description: variant?.seo.description,
    robots: campaign.noindex ? { index: false, follow: false } : undefined,
    alternates: buildAlternates(locale, `/lp/${slug}`),
  };
}

export default function CampaignPage(props: PageProps) {
  return (
    <Suspense fallback={<CampaignFallback />}>
      <CampaignContent {...props} />
    </Suspense>
  );
}

async function CampaignContent({ params, searchParams }: PageProps) {
  const { locale, slug } = await params;
  const sp = await searchParams;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  const cookieStore = await cookies();
  const existingSid = cookieStore.get("mm_sid")?.value;
  const sid = existingSid ?? crypto.randomUUID();
  const h = await headers();

  const decision = decideCampaign(campaign, {
    now: new Date(),
    signalInput: {
      searchParams: sp,
      userAgent: h.get("user-agent"),
      country: h.get("x-vercel-ip-country"),
      isReturning: Boolean(existingSid),
      bucket: variantBucket(sid, campaign.id),
    },
  });

  if (decision.kind === "expired") {
    redirect({ href: decision.redirectUrl, locale });
  }
  if (decision.kind !== "serve") notFound();

  return (
    <main className="min-h-screen">
      <BlockRenderer blocks={decision.variant.blocks} />
      <CampaignTracker
        campaignId={campaign.id}
        variantId={decision.variant.id}
        sid={sid}
      />
    </main>
  );
}

function CampaignFallback() {
  return <main className="min-h-screen" aria-hidden="true" />;
}
