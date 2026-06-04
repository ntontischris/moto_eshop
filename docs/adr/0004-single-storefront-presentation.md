# Single storefront presentation: v3 `_components` canonical, `src/components` retired

The storefront had **two parallel PDP/PLP implementations**: the legacy `src/components/*` tree (rendered inline by the canonical `[...path]` catch-all) and the newer "v3" `_components/*` tree (rendered by the prefixed `(store)/product/[slug]` and `(store)/category/[slug]` routes). This left the **canonical clean URL serving the old UI** while the **better v3 UI lived on the prefixed alias URLs** — backwards from [ADR 0002](./0002-clean-urls-canonical.md), and the prefixed routes even declared *themselves* canonical in metadata (`buildAlternates(locale, "/product/${slug}")`), directly violating it.

We adopt **one presentation, route-agnostic**, with v3 `_components` as the single source of truth and `src/components` PDP/PLP retired:

- **v3 `_components` wins.** It is the actively-developed, live storefront (Race Control design). The `src/components` PDP/PLP tree is retired after a per-file impact check (it has live non-PDP consumers — verify each before deleting).
- **One canonical route renders; aliases only 301.** Per ADR 0002 the clean URL is canonical, so `[locale]/[...path]` renders the v3 components (resolve path → fetch → render). It already `await`s `searchParams`, so this does not reopen the Next.js 16 Cache Components 404 issue. The prefixed `(store)/product/[slug]` and `(store)/category/[slug]` become **thin 301 redirectors** to the canonical clean path — they render nothing, and their self-canonical metadata is removed.
- **Routes are thin adapters.** The ~250-line inline `ProductView`/`CategoryView` in `[...path]` is extracted into route-agnostic v3 server components.

Considered keeping `src/components` (or both); rejected because v3 is where design and feature work happens and maintaining two storefronts is the root of the "two storefronts" structural debt.
