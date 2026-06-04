# Track A — Commerce Bugfixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the two real commerce bugs in the **live (v3) storefront**: server-authoritative checkout pricing (price-tampering) and the AI stock-check id→SKU resolution.

**Architecture:** The live storefront is the v3 `_components` tree with a **client-side localStorage cart** (`v3-provider.tsx`) and the server action `app/[locale]/(store)/checkout/actions.ts`. We do **not** migrate the cart (that is Track D). Instead we enforce *never trust the client* at the server boundary: the checkout action re-prices every line from the `products` table (ADR 0001), and the AI `checkStock` tool resolves the catalog id (UUID/slug) → `products.sku` before calling the ERP. The price/validation logic is extracted into a **pure, fully-unit-tested module** so the security guarantee doesn't depend on brittle Supabase mocking.

**Tech Stack:** Next.js 16 (App Router, server actions), TypeScript, Zod v4 (`zod/v4`), Supabase (`@/lib/supabase/{server,admin}`), Vitest (node env, `globals: false`, co-located `*.test.ts`), pnpm.

**Scope (locked during grilling):**
- ✅ Bug 1 — checkout price-tampering (Option A: surgical server re-validation). Real in live flow.
- ✅ Bug 3 — `checkStock` id→SKU resolution. Real, AI/Πιτ path.
- ❌ Bug 2 — `mergeGuestCartOnLogin` wiring. **Removed** — it targets the legacy DB-cart the v3 storefront never uses (v3 cart is localStorage, survives login). Folded into Track D (server-backed cart unification).

**Conventions to follow (verified in repo):**
- Tests: `import { describe, it, expect, vi, beforeEach } from "vitest"` (no globals). Module mocks via `vi.mock("@/...", () => ({ ... }))`. Co-locate `foo.test.ts` next to `foo.ts`. Vitest `include: ["src/**/*.test.ts"]`.
- Errors: typed result objects, never throw across the boundary; user-facing messages in Greek.
- Zod at boundaries; no `any` without reason.

---

## File Structure

| File | Responsibility | Change |
|---|---|---|
| `src/lib/checkout/pricing.ts` | **Pure** order-pricing/validation: resolve lines against product rows, reject unknown/inactive/out-of-stock, derive subtotal/shipping/total from DB price. No I/O. | **Create** |
| `src/lib/checkout/pricing.test.ts` | Unit tests for `priceOrder` (the security logic — 100% coverage). | **Create** |
| `src/app/[locale]/(store)/checkout/actions.ts` | Server action: validate input (Zod), fetch product rows, call `priceOrder`, insert order + items with server prices. | **Modify** (replace body) |
| `src/app/[locale]/(store)/checkout/actions.test.ts` | Boundary test: tampered price ignored, out-of-stock rejected (Supabase admin stubbed). | **Create** |
| `src/lib/chat/tools/check-stock.ts` | Resolve catalog id (UUID/slug) → `products.sku`, then call ERP; "unavailable" when no SKU. | **Modify** |
| `src/lib/chat/tools/check-stock.test.ts` | Update existing tests to mock the SKU lookup; add "no SKU → unavailable". | **Modify** |

---

## Phase 0: Land PR #13, branch from clean main

PR #13 = branch `refactor/deepening-phase1` (main `a8f323d` + 3 commits). Track A branches off main **after** PR #13 is merged.

- [ ] **Step 0.1: Review PR #13**

Run the GitNexus PR review (per CLAUDE.md mandate) or `/code-review`:
Use the `gitnexus-pr-review` skill against `refactor/deepening-phase1`. Report blast radius + any HIGH/CRITICAL risk to the user.

- [ ] **Step 0.2: Verify build + tests green on the branch**

Run: `pnpm test`
Expected: all pass (currently includes `src/lib/chat/tools/check-stock.test.ts`).
Run: `pnpm build`
Expected: build succeeds.

- [ ] **Step 0.3: Merge to main (ALWAYS-ASK gate)**

Merging to main is a destructive/structural action — **ask the user for explicit approval first** (per project-orchestration always-ask). Only after approval, merge PR #13 and confirm main is clean.

- [ ] **Step 0.4: Create the Track A branch**

```bash
git checkout main
git pull
git checkout -b feat/track-a-commerce-bugfixes
```

---

## Task 1: Pure order-pricing module (Bug 1 core)

**Files:**
- Create: `src/lib/checkout/pricing.ts`
- Test: `src/lib/checkout/pricing.test.ts`

