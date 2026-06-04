import { notFound } from "next/navigation";
import { Suspense } from "react";
import { permanentRedirect } from "@/i18n/navigation";
import type { Locale } from "@/i18n/config";
import { categoryRedirectTarget } from "./redirect-target";

type Props = {
  params: Promise<{ locale: Locale; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

// Legacy prefixed alias → permanent redirect to the canonical clean URL
// (ADR 0002). No metadata: a redirector must not declare itself canonical.
export default function LegacyCategoryRedirect(props: Props) {
  return (
    <Suspense>
      <RedirectToCanonical {...props} />
    </Suspense>
  );
}

async function RedirectToCanonical({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  await searchParams;
  const target = await categoryRedirectTarget(slug, locale);
  if (!target) notFound();
  return permanentRedirect({ href: target, locale });
}
