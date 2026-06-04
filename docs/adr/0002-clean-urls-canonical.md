# Clean path-based URLs are canonical

Products and categories have **one** canonical URL: the clean, path-based form (`/{category}/{slug}` for products, `/{slug}` for categories) served by the `[...path]` catch-all. The prefixed forms (`/product/{slug}`, `/category/{slug}`) are legacy aliases that **301-redirect** to the clean URL. Internal links, the sitemap, and `rel=canonical` tags must all emit the clean form.

We do this because a product reachable at two 200-OK URLs splits its SEO signal (duplicate content). The sitemap already advertises clean URLs to Google, so they are the form already (or soon) indexed; clean URLs are also shorter and standard for serious e-shops. The trap we are correcting: internal navigation links currently point to the prefixed form while the sitemap points to the clean form — links, sitemap and canonical tags were disagreeing.

## Consequences

- Internal links in `(store)/_components` (header, product-card, mega-menu, footer, …) must be changed from prefixed to clean URLs — this is the substantive fix, not the redirect.
- The single product/category rendering (the new `(store)` PDP/PLP built on `_components`) is served at the clean URL; the duplicate legacy rendering is retired (Track D).
- Prefixed routes 301 → clean. This is cheap insurance for existing bookmarks/shares; not urgent for Google, since only clean URLs were ever in the sitemap.