This module is where the price-tampering defense lives. The input type carries **no price** — the function structurally cannot trust a client price; `unitPrice` always comes from the product row.

- [ ] **Step 1.1: Write the failing test**

Create `src/lib/checkout/pricing.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { priceOrder, type ProductPricing } from "./pricing";

const helmet: ProductPricing = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "shoei-nxr2",
  price: 200,
  stock: 5,
  status: "active",
};

describe("priceOrder", () => {
  it("prices each line from the product row, ignoring any client value", () => {
    const r = priceOrder([{ slug: "shoei-nxr2", qty: 2 }], [helmet]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lines[0].unitPrice).toBe(200);
    expect(r.lines[0].lineTotal).toBe(400);
    expect(r.subtotal).toBe(400);
    expect(r.shipping).toBe(0); // over free-shipping threshold
    expect(r.total).toBe(400);
  });

  it("applies the flat shipping estimate under the free-shipping threshold", () => {
    const cheap: ProductPricing = { ...helmet, price: 10 };
    const r = priceOrder([{ slug: "shoei-nxr2", qty: 1 }], [cheap]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.subtotal).toBe(10);
    expect(r.shipping).toBe(3.5);
    expect(r.total).toBe(13.5);
  });

  it("rejects an empty cart", () => {
    const r = priceOrder([], [helmet]);
    expect(r.ok).toBe(false);
  });

  it("rejects an unknown slug", () => {
    const r = priceOrder([{ slug: "ghost", qty: 1 }], [helmet]);
    expect(r.ok).toBe(false);
  });

  it("rejects an inactive product", () => {
    const r = priceOrder(
      [{ slug: "shoei-nxr2", qty: 1 }],
      [{ ...helmet, status: "draft" }],
    );
    expect(r.ok).toBe(false);
  });

  it("rejects quantity above available stock", () => {
    const r = priceOrder([{ slug: "shoei-nxr2", qty: 6 }], [helmet]);
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `pnpm test src/lib/checkout/pricing.test.ts`
Expected: FAIL — cannot resolve `./pricing`.

- [ ] **Step 1.3: Write minimal implementation**

Create `src/lib/checkout/pricing.ts`:

```ts
import {
  FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_ESTIMATE,
} from "@/lib/cart/utils";

export interface OrderLineInput {
  slug: string;
  qty: number;
}

export interface ProductPricing {
  id: string;
  slug: string;
  price: number;
  stock: number;
  status: string;
}

