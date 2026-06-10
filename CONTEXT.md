# MotoMarket

Headless motorcycle-gear storefront (Next.js) over a Supabase catalog, synced to the Entersoft ERP. This glossary fixes the language we use across catalog, cart, checkout and ERP integration.

## Catalog & ERP

**SKU**:
The Entersoft item code (`products.sku`, the ERP `Code` field, e.g. `ABC-123`). The only identifier the ERP understands — stock and price lookups against Entersoft must use it.
_Avoid_: erpItemCode (that's the ERP-side name for the same value), product code

**Product id**:
The catalog identifier of a product — a Supabase **UUID** or a URL **slug**. Lives only in our storefront; the ERP does not know it. Must be resolved to a [SKU] before any ERP call.
_Avoid_: using "productId" to mean a SKU — they are different namespaces and conflating them silently returns wrong results.

## Cart & checkout

**Guest cart**:
A cart owned by an anonymous visitor, keyed by a session cookie (`carts.session_id`). On login it is merged into the visitor's [User cart] and then deleted.
_Avoid_: anonymous cart, session cart

**User cart**:
A cart owned by an authenticated user (`carts.user_id`). Survives across devices and sessions.

**Order total**:
The amount a customer owes, computed **server-side from the `products` table**, never from a price supplied by the client or stored on the cart. See ADR 0001.
_Avoid_: trusting cart `unit_price` or client-sent price as authoritative.

## Routing

**Clean URL**:
The canonical path-based URL of a product or category — `/{category}/{slug}` or `/{slug}`, no prefix. Served by the `[...path]` catch-all. This is the one true URL; see ADR 0002.
_Avoid_: Option B URL (internal nickname), pretty URL

**Prefixed URL**:
The legacy `/product/{slug}` or `/category/{slug}` form. A 301 alias of the [Clean URL] — never canonical.

## Product images

**Legacy image**:
A product-image URL pointing at the old eshop `www.motomarket-shop.gr` (stored in `products.images`, sourced from the `onlyriders.xml` feed / scrape). The old eshop is the slow origin we want off the critical path; it also 403s the Next.js optimizer's user-agent, so it can only be served through the [Image proxy].
_Avoid_: "the CDN image" — legacy URLs are not on our CDN.

**Mirrored image**:
A copy of a product image, re-encoded to WebP and hosted on our Supabase Storage bucket (stored in `products.images_cdn`). The storefront prefers it over the [Legacy image]; `NULL` means *not yet mirrored* → the product falls back to the [Legacy image] via the [Image proxy]. Mirroring is additive and per-product, so rollout is incremental.
_Avoid_: calling it the "optimized image" — Next still optimizes it on demand; "mirrored" only means we host the source.

**Image proxy**:
The same-origin `/api/image-proxy` route that fetches a [Legacy image] server-side (with a browser user-agent) and re-emits it so the Next optimizer can process it. A stopgap with a latency ceiling; a product stops using it once it has a [Mirrored image].
_Avoid_: treating the proxy as the long-term image source.

## Assistant

**Πιτ (Pit)**:
The in-store AI shopping assistant (chat) that answers product questions and can check stock and add to cart on the customer's behalf.
