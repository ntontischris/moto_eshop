import { notFound } from "next/navigation";
import { Suspense } from "react";
import { permanentRedirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import { productRedirectTarget } from "@/app/[locale]/(store)/product/[slug]/redirect-target";

type Props = {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Legacy prefixed alias → permanent redirect to the canonical clean URL
// (ADR 0002). No metadata: a redirector must not declare itself canonical.
// Lives in the bare [locale] group (not the v3 store shell) and renders nothing
// but the redirect. Under Next 16 Cache Components the redirect resolves at
// request time inside the Suspense boundary; the prefixed URL serves no product
// content of its own. (A raw HTTP 308 would require a proxy/middleware redirect
// — tracked as a follow-up; ADR 0002 treats this alias redirect as non-urgent
// insurance since only clean URLs are in the sitemap.)
export default function LegacyProductRedirect(props: Props) {
  return (
    <Suspense>
      <RedirectToCanonical {...props} />
    </Suspense>
  );
}

async function RedirectToCanonical({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  await searchParams;
  const target = await productRedirectTarget(slug, locale);
  if (!target) notFound();
  return permanentRedirect({ href: target, locale });
}