export interface PricedLine {
  productId: string;
  slug: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export type PriceOrderResult =
  | {
      ok: true;
      lines: PricedLine[];
      subtotal: number;
      shipping: number;
      total: number;
    }
  | { ok: false; error: string };

/**
 * Re-prices an order from authoritative product rows. The input carries no
 * price, so a client-supplied amount can never be trusted. See ADR 0001.
 */
export function priceOrder(
  items: OrderLineInput[],
  products: ProductPricing[],
): PriceOrderResult {
  if (items.length === 0) {
    return { ok: false, error: "Το καλάθι είναι άδειο." };
  }

  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const lines: PricedLine[] = [];

  for (const item of items) {
    const product = bySlug.get(item.slug);
    if (!product || product.status !== "active") {
      return {
        ok: false,
        error: `Το προϊόν "${item.slug}" δεν είναι διαθέσιμο.`,
      };
    }
    if (!Number.isInteger(item.qty) || item.qty < 1) {
      return { ok: false, error: `Μη έγκυρη ποσότητα για "${item.slug}".` };
    }
    if (product.stock < item.qty) {
      return { ok: false, error: `Ανεπαρκές απόθεμα για "${item.slug}".` };
    }
    lines.push({
      productId: product.id,
      slug: product.slug,
      quantity: item.qty,
      unitPrice: product.price,
      lineTotal: product.price * item.qty,
    });
  }

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const shipping =
    subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DEFAULT_SHIPPING_ESTIMATE;
  const total = subtotal + shipping;

  return { ok: true, lines, subtotal, shipping, total };
}
```

- [ ] **Step 1.4: Run test to verify it passes**

Run: `pnpm test src/lib/checkout/pricing.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 1.5: Commit**

```bash
git add src/lib/checkout/pricing.ts src/lib/checkout/pricing.test.ts
git commit -m "feat(checkout): add pure server-authoritative order pricing

Re-prices orders from the products table; input carries no client price.
Implements ADR 0001."
```

---

## Task 2: Wire the checkout action to server pricing (Bug 1 boundary)

**Files:**
- Modify: `src/app/[locale]/(store)/checkout/actions.ts` (replace whole file)
- Test: `src/app/[locale]/(store)/checkout/actions.test.ts`

> **GitNexus mandate:** before editing, run `gitnexus_impact({target: "placeOrder", direction: "upstream"})` and report the blast radius. Expected callers: the v3 checkout page only. Warn the user on HIGH/CRITICAL.

The page (`checkout/page.tsx`) keeps sending `{ slug, name, qty, price }` lines — we change only the server: `name`/`price` become display-only and are ignored for pricing.

- [ ] **Step 2.1: Write the failing test**

Create `src/app/[locale]/(store)/checkout/actions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));
import { createAdminClient } from "@/lib/supabase/admin";
import { placeOrder, type CheckoutInput } from "./actions";

interface Capture {
  order?: Record<string, unknown>;
  orderItems?: Array<Record<string, unknown>>;
}

function stubAdmin(opts: {
  products: Array<{
    id: string;
    slug: string;
    price: number;
    stock: number;
    status: string;
  }>;
  capture: Capture;
}) {
  return {
    from(table: string) {
      if (table === "products") {
        return {
          select: () => ({
            in: async () => ({ data: opts.products, error: null }),
          }),
        };
      }
      if (table === "orders") {
        return {
          insert: (row: Record<string, unknown>) => {
            opts.capture.order = row;
            return {
              select: () => ({
                single: async () => ({ data: { id: "order-1" }, error: null }),
              }),
            };
          },
        };
      }
      if (table === "order_items") {
        return {
          insert: async (rows: Array<Record<string, unknown>>) => {
            opts.capture.orderItems = rows;
            return { error: null };
          },
        };
      }
      throw new Error(`unexpected table ${table}`);
    },
  };
}

const baseInput = (
  items: CheckoutInput["items"],
): CheckoutInput => ({
  email: "a@b.gr",
  phone: "2100000000",
  fullName: "Test User",
  address: "Odos 1",
  city: "Athens",
  postal: "12345",
  region: "Attica",
  notes: "",
  payment: "cod",
  items,
});

describe("placeOrder (server-authoritative pricing)", () => {
  beforeEach(() => vi.mocked(createAdminClient).mockReset());

  it("ignores a tampered client price and uses the DB price", async () => {
    const capture: Capture = {};
    vi.mocked(createAdminClient).mockReturnValue(
      stubAdmin({
        products: [
          {
            id: "p-1",
            slug: "helmet",
            price: 200,
            stock: 5,
            status: "active",
          },
        ],
        capture,
      }) as never,
    );

    const res = await placeOrder(
      baseInput([{ slug: "helmet", name: "Helmet", qty: 1, price: 2 }]),
    );

    expect(res.ok).toBe(true);
    expect(capture.orderItems?.[0].unit_price).toBe(200);
    expect(capture.order?.total).toBe(200);
  });

  it("rejects an out-of-stock line without creating an order", async () => {
    const capture: Capture = {};
    vi.mocked(createAdminClient).mockReturnValue(
      stubAdmin({
        products: [
          { id: "p-1", slug: "helmet", price: 200, stock: 0, status: "active" },
        ],
        capture,
      }) as never,
    );

    const res = await placeOrder(
      baseInput([{ slug: "helmet", name: "Helmet", qty: 1, price: 200 }]),
    );

    expect(res.ok).toBe(false);
    expect(capture.order).toBeUndefined();
  });

  it("rejects invalid input (bad postal code)", async () => {
    const res = await placeOrder({
      ...baseInput([{ slug: "helmet", name: "H", qty: 1, price: 1 }]),
      postal: "12",
    });
    expect(res.ok).toBe(false);
  });
});
```

- [ ] **Step 2.2: Run test to verify it fails**

Run: `pnpm test "src/app/[locale]/(store)/checkout/actions.test.ts"`
Expected: FAIL — current `placeOrder` trusts `it.price` (tampered test gets `unit_price` 2, not 200) and never checks stock.

- [ ] **Step 2.3: Replace the action implementation**

Replace the entire contents of `src/app/[locale]/(store)/checkout/actions.ts` with:

```ts
"use server";

import { z } from "zod/v4";
import { createAdminClient } from "@/lib/supabase/admin";
import { priceOrder } from "@/lib/checkout/pricing";
import type { Json } from "@/types/database";

export interface CheckoutItem {
  slug: string;
  name: string;
  qty: number;
  price: number; // display-only; the server re-prices from the products table
}

export interface CheckoutInput {
  email: string;
  phone: string;
  fullName: string;
  address: string;
  city: string;
  postal: string;
  region: string;
  notes: string;
  payment: "cod"; // card (Viva) added later
  items: CheckoutItem[];
}

export interface PlaceOrderResult {
  ok: boolean;
  orderNumber?: string;
  error?: string;
}

const CheckoutSchema = z.object({
  email: z.email("Μη έγκυρο email."),
  phone: z.string().trim().min(1, "Συμπλήρωσε τηλέφωνο."),
  fullName: z.string().trim().min(1, "Συμπλήρωσε ονοματεπώνυμο."),
  address: z.string().trim().min(1, "Συμπλήρωσε διεύθυνση."),
  city: z.string().trim().min(1, "Συμπλήρωσε πόλη."),
  postal: z.string().trim().regex(/^\d{5}$/, "Μη έγκυρος Τ.Κ. (5 ψηφία)."),
  region: z.string().trim().default(""),
  notes: z.string().trim().default(""),
  payment: z.literal("cod", { error: "Μη διαθέσιμος τρόπος πληρωμής." }),
  items: z
    .array(z.object({ slug: z.string().min(1), qty: z.number().int().min(1) }))
    .min(1, "Το καλάθι είναι άδειο."),
});

export async function placeOrder(
  input: CheckoutInput,
): Promise<PlaceOrderResult> {
  const parsed = CheckoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Σφάλμα επικύρωσης.",
    };
  }
  const data = parsed.data;

  // Admin client: guest (COD) orders are inserted without an auth session, so
  // RLS is intentionally bypassed here. Amounts are derived server-side via
  // priceOrder (below), so the client cannot tamper with them. See ADR 0001.
  const supabase = createAdminClient();

  const slugs = data.items.map((i) => i.slug);
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, slug, price, stock, status")
    .in("slug", slugs);

  if (prodErr) {
    return { ok: false, error: "Αποτυχία επαλήθευσης προϊόντων." };
  }

  const priced = priceOrder(
    data.items.map((i) => ({ slug: i.slug, qty: i.qty })),
    products ?? [],
  );
  if (!priced.ok) {
    return { ok: false, error: priced.error };
  }

  const orderNumber = `MM-${Date.now().toString(36).toUpperCase()}`;
  const addressJson = {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    postal: data.postal,
    region: data.region,
    notes: data.notes,
    payment: "cod",
  } as unknown as Json;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      billing_address: addressJson,
      shipping_address: addressJson,
      subtotal: priced.subtotal,
      shipping_cost: priced.shipping,
      total: priced.total,
      discount: 0,
      user_id: null,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return { ok: false, error: "Αποτυχία καταχώρησης παραγγελίας." };
  }

  const rows = priced.lines.map((l) => ({
    order_id: order.id,
    product_id: l.productId,
    quantity: l.quantity,
    unit_price: l.unitPrice,
    total: l.lineTotal,
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(rows);
  if (itemsErr) {
    return {
      ok: false,
      error: "Η παραγγελία καταχωρήθηκε μερικώς. Επικοινώνησε μαζί μας.",
    };
  }

  return { ok: true, orderNumber };
}
```

- [ ] **Step 2.4: Run test to verify it passes**

Run: `pnpm test "src/app/[locale]/(store)/checkout/actions.test.ts"`
Expected: PASS (3 tests).

- [ ] **Step 2.5: Verify no type/lint regressions**

Run: `pnpm build` (or `pnpm lint` + `pnpm typecheck` if defined in package.json)
Expected: success. The page still imports `placeOrder` + `CheckoutInput` from `./actions` — both still exported with the same shape.

- [ ] **Step 2.6: Run GitNexus detect-changes before commit**

Run `gitnexus_detect_changes()` and confirm only `placeOrder` / checkout symbols changed. Report scope.

- [ ] **Step 2.7: Commit**

```bash
git add "src/app/[locale]/(store)/checkout/actions.ts" "src/app/[locale]/(store)/checkout/actions.test.ts"
git commit -m "fix(checkout): re-price orders server-side, reject client price tampering

Resolve lines by slug against products, ignore client price, validate
stock/active status, derive totals from DB. Closes price-tampering. ADR 0001."
```

---

## Task 3: Resolve catalog id → SKU in the AI stock tool (Bug 3)

**Files:**
- Modify: `src/lib/chat/tools/check-stock.ts`
- Modify: `src/lib/chat/tools/check-stock.test.ts`

> **GitNexus mandate:** run `gitnexus_impact({target: "checkStockTool", direction: "upstream"})` first. Expected caller: `src/lib/chat/tools/index.ts` (registered as `checkStock`).

Root cause: `checkStockTool` passes the model's `productId` (a catalog UUID/slug) straight to `getStockForProduct`, which expects an ERP **SKU** (`erpItemCode`). Non-SKU input matches nothing → false "0 stock". Fix: resolve `productId` → `products.sku` at the boundary; if no SKU, report "unavailable" (not a fake 0).

- [ ] **Step 3.1: Update the test to express the new behavior (failing)**

Replace the entire contents of `src/lib/chat/tools/check-stock.test.ts` with:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkStockTool,
  checkStockInputSchema,
  type CheckStockResult,
} from "./check-stock";

