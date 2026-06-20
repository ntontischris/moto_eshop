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

## Payments

**Checkout session**:
A single attempt to pay for an [Order total] at an external, provider-hosted payment page (Stripe today, Viva at launch). The storefront creates it server-side from the server-authoritative total, redirects the customer to it, and never touches card data. Its outcome is trusted **only** when confirmed by the provider's webhook — never from the browser return. The provider exposes every payment rail (card, Apple/Google Pay, Klarna, Revolut, SEPA, and later IRIS) on the same hosted page; enabling a rail is provider configuration, not new code.
_Avoid_: treating the browser redirect back to the site as proof of payment; embedding card fields in our own pages.

**PaymentProvider**:
The single interface every payment integration implements (mirrors [IErpAdapter] — see ADR 0010). One concrete adapter per processor (Stripe now, Viva at launch). Swapping the launch card-acquirer is re-pointing the adapter, not rewriting checkout.

## Pricing

**Display currency**:
A non-EUR currency (BGN/RON/RSD/ALL) a visitor's prices are *shown* in, converted from EUR at a reference (ECB) rate. Presentation only — the [Order total] is always charged in EUR. Choosing it never changes what the customer pays, only what they read.
_Avoid_: treating it as the settlement/charge currency — we display many currencies but charge one.

**Floor price**:
The server-enforced minimum a [Πιτ]-driven price negotiation may reach for a product. The negotiation assistant can offer discounts down to it but never below; the floor lives server-side and clamps any number the assistant proposes. See ADR 0014.
_Avoid_: letting the assistant emit a final price — it selects within the floor, it does not set it.

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

## Variants & sizing

**Size code**:
The raw ERP size string as stored in `product_stock_locations.size`, zero-padded to three characters (`00M`, `0XL`, `044`). The only size value the ERP and stock understand — cart lines, stock checks and order lines use it verbatim. See ADR 0009.
_Avoid_: showing it to customers raw, or treating the [Display size] as interchangeable with it.

**Display size**:
The customer-facing size, derived from a [Size code] by stripping the leading-zero padding (`00M`→`M`, `044`→`44`). Presentation only — never stored, never sent to the ERP. Codes that don't match the clean rule (combined/range sizes like `LXL`, `39-42`) are shown verbatim.
_Avoid_: using a Display size as an identifier or persisting it.

**Size variant**:
A product that has more than one non-empty [Size code] in stock. A product whose only stock row carries the empty-string size has no variants and shows no size picker.
_Avoid_: "variant" meaning colour — colour is a separate dimension (`cart_items.color`).

## Engagement

**Wishlist**:
The set of products a visitor has saved. Two-tier, mirroring the cart: a [Guest wishlist] for logged-out visitors and a [Persisted wishlist] once authenticated.

**Guest wishlist**:
Products a logged-out visitor saved, kept in browser localStorage keyed by the product [Product id] slug. Merged (union) into the [Persisted wishlist] on login, then cleared — the same lifecycle as the [Guest cart].
_Avoid_: assuming it survives a device or browser change.

**Persisted wishlist**:
A logged-in user's saved products, stored in the `wishlists` table keyed by product UUID and protected by RLS. Survives across devices and sessions.

## Assistant

**Πιτ (Pit)**:
The in-store AI shopping assistant (chat) that answers product questions and can check stock and add to cart on the customer's behalf.
