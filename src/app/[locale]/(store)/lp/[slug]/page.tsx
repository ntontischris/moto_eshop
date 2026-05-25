import { notFound } from "next/navigation";
import { Suspense } from "react";
import { redirect } from "@/i18n/navigation";
import type { Metadata } from "next";
import type { Locale } from "@/i18n/config";
import { buildAlternates } from "@/i18n/metadata";
import { getCampaignBySlug } from "@/lib/campaigns/queries";
import {
  isCampaignVisible,
  isCampaignExpired,
} from "@/lib/campaigns/visibility";
import { resolveVariant } from "@/lib/campaigns/resolve-variant";
import { BlockRenderer } from "@/lib/campaigns/blocks/block-renderer";

interface PageProps {
  params: Promise<{ locale: Locale; slug: string }>;
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

async function CampaignContent({ params }: PageProps) {
  const { locale, slug } = await params;
  const campaign = await getCampaignBySlug(slug);
  if (!campaign) notFound();

  const now = new Date();
  if (isCampaignExpired(campaign, now)) {
    redirect({ href: campaign.redirect_url, locale });
  }
  if (!isCampaignVisible(campaign, now)) notFound();

  const variant = resolveVariant(campaign);
  if (!variant) notFound();

  return (
    <main className="min-h-screen">
      <BlockRenderer blocks={variant.blocks} />
    </main>
  );
}

function CampaignFallback() {
  return <main className="min-h-screen" aria-hidden="true" />;
}