vi.mock("@/lib/erp", () => ({ getStockForProduct: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { getStockForProduct } from "@/lib/erp";
import { createClient } from "@/lib/supabase/server";

const mockedStock = vi.mocked(getStockForProduct);
const mockedClient = vi.mocked(createClient);

/** Stub Supabase so products.sku resolution returns `sku` (or null). */
function stubSku(sku: string | null) {
  mockedClient.mockResolvedValue({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: sku === null ? null : { sku },
            error: null,
          }),
        }),
      }),
    }),
  } as never);
}

const ctx = { toolCallId: "x", messages: [] } as never;

describe("checkStockTool", () => {
  beforeEach(() => {
    mockedStock.mockReset();
    mockedClient.mockReset();
  });

  it("requires productId in schema", () => {
    expect(checkStockInputSchema.safeParse({}).success).toBe(false);
  });

  it("resolves the catalog id to a SKU before calling the ERP", async () => {
    stubSku("ABC-123");
    mockedStock.mockResolvedValueOnce({
      productId: "ABC-123",
      stores: [
        { id: "sindos", name: "Σίνδος", stock: 3 },
        { id: "benizelou", name: "Βενιζέλου", stock: 1 },
      ],
    });
    const out = (await checkStockTool.execute!(
      { productId: "shoei-nxr2" },
      ctx,
    )) as CheckStockResult;
    expect(mockedStock).toHaveBeenCalledWith({
      productId: "ABC-123",
      variantId: undefined,
    });
    expect(out.totalStock).toBe(4);
    expect(out.inStock).toBe(true);
  });

  it("reports unavailable (not fake 0) when the product has no SKU", async () => {
    stubSku(null);
    const out = (await checkStockTool.execute!(
      { productId: "shoei-nxr2" },
      ctx,
    )) as CheckStockResult;
    expect(mockedStock).not.toHaveBeenCalled();
    expect(out.inStock).toBe(false);
    expect(out.error).toContain("unavailable");
  });

  it("falls through gracefully on ERP error", async () => {
    stubSku("ABC-123");
    mockedStock.mockRejectedValueOnce(new Error("ERP down"));
    const out = (await checkStockTool.execute!(
      { productId: "shoei-nxr2" },
      ctx,
    )) as CheckStockResult;
    expect(out.inStock).toBe(false);
    expect(out.error).toContain("unavailable");
  });
});
```

- [ ] **Step 3.2: Run test to verify it fails**

Run: `pnpm test src/lib/chat/tools/check-stock.test.ts`
Expected: FAIL — current tool ignores Supabase and calls `getStockForProduct({ productId: "shoei-nxr2" })`, so the `toHaveBeenCalledWith("ABC-123")` and no-SKU assertions fail.

- [ ] **Step 3.3: Implement the resolver**

Replace the entire contents of `src/lib/chat/tools/check-stock.ts` with:

```ts
import { tool } from "ai";
import { z } from "zod/v4";
import { getStockForProduct } from "@/lib/erp";
import { createClient } from "@/lib/supabase/server";

