import { routing } from "./routing";

/**
 * Builds Next.js `alternates` metadata for a given locale + locale-agnostic path.
 * Greek (the default locale) is unprefixed because of `localePrefix: "as-needed"`.
 * Emits a canonical for the active locale and hreflang entries for every locale
 * plus `x-default` (→ Greek). Paths are relative; set `metadataBase` so Next
 * resolves them to absolute hreflang URLs.
 */
export function buildAlternates(locale: string, path: string) {
  const url = (l: string) =>
    l === routing.defaultLocale ? path : `/${l}${path}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = url(l);
  languages["x-default"] = url(routing.defaultLocale);

  return { canonical: url(locale), languages };
}
