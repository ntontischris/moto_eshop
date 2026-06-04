# Server-authoritative pricing at checkout

The order total is computed **server-side from the `products` table**, never from prices supplied by the client (neither the request body nor the `unit_price` stored on `cart_items`, since that value was itself written from client input at add-to-cart). At order placement we re-fetch each line item's current price by `product_id` and derive subtotal/total from that. Client-supplied prices are display-only.

We do this because the client is attacker-controlled: any price sent from the browser can be tampered (e.g. 200€ → 2€) via dev tools. Re-validating against the database — the only source the customer cannot touch — is the universal e-commerce standard (Shopify, Stripe server-side amounts, OWASP price-tampering). The same principle applies to shipping (already computed server-side via `calculateShipping`) and discounts.

## Consequences

- **Implementation route (Track A, surgical).** The live checkout uses a *client-side* cart (the v3 `useV3()` provider), not the server DB cart — it posts `{ slug, qty }` lines. So the checkout action re-validates each line by resolving `slug → products` (price, stock, `status`), rejects missing/inactive/out-of-stock lines, and derives subtotal/total from the fetched price. The client-supplied price is ignored. This stays within Track A and does not couple to the cart re-architecture.
- **Why not adopt `lib/actions/checkout.ts` now.** That action reads a server DB cart (`getCartId()` + `getCart()`) which the v3 flow never populates; switching to it would require migrating the whole cart to the DB — that is Track D (storefront unification) scope. It becomes the canonical consumer *there*, reusing the same server-side re-validation built in Track A. No work is thrown away.
- `cart_items.unit_price` / client cart price is no longer trusted for totals — it may stay for display, but the order is priced from `products`.