export const checkStockInputSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
});

export interface CheckStockResult {
  productId: string;
  inStock: boolean;
  totalStock: number;
  stores: Array<{ id: string; name: string; stock: number }>;
  error?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The chat model knows a catalog Product id (a Supabase UUID or a slug); the
 * ERP only understands the SKU (`products.sku`). Resolve it here, at the
 * boundary, before any ERP call. Returns null when the product has no SKU.
 */
async function resolveSku(productId: string): Promise<string | null> {
  const supabase = await createClient();
  const column = UUID_RE.test(productId) ? "id" : "slug";
  const { data } = await supabase
    .from("products")
    .select("sku")
    .eq(column, productId)
    .maybeSingle();
  return data?.sku ?? null;
}

export const checkStockTool = tool({
  description:
    "Check live stock for a specific product across the two stores (Καλλιθέα, Θεσσαλονίκη) and the central warehouse. Always call this before claiming a product is in stock — catalog cache may be stale.",
  inputSchema: checkStockInputSchema,
  execute: async ({ productId, variantId }): Promise<CheckStockResult> => {
    try {
      const sku = await resolveSku(productId);
      if (!sku) {
        return {
          productId,
          inStock: false,
          totalStock: 0,
          stores: [],
          error: "Stock lookup unavailable: product has no ERP SKU",
        };
      }
      const data = await getStockForProduct({ productId: sku, variantId });
      const total = data.stores.reduce((acc, s) => acc + (s.stock ?? 0), 0);
      return {
        productId,
        inStock: total > 0,
        totalStock: total,
        stores: data.stores,
      };
    } catch (err) {
      return {
        productId,
        inStock: false,
        totalStock: 0,
        stores: [],
        error: `Stock lookup unavailable: ${(err as Error).message}`,
      };
    }
  },
});
```

- [ ] **Step 3.4: Run test to verify it passes**

Run: `pnpm test src/lib/chat/tools/check-stock.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 3.5: Run GitNexus detect-changes before commit**

Run `gitnexus_detect_changes()`; confirm only `checkStockTool` / `resolveSku` changed.

- [ ] **Step 3.6: Commit**

```bash
git add src/lib/chat/tools/check-stock.ts src/lib/chat/tools/check-stock.test.ts
git commit -m "fix(chat): resolve catalog id to SKU before ERP stock lookup

checkStock resolved the catalog UUID/slug straight against the ERP, which
keys on SKU, returning a false 0. Resolve products.sku first; report
'unavailable' when there is no SKU instead of a fake out-of-stock."
```

---

## Task 4: Full suite + PR

- [ ] **Step 4.1: Run the whole test suite**

Run: `pnpm test`
Expected: all pass (pricing 6 + checkout action 3 + check-stock 4 + any pre-existing).

- [ ] **Step 4.2: Build**

Run: `pnpm build`
Expected: success.

- [ ] **Step 4.3: Open PR off main (never push to main directly)**

```bash
git push -u origin feat/track-a-commerce-bugfixes
gh pr create --base main --title "fix: Track A commerce bugfixes (pricing + stock)" --body "..."
```
PR body: what changed (server-authoritative pricing via pure `priceOrder`; checkStock id→SKU resolution), why (ADR 0001; false-0 stock), how to test (`pnpm test`), and the GitNexus impact/detect output. Request review before merge (always-ask for the main merge).

---

## Self-Review

**Spec coverage:**
- Bug 1 price-tampering → Tasks 1 + 2 (pure `priceOrder` + action wiring). ✓ Satisfies ADR 0001 (price from `products`, client price ignored, stock + active validated).
- Bug 3 checkStock id→SKU → Task 3. ✓ Resolves UUID/slug→`products.sku`, "unavailable" on no-SKU.
- Bug 2 → intentionally out of scope (folded into Track D). ✓ Documented at top.
- PR #13 entry gate → Phase 0. ✓

**Placeholder scan:** No TBD/"add validation"/"similar to". All steps contain full code + exact commands. ✓

**Type consistency:** `priceOrder(items: OrderLineInput[], products: ProductPricing[]) → PriceOrderResult`; `PricedLine.{productId,slug,quantity,unitPrice,lineTotal}` used identically in Task 2's `rows` mapping. Action exports `placeOrder` + `CheckoutInput` + `CheckoutItem` (page-compatible). `resolveSku` private; `CheckStockResult` unchanged shape. ✓

**Open follow-ups (not Track A scope — record in STATUS.md during Track C):**
- Guest COD orders use the admin client (RLS bypass, documented in-code). Enterprise hardening = an RLS insert policy for anonymous orders; defer to Track C/standards.
- `lib/actions/checkout.ts`, `lib/actions/cart.ts`, `lib/queries/cart.ts` (legacy DB-cart system) are now confirmed unused by the live storefront → Track B dead-code candidates (verify with gitnexus impact + grep per the Track B rule before deleting; they may still be referenced by `src/components`, which Track D retires).
```
