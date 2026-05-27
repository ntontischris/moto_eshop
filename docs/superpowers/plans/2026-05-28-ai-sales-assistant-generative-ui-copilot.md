# AI Sales Assistant — Sub-Project B (Generative UI + Co-pilot Navigation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Πιτ from an informational chatbot into a transactional sales co-pilot — real product cards rendered inline inside chat bubbles, a comparison table for 2–4 helmets/jackets, and three client-side tools (`navigateTo`, `applyFilters`, `addToCart`) that drive the storefront on the user's behalf with smooth route/URL transitions visible behind the chat panel.

**Architecture:** Five new tools added to `chatTools`. Three are server-side (`showProductCards`, `compareProducts`, `addToCart`) — they fetch enriched data and return JSON the chat-messages component renders as React components based on `toolName`. Two are client-side (`navigateTo`, `applyFilters`) — they have no server-side `execute`, so the stream contains the tool-call part and `useChat`'s `onToolCall` hook runs them in the browser via Next.js `useRouter()`. Safety guards in `use-co-pilot.ts` refuse `/admin/*` and live-checkout routes.

**Tech Stack:** Same as Sub-Project A — Next.js 16 App Router, `ai@6`, `@ai-sdk/react@3`, Zod v4, Vitest 4, Framer Motion (light use), Tailwind/CSS modules. New: `useRouter` + `useSearchParams` from `next/navigation` for client tool execution.

**Branch:** Continue on `feat/ai-sales-assistant` (already pushed; PR not yet opened). Commit each task on this branch.

**Spec reference:** `docs/superpowers/specs/2026-05-27-ai-sales-assistant-design.md`. Re-read sections "Co-pilot Site Navigation" + "The Tool Catalog" + "UI/UX Spec" before starting.

**Prerequisites:**
- Sub-Project A merged or live on the branch (it is — 25 commits in place).
- Chat tables exist in production Supabase (applied 2026-05-27).
- `OPENAI_API_KEY` set locally in `.env`.

---

## Tool Behavior Contract (read this before any task)

### Server-side tools (have `execute`)

| Tool | When the model calls it | What it returns | How the UI renders it |
|---|---|---|---|
| `showProductCards({productIds})` | "Δείξε μου αυτά τα 3 κράνη" | `{ products: [{id, slug, name, brand, price, image, in_stock, ...}], notFound: string[] }` | `<ChatProductCarousel>` inside the bubble |
| `compareProducts({productIds, fields?})` | "Σύγκρινέ μου αυτά τα δύο" | `{ products: [...], fields: ['price','weight',...] }` | `<ChatProductCompare>` inline table |
| `addToCart({productId, qty})` | "Πρόσθεσέ το στο καλάθι" | `{ success: true, cartItemCount, message }` or `{ success: false, error }` | `<ChatToolChip>` "🛒 Πρόσθεσα 1 × <name> στο καλάθι" |

### Client-side tools (no `execute` on server)

| Tool | When the model calls it | What the browser does | UI |
|---|---|---|---|
| `navigateTo({route})` | "Πάμε στα κράνη touring" | `router.push(localizedRoute)` after safety check | `<ChatToolChip>` "📍 Πήγα στο: ..." |
| `applyFilters({filters})` | "Φίλτραρέ τα μαύρα κάτω από 300€" | Build search params, `router.replace(currentRoute?...)` | `<ChatToolChip>` "🔧 Έβαλα φίλτρα: ..." |

### What Πιτ is NOT allowed to do (system prompt rule + client guard)

- `navigateTo` to any route under `/admin` → client refuses, returns `{ok: false, error: "forbidden route"}`. Model is told via system prompt this will happen.
- `navigateTo` during checkout (`/checkout/*`) → client refuses.
- `applyFilters` on routes that are not PLPs (`/category/*`) → client refuses, returns helpful error.
- `addToCart` without an explicit user acknowledgement of the product in the current turn → the system prompt enforces this; we don't add a server-side check (would require reading conversation history, too much complexity for a guideline).

---

## File Structure (locked)

### Created

```
src/lib/chat/tools/
  show-product-cards.ts          # server tool
  show-product-cards.test.ts
  compare-products.ts            # server tool
  compare-products.test.ts
  add-to-cart.ts                 # server tool wrapping existing cart action
  add-to-cart.test.ts
  navigate-to.ts                 # client tool (schema only)
  navigate-to.test.ts            # schema + safety guard tests
  apply-filters.ts               # client tool (schema only)
  apply-filters.test.ts

src/app/[locale]/(store)/_components/chat/
  chat-product-card.tsx
  chat-product-carousel.tsx
  chat-product-compare.tsx
  chat-tool-chip.tsx
  use-co-pilot.ts                # safety + execution logic for client tools
  use-co-pilot.test.ts           # safety guard tests
```

### Modified

```
src/lib/chat/tools/index.ts                       # add 5 new entries to chatTools
src/lib/chat/prompts/base.ts                      # enumerate all 9 tools
src/app/[locale]/(store)/_components/chat/chat-messages.tsx     # render tool parts
src/app/[locale]/(store)/_components/chat/chat-provider.tsx     # onToolCall wiring
src/app/[locale]/(store)/_components/chat/chat.module.css       # new component styles
```

---

## Task 1: showProductCards Server Tool (TDD)

**Files:**
- Create: `src/lib/chat/tools/show-product-cards.ts`
- Create: `src/lib/chat/tools/show-product-cards.test.ts`

The tool accepts up to 6 product ids/slugs, fetches them in parallel via the existing `getProductDetailsTool.execute()` logic (or duplicates the query for efficiency), and returns `{ products: [...], notFound: [...] }`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/chat/tools/show-product-cards.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  showProductCardsTool,
  showProductCardsInputSchema,
  type ShowProductCardsResult,
} from "./show-product-cards";

const supabaseMock = { from: vi.fn() };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

function mockProductsResponse(rows: unknown[]) {
  supabaseMock.from.mockImplementation(() => ({
    select: () => ({
      in: () => ({
        limit: async () => ({ data: rows, error: null }),
      }),
    }),
  }));
}

describe("showProductCardsTool", () => {
  beforeEach(() => supabaseMock.from.mockReset());

  it("rejects empty productIds array", () => {
    const r = showProductCardsInputSchema.safeParse({ productIds: [] });
    expect(r.success).toBe(false);
  });

  it("rejects more than 6 productIds", () => {
    const r = showProductCardsInputSchema.safeParse({
      productIds: ["a", "b", "c", "d", "e", "f", "g"],
    });
    expect(r.success).toBe(false);
  });

  it("returns enriched products and tracks notFound", async () => {
    mockProductsResponse([
      {
        id: "p1",
        slug: "shoei-rf",
        name: "Shoei RF",
        price: 599,
        images: ["/img1.jpg"],
        images_cdn: null,
        stock: 3,
        brands: { name: "Shoei" },
      },
    ]);

    const out = (await showProductCardsTool.execute!(
      { productIds: ["p1", "missing-id"] },
      { toolCallId: "x", messages: [] } as never,
    )) as ShowProductCardsResult;

    expect(out.products).toHaveLength(1);
    expect(out.products[0].name).toBe("Shoei RF");
    expect(out.products[0].brand).toBe("Shoei");
    expect(out.products[0].in_stock).toBe(true);
    expect(out.notFound).toEqual(["missing-id"]);
  });
});
```

- [ ] **Step 2: Run — expect failures**

```powershell
pnpm exec vitest run src/lib/chat/tools/show-product-cards.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/lib/chat/tools/show-product-cards.ts
import { tool } from "ai";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

export const showProductCardsInputSchema = z.object({
  productIds: z
    .array(z.string().min(1))
    .min(1)
    .max(6)
    .describe("Up to 6 product UUIDs or slugs to display as cards"),
});

export interface ChatProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string | null;
  in_stock: boolean;
}

export interface ShowProductCardsResult {
  products: ChatProductSummary[];
  notFound: string[];
}

function pickImage(images: unknown, cdn: unknown): string | null {
  if (Array.isArray(cdn) && cdn.length > 0 && typeof cdn[0] === "string") return cdn[0];
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === "string") return images[0];
  return null;
}

export const showProductCardsTool = tool({
  description:
    "Render product cards inline in the chat so the user sees real products with images and prices. Pass 1–6 product IDs or slugs. Always prefer this over plain text links when introducing products.",
  inputSchema: showProductCardsInputSchema,
  execute: async ({ productIds }): Promise<ShowProductCardsResult> => {
    const supabase = await createClient();
    const isUuid = (s: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
    const uuids = productIds.filter(isUuid);
    const slugs = productIds.filter((s) => !isUuid(s));

    const fetched: Array<{
      id: string;
      slug: string;
      name: string;
      price: number;
      images: unknown;
      images_cdn: unknown;
      stock: number | null;
      brands: { name: string } | null;
    }> = [];

    if (uuids.length > 0) {
      const { data } = await (supabase
        .from("products")
        .select(
          "id, slug, name, price, images, images_cdn, stock, brands(name)",
        ) as never)
        .in("id", uuids)
        .limit(6);
      if (Array.isArray(data)) fetched.push(...(data as typeof fetched));
    }
    if (slugs.length > 0) {
      const { data } = await (supabase
        .from("products")
        .select(
          "id, slug, name, price, images, images_cdn, stock, brands(name)",
        ) as never)
        .in("slug", slugs)
        .limit(6);
      if (Array.isArray(data)) fetched.push(...(data as typeof fetched));
    }

    const seen = new Set<string>();
    for (const p of fetched) {
      seen.add(p.id);
      seen.add(p.slug);
    }
    const notFound = productIds.filter((pid) => !seen.has(pid));

    return {
      products: fetched.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brands?.name ?? "",
        price: p.price,
        image: pickImage(p.images, p.images_cdn),
        in_stock: (p.stock ?? 0) > 0,
      })),
      notFound,
    };
  },
});
```

- [ ] **Step 4: Run — 3 pass**

- [ ] **Step 5: tsc clean**

```powershell
pnpm exec tsc --noEmit
```

- [ ] **Step 6: Commit**

```powershell
git add src/lib/chat/tools/show-product-cards.ts src/lib/chat/tools/show-product-cards.test.ts
git commit -m @'
feat(chat): showProductCards server tool with TDD

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 2: compareProducts Server Tool (TDD)

**Files:**
- Create: `src/lib/chat/tools/compare-products.ts`
- Create: `src/lib/chat/tools/compare-products.test.ts`

Same shape as `showProductCards` but returns wider rows with spec-comparison fields.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/chat/tools/compare-products.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  compareProductsTool,
  compareProductsInputSchema,
  type CompareProductsResult,
} from "./compare-products";

const supabaseMock = { from: vi.fn() };

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => supabaseMock),
}));

describe("compareProductsTool", () => {
  beforeEach(() => supabaseMock.from.mockReset());

  it("requires between 2 and 4 product ids", () => {
    expect(
      compareProductsInputSchema.safeParse({ productIds: ["a"] }).success,
    ).toBe(false);
    expect(
      compareProductsInputSchema.safeParse({
        productIds: ["a", "b", "c", "d", "e"],
      }).success,
    ).toBe(false);
    expect(
      compareProductsInputSchema.safeParse({ productIds: ["a", "b"] }).success,
    ).toBe(true);
  });

  it("returns products with comparison fields", async () => {
    supabaseMock.from.mockImplementation(() => ({
      select: () => ({
        in: () => ({
          limit: async () => ({
            data: [
              {
                id: "p1",
                slug: "shoei-rf",
                name: "Shoei RF",
                price: 599,
                images: ["/a.jpg"],
                images_cdn: null,
                stock: 2,
                weight_grams: 1450,
                certifications: ["ECE 22.06"],
                brands: { name: "Shoei" },
              },
              {
                id: "p2",
                slug: "agv-k6",
                name: "AGV K6",
                price: 499,
                images: ["/b.jpg"],
                images_cdn: null,
                stock: 0,
                weight_grams: 1380,
                certifications: ["ECE 22.06", "DOT"],
                brands: { name: "AGV" },
              },
            ],
            error: null,
          }),
        }),
      }),
    }));

    const out = (await compareProductsTool.execute!(
      { productIds: ["p1", "p2"] },
      { toolCallId: "x", messages: [] } as never,
    )) as CompareProductsResult;

    expect(out.products).toHaveLength(2);
    expect(out.fields).toContain("price");
    expect(out.fields).toContain("weight");
    expect(out.products[0].weight).toBe(1450);
    expect(out.products[1].in_stock).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect failures**

- [ ] **Step 3: Implement**

```ts
// src/lib/chat/tools/compare-products.ts
import { tool } from "ai";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";

export const compareProductsInputSchema = z.object({
  productIds: z
    .array(z.string().min(1))
    .min(2)
    .max(4)
    .describe("Between 2 and 4 product ids/slugs to compare side-by-side"),
  fields: z
    .array(z.enum(["price", "weight", "certifications", "in_stock"]))
    .optional(),
});

export interface CompareProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  image: string | null;
  in_stock: boolean;
  weight: number | null;
  certifications: string[];
}

export interface CompareProductsResult {
  products: CompareProduct[];
  fields: string[];
  notFound: string[];
}

const DEFAULT_FIELDS = ["price", "weight", "certifications", "in_stock"] as const;

function pickImage(images: unknown, cdn: unknown): string | null {
  if (Array.isArray(cdn) && cdn.length > 0 && typeof cdn[0] === "string") return cdn[0];
  if (Array.isArray(images) && images.length > 0 && typeof images[0] === "string") return images[0];
  return null;
}

export const compareProductsTool = tool({
  description:
    "Compare 2–4 products in a side-by-side inline table. Use when the user asks to compare items.",
  inputSchema: compareProductsInputSchema,
  execute: async ({ productIds, fields }): Promise<CompareProductsResult> => {
    const supabase = await createClient();
    const isUuid = (s: string) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
    const uuids = productIds.filter(isUuid);
    const slugs = productIds.filter((s) => !isUuid(s));

    const select =
      "id, slug, name, price, images, images_cdn, stock, weight_grams, certifications, brands(name)";

    const buckets: typeof products = [];
    type Row = {
      id: string;
      slug: string;
      name: string;
      price: number;
      images: unknown;
      images_cdn: unknown;
      stock: number | null;
      weight_grams: number | null;
      certifications: string[] | null;
      brands: { name: string } | null;
    };
    const products: Row[] = [];

    if (uuids.length) {
      const { data } = await (supabase.from("products").select(select) as never)
        .in("id", uuids)
        .limit(4);
      if (Array.isArray(data)) buckets.push(...(data as Row[]));
    }
    if (slugs.length) {
      const { data } = await (supabase.from("products").select(select) as never)
        .in("slug", slugs)
        .limit(4);
      if (Array.isArray(data)) buckets.push(...(data as Row[]));
    }
    products.push(...buckets);

    const seen = new Set<string>();
    for (const p of products) {
      seen.add(p.id);
      seen.add(p.slug);
    }

    return {
      products: products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brands?.name ?? "",
        price: p.price,
        image: pickImage(p.images, p.images_cdn),
        in_stock: (p.stock ?? 0) > 0,
        weight: p.weight_grams,
        certifications: p.certifications ?? [],
      })),
      fields: fields ?? [...DEFAULT_FIELDS],
      notFound: productIds.filter((pid) => !seen.has(pid)),
    };
  },
});
```

> If `products` table doesn't have a `weight_grams` or `certifications` column, inspect the products migration and adapt the column names. Keep the return shape stable.

- [ ] **Step 4: Run — 2 pass**

- [ ] **Step 5: tsc clean**

- [ ] **Step 6: Commit**

```powershell
git add src/lib/chat/tools/compare-products.ts src/lib/chat/tools/compare-products.test.ts
git commit -m @'
feat(chat): compareProducts server tool with TDD

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 3: addToCart Server Tool (TDD)

**Files:**
- Create: `src/lib/chat/tools/add-to-cart.ts`
- Create: `src/lib/chat/tools/add-to-cart.test.ts`

Wraps the existing cart server action so the bot can add via natural language ("πρόσθεσέ το"). Before writing, **inspect `src/lib/actions/cart.ts`** to find the exact server-action signature.

- [ ] **Step 1: Inspect existing cart action**

```powershell
Get-Content src/lib/actions/cart.ts | Select-Object -First 80
```

Identify the function name (likely `addToCartAction` or similar) and its input/output shape. Adapt the test + implementation below to use the real name.

- [ ] **Step 2: Write the failing test** (assuming `addToCartAction({productId, qty})` returns `{ success, itemCount, error? }` — adapt if different)

```ts
// src/lib/chat/tools/add-to-cart.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  addToCartTool,
  addToCartInputSchema,
  type AddToCartResult,
} from "./add-to-cart";

const mockedAction = vi.fn();
vi.mock("@/lib/actions/cart", () => ({
  addToCartAction: (...args: unknown[]) => mockedAction(...args),
}));

describe("addToCartTool", () => {
  beforeEach(() => mockedAction.mockReset());

  it("requires productId; qty defaults to 1 inside execute", () => {
    expect(addToCartInputSchema.safeParse({}).success).toBe(false);
    expect(
      addToCartInputSchema.safeParse({ productId: "p1" }).success,
    ).toBe(true);
  });

  it("calls the existing cart action and returns success summary", async () => {
    mockedAction.mockResolvedValueOnce({ success: true, itemCount: 3 });
    const out = (await addToCartTool.execute!(
      { productId: "p1", qty: 2 },
      { toolCallId: "x", messages: [] } as never,
    )) as AddToCartResult;
    expect(out.success).toBe(true);
    expect(out.cartItemCount).toBe(3);
    expect(mockedAction).toHaveBeenCalledWith(
      expect.objectContaining({ productId: "p1", qty: 2 }),
    );
  });

  it("returns success=false on action error", async () => {
    mockedAction.mockResolvedValueOnce({ success: false, error: "out of stock" });
    const out = (await addToCartTool.execute!(
      { productId: "p1" },
      { toolCallId: "x", messages: [] } as never,
    )) as AddToCartResult;
    expect(out.success).toBe(false);
    expect(out.error).toContain("out of stock");
  });
});
```

- [ ] **Step 3: Run — expect failures**

- [ ] **Step 4: Implement** (adapt server-action call to real signature found in Step 1)

```ts
// src/lib/chat/tools/add-to-cart.ts
import { tool } from "ai";
import { z } from "zod/v4";
import { addToCartAction } from "@/lib/actions/cart";

export const addToCartInputSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  qty: z.number().int().min(1).max(10).optional(),
});

export interface AddToCartResult {
  success: boolean;
  cartItemCount?: number;
  message?: string;
  error?: string;
}

export const addToCartTool = tool({
  description:
    "Add a product to the user's cart on their behalf. Only call AFTER the user has explicitly agreed to add a specific product mentioned in this conversation. Returns the new cart item count.",
  inputSchema: addToCartInputSchema,
  execute: async ({ productId, variantId, qty }): Promise<AddToCartResult> => {
    try {
      const result = await addToCartAction({
        productId,
        variantId,
        qty: qty ?? 1,
      });
      if (!result.success) {
        return { success: false, error: result.error ?? "add to cart failed" };
      }
      return {
        success: true,
        cartItemCount: result.itemCount,
        message: `Πρόσθεσα ${qty ?? 1} × στο καλάθι.`,
      };
    } catch (err) {
      return {
        success: false,
        error: (err as Error).message,
      };
    }
  },
});
```

> If `addToCartAction` has a different name or signature, **adapt this file to match**, and update the test mock accordingly. Do NOT modify the existing `src/lib/actions/cart.ts` — only the tool wrapper.

- [ ] **Step 5: Run — 3 pass**

- [ ] **Step 6: tsc clean**

- [ ] **Step 7: Commit**

```powershell
git add src/lib/chat/tools/add-to-cart.ts src/lib/chat/tools/add-to-cart.test.ts
git commit -m @'
feat(chat): addToCart server tool with TDD

Wraps existing cart action so the bot can add products via natural
language after user agreement.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 4: navigateTo Client Tool (TDD — schema + safety)

**Files:**
- Create: `src/lib/chat/tools/navigate-to.ts`
- Create: `src/lib/chat/tools/navigate-to.test.ts`

Client tools have NO `execute` defined on the server side. The route handler still passes them in `tools:`, so the model can call them. The stream contains the tool call, the browser's `useChat({onToolCall})` runs them.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/chat/tools/navigate-to.test.ts
import { describe, it, expect } from "vitest";
import {
  navigateToInputSchema,
  isRouteAllowed,
} from "./navigate-to";

describe("navigateToInputSchema", () => {
  it("requires route", () => {
    expect(navigateToInputSchema.safeParse({}).success).toBe(false);
  });
  it("accepts a normal route", () => {
    expect(
      navigateToInputSchema.safeParse({ route: "/category/kranh" }).success,
    ).toBe(true);
  });
  it("rejects empty route", () => {
    expect(navigateToInputSchema.safeParse({ route: "" }).success).toBe(false);
  });
});

describe("isRouteAllowed", () => {
  it("allows category and product routes", () => {
    expect(isRouteAllowed("/category/kranh")).toBe(true);
    expect(isRouteAllowed("/product/shoei-rf")).toBe(true);
    expect(isRouteAllowed("/")).toBe(true);
  });
  it("rejects admin routes", () => {
    expect(isRouteAllowed("/admin")).toBe(false);
    expect(isRouteAllowed("/admin/campaigns")).toBe(false);
  });
  it("rejects checkout sub-routes (except cart entry)", () => {
    expect(isRouteAllowed("/checkout/payment")).toBe(false);
    expect(isRouteAllowed("/checkout/success")).toBe(false);
    // /cart is OK; /checkout (no slash sub-path) is OK too — entry page is fine
    expect(isRouteAllowed("/cart")).toBe(true);
    expect(isRouteAllowed("/checkout")).toBe(true);
  });
  it("rejects absolute URLs and protocol-relative", () => {
    expect(isRouteAllowed("https://evil.com")).toBe(false);
    expect(isRouteAllowed("//evil.com")).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect failures**

- [ ] **Step 3: Implement**

```ts
// src/lib/chat/tools/navigate-to.ts
import { tool } from "ai";
import { z } from "zod/v4";

export const navigateToInputSchema = z.object({
  route: z
    .string()
    .min(1)
    .describe(
      "Storefront route to push, starting with /, e.g. /category/kranh--touring or /product/shoei-rf",
    ),
  locale: z.string().min(2).max(5).optional(),
});

export function isRouteAllowed(route: string): boolean {
  if (!route.startsWith("/")) return false;
  if (route.startsWith("//")) return false;
  if (route.startsWith("/admin")) return false;
  // Allow /checkout (the entry page) but block /checkout/payment, /checkout/success, etc.
  if (route.startsWith("/checkout/")) return false;
  return true;
}

/**
 * Client-side tool — no `execute` defined.
 * The stream emits the tool call; the browser's onToolCall executes it
 * via router.push() and reports the result back into the conversation.
 */
export const navigateToTool = tool({
  description:
    "Navigate the user's browser to a storefront route on their behalf. Use when the user asks 'πάμε στα ...', 'δείξε μου τα κράνη', etc. Cannot navigate to /admin or live checkout steps.",
  inputSchema: navigateToInputSchema,
  // intentionally no execute → client-side tool
});
```

- [ ] **Step 4: Run — all pass**

- [ ] **Step 5: Commit**

```powershell
git add src/lib/chat/tools/navigate-to.ts src/lib/chat/tools/navigate-to.test.ts
git commit -m @'
feat(chat): navigateTo client tool with route safety guard

Tool has no server execute - the browser runs router.push() via onToolCall.
isRouteAllowed blocks /admin and /checkout/* sub-routes.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 5: applyFilters Client Tool (TDD — schema + URL builder)

**Files:**
- Create: `src/lib/chat/tools/apply-filters.ts`
- Create: `src/lib/chat/tools/apply-filters.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/chat/tools/apply-filters.test.ts
import { describe, it, expect } from "vitest";
import {
  applyFiltersInputSchema,
  buildFilterSearchParams,
  isFilterContextAllowed,
} from "./apply-filters";

describe("applyFiltersInputSchema", () => {
  it("accepts a minimal filters object", () => {
    expect(
      applyFiltersInputSchema.safeParse({ filters: { color: "black" } }).success,
    ).toBe(true);
  });
  it("accepts mixed filters", () => {
    expect(
      applyFiltersInputSchema.safeParse({
        filters: { color: "black", brand: "shoei", priceMax: 300 },
      }).success,
    ).toBe(true);
  });
  it("rejects empty filters object", () => {
    expect(
      applyFiltersInputSchema.safeParse({ filters: {} }).success,
    ).toBe(false);
  });
});

describe("buildFilterSearchParams", () => {
  it("encodes string filters as query keys", () => {
    const p = buildFilterSearchParams({ color: "black", brand: "shoei" });
    expect(p.get("color")).toBe("black");
    expect(p.get("brand")).toBe("shoei");
  });
  it("encodes numeric ranges as price_min / price_max", () => {
    const p = buildFilterSearchParams({ priceMin: 100, priceMax: 300 });
    expect(p.get("price_min")).toBe("100");
    expect(p.get("price_max")).toBe("300");
  });
  it("skips undefined values", () => {
    const p = buildFilterSearchParams({ color: undefined, brand: "shoei" });
    expect(p.has("color")).toBe(false);
    expect(p.get("brand")).toBe("shoei");
  });
});

describe("isFilterContextAllowed", () => {
  it("allows filters on a PLP route", () => {
    expect(isFilterContextAllowed("/el/category/kranh")).toBe(true);
    expect(isFilterContextAllowed("/category/kranh--touring")).toBe(true);
  });
  it("rejects filters on PDP / home / cart / checkout", () => {
    expect(isFilterContextAllowed("/")).toBe(false);
    expect(isFilterContextAllowed("/product/foo")).toBe(false);
    expect(isFilterContextAllowed("/cart")).toBe(false);
    expect(isFilterContextAllowed("/checkout")).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect failures**

- [ ] **Step 3: Implement**

```ts
// src/lib/chat/tools/apply-filters.ts
import { tool } from "ai";
import { z } from "zod/v4";

const filterShape = z
  .object({
    color: z.string().min(1).optional(),
    brand: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    size: z.string().min(1).optional(),
    priceMin: z.number().nonnegative().optional(),
    priceMax: z.number().nonnegative().optional(),
  })
  .refine(
    (f) =>
      f.color !== undefined ||
      f.brand !== undefined ||
      f.category !== undefined ||
      f.size !== undefined ||
      f.priceMin !== undefined ||
      f.priceMax !== undefined,
    { message: "at least one filter is required" },
  );

export const applyFiltersInputSchema = z.object({
  filters: filterShape,
});

export type ChatFilters = z.infer<typeof filterShape>;

const NUMERIC_KEYS: Record<string, string> = {
  priceMin: "price_min",
  priceMax: "price_max",
};

export function buildFilterSearchParams(filters: ChatFilters): URLSearchParams {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === "") continue;
    const key = NUMERIC_KEYS[k] ?? k;
    p.set(key, String(v));
  }
  return p;
}

export function isFilterContextAllowed(pathname: string): boolean {
  // strip leading /[locale]
  const stripped = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
  return stripped.startsWith("/category/");
}

export const applyFiltersTool = tool({
  description:
    "Apply filters (color, brand, category, size, price range) on the current product list page. Only works on /category/* routes. If the user is not on a PLP, call navigateTo first to take them to a category.",
  inputSchema: applyFiltersInputSchema,
  // intentionally no execute → client-side tool
});
```

- [ ] **Step 4: Run — all pass**

- [ ] **Step 5: Commit**

```powershell
git add src/lib/chat/tools/apply-filters.ts src/lib/chat/tools/apply-filters.test.ts
git commit -m @'
feat(chat): applyFilters client tool with URL builder + context guard

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 6: Tool Registry + System Prompt Update

**Files:**
- Modify: `src/lib/chat/tools/index.ts`
- Modify: `src/lib/chat/prompts/base.ts`

- [ ] **Step 1: Update the registry**

Replace `src/lib/chat/tools/index.ts` with:

```ts
import { searchProductsTool } from "./search-products";
import { getProductDetailsTool } from "./get-product-details";
import { checkStockTool } from "./check-stock";
import { handoffToHumanTool } from "./handoff-to-human";
import { showProductCardsTool } from "./show-product-cards";
import { compareProductsTool } from "./compare-products";
import { addToCartTool } from "./add-to-cart";
import { navigateToTool } from "./navigate-to";
import { applyFiltersTool } from "./apply-filters";

/**
 * Tool catalog handed to streamText({ tools: chatTools }).
 * - Server tools have execute defined → run on the route handler.
 * - Client tools (navigateTo, applyFilters) have no execute → run in the
 *   browser via useChat's onToolCall handler.
 */
export const chatTools = {
  searchProducts: searchProductsTool,
  getProductDetails: getProductDetailsTool,
  checkStock: checkStockTool,
  handoffToHuman: handoffToHumanTool,
  showProductCards: showProductCardsTool,
  compareProducts: compareProductsTool,
  addToCart: addToCartTool,
  navigateTo: navigateToTool,
  applyFilters: applyFiltersTool,
} as const;

export type ChatToolName = keyof typeof chatTools;
```

- [ ] **Step 2: Update the base prompt with the 9-tool playbook**

Replace `src/lib/chat/prompts/base.ts` with:

```ts
/**
 * Πιτ — the sales-assistant persona.
 *
 * Single-source-of-truth, Greek. The multilingual addendum is appended
 * separately and tells the model how to handle non-Greek customers.
 *
 * When the spec ("Sub-Project A/B" sections of the design doc) changes,
 * keep this file in sync.
 */
export const BASE_PROMPT_EL = `
Είσαι ο "Πιτ" — ο πιο έμπειρος πωλητής στο Moto Market, ένα κατάστημα
εξοπλισμού μηχανής στην Καλλιθέα και τη Θεσσαλονίκη με 44 χρόνια ιστορίας.

Στυλ:
- Μιλάς όπως ένας έμπειρος αναβάτης που δουλεύει στο μαγαζί — φιλικά, ευθέως,
  χωρίς corporate ορολογία.
- Πρώτη ερώτηση πάντα: "τι μηχανή έχεις και τι θες να κάνεις;" — αν δεν ξέρεις ήδη.
- Δεν χρησιμοποιείς emoji σε κάθε γραμμή. Πολύ σπάνια, για έμφαση.
- Κάθε απάντηση τελειώνει με ξεκάθαρο next step ("θες να το δεις;",
  "να το βάλω στο καλάθι;", "να φιλτράρω και για χρώμα;").

Κανόνες ground-truth:
- ΠΟΤΕ δεν λες τιμή, διαθεσιμότητα, ή spec χωρίς να έχεις καλέσει tool που το επιστρέφει.
- ΠΟΤΕ δεν επινοείς προϊόντα. Αν ένα προϊόν δεν βρίσκεται, το λες ευθέως.

Tools — πότε καλείς ποιο:

1) searchProducts({query, filters?}) — βρίσκει προϊόντα με semantic search.
   Χρήση: "ψάχνω κράνος", "θέλω μπουφάν touring", φιλτράρισμα brand/τιμή.

2) getProductDetails({productId}) — πλήρες περιεχόμενο ενός προϊόντος.
   Χρήση: όταν ο χρήστης ρωτάει για συγκεκριμένα specs / περιγραφή.

3) checkStock({productId}) — live stock ανά κατάστημα.
   Χρήση: ΠΑΝΤΑ πριν πεις "διαθέσιμο" — το cache μπορεί να είναι παλιό.

4) showProductCards({productIds}) — εμφανίζει 1-6 πραγματικά cards inline.
   Χρήση: ΠΑΝΤΑ όταν δείχνεις προϊόντα στον χρήστη. Όχι plain text links.

5) compareProducts({productIds, fields?}) — πίνακας σύγκρισης 2-4 προϊόντων.
   Χρήση: "σύγκρινέ μου αυτά", "ποιο είναι καλύτερο μεταξύ X και Y".

6) navigateTo({route}) — πλοηγεί τον browser σε διαδρομή του site.
   Χρήση: "πάμε στα κράνη", "δείξε μου την κατηγορία", "βγάλε με στο καλάθι".
   ΑΠΑΓΟΡΕΥΕΤΑΙ: /admin/*, /checkout/payment, /checkout/success.

7) applyFilters({filters}) — εφαρμόζει φίλτρα στην τρέχουσα σελίδα κατηγορίας.
   Χρήση: "μαύρα μόνο", "κάτω από 300€", "Shoei". Δουλεύει ΜΟΝΟ σε /category/*.
   Αν δεν είσαι εκεί, καλείς πρώτα navigateTo σε σχετική κατηγορία.

8) addToCart({productId, qty?}) — προσθέτει στο καλάθι.
   Χρήση: ΜΟΝΟ αφού ο χρήστης πει ρητά "βάλε το", "πρόσθεσέ το", "θέλω αυτό".
   Επιβεβαιώνεις τι έβαλες αμέσως μετά.

9) handoffToHuman({reason, summary}) — escalation με email στο sales.
   Χρήση: custom orders, εγγυήσεις πέρα από standard, νομικά/ιατρικά,
   ή όποτε ο χρήστης ζητάει άνθρωπο.

Σειρά συνηθισμένης ροής:
- "ψάχνω κράνος" → searchProducts → showProductCards (κορυφαία 3-4)
- "πες μου περισσότερα για το πρώτο" → getProductDetails + checkStock
- "πάμε στα κράνη touring" → navigateTo → applyFilters αν προστεθούν φίλτρα
- "βάλε το στο καλάθι" → addToCart → επιβεβαίωση
`.trim();
```

- [ ] **Step 3: tsc clean**

```powershell
pnpm exec tsc --noEmit
```

- [ ] **Step 4: Commit**

```powershell
git add src/lib/chat/tools/index.ts src/lib/chat/prompts/base.ts
git commit -m @'
feat(chat): register 5 new tools + expand base prompt with 9-tool playbook

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 7: ChatProductCard Component

**Files:**
- Create: `src/app/[locale]/(store)/_components/chat/chat-product-card.tsx`

Visual component that renders a single product summary inline. Lightweight — no real-time data, just what's passed in.

- [ ] **Step 1: Implement**

```tsx
// src/app/[locale]/(store)/_components/chat/chat-product-card.tsx
"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import type { ChatProductSummary } from "@/lib/chat/tools/show-product-cards";
import styles from "./chat.module.css";

interface Props {
  product: ChatProductSummary;
  onAddToCart?: (productId: string) => void;
}

export function ChatProductCard({ product, onAddToCart }: Props) {
  const locale = useLocale();
  const formatted = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <article className={styles.card}>
      <Link
        href={`/${locale}/product/${product.slug}`}
        className={styles.cardImageLink}
        prefetch={false}
      >
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={styles.cardImage}
          />
        ) : (
          <div className={styles.cardImagePlaceholder} aria-hidden="true" />
        )}
      </Link>
      <div className={styles.cardBody}>
        {product.brand && (
          <span className={styles.cardBrand}>{product.brand}</span>
        )}
        <Link
          href={`/${locale}/product/${product.slug}`}
          className={styles.cardName}
          prefetch={false}
        >
          {product.name}
        </Link>
        <div className={styles.cardFooter}>
          <span className={styles.cardPrice}>{formatted}</span>
          {!product.in_stock && (
            <span className={styles.cardOos}>Εξαντλημένο</span>
          )}
          {product.in_stock && onAddToCart && (
            <button
              type="button"
              className={styles.cardCta}
              onClick={() => onAddToCart(product.id)}
              aria-label={`Πρόσθεσε ${product.name} στο καλάθι`}
            >
              +
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
```

- [ ] **Step 2: tsc clean** (Note: CSS classes will be added in Task 11; tsc won't complain about missing CSS-module class names because they resolve at runtime — but the component reads them, so just confirm no TypeScript errors.)

```powershell
pnpm exec tsc --noEmit
```

- [ ] **Step 3: Commit**

```powershell
git add src/app/[locale]/(store)/_components/chat/chat-product-card.tsx
git commit -m @'
feat(chat): ChatProductCard component for inline rendering

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 8: ChatProductCarousel Component

**Files:**
- Create: `src/app/[locale]/(store)/_components/chat/chat-product-carousel.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/[locale]/(store)/_components/chat/chat-product-carousel.tsx
"use client";

import type { ChatProductSummary } from "@/lib/chat/tools/show-product-cards";
import { ChatProductCard } from "./chat-product-card";
import styles from "./chat.module.css";

interface Props {
  products: ChatProductSummary[];
  notFound?: string[];
  onAddToCart?: (productId: string) => void;
}

export function ChatProductCarousel({ products, notFound, onAddToCart }: Props) {
  if (products.length === 0) {
    return (
      <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
        Δεν βρήκα προϊόντα να σου δείξω.
      </div>
    );
  }

  return (
    <div className={styles.carouselWrap}>
      <div
        className={styles.carousel}
        role="region"
        aria-label="Πιο σχετικά προϊόντα"
      >
        {products.map((p) => (
          <ChatProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
        ))}
      </div>
      {notFound && notFound.length > 0 && (
        <p className={styles.carouselNotFound}>
          Δεν βρήκα: {notFound.join(", ")}.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: tsc clean**

- [ ] **Step 3: Commit**

```powershell
git add src/app/[locale]/(store)/_components/chat/chat-product-carousel.tsx
git commit -m @'
feat(chat): ChatProductCarousel for showProductCards tool result

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 9: ChatProductCompare Component

**Files:**
- Create: `src/app/[locale]/(store)/_components/chat/chat-product-compare.tsx`

- [ ] **Step 1: Implement**

```tsx
// src/app/[locale]/(store)/_components/chat/chat-product-compare.tsx
"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import type { CompareProduct } from "@/lib/chat/tools/compare-products";
import styles from "./chat.module.css";

interface Props {
  products: CompareProduct[];
  fields: string[];
}

const LABELS: Record<string, string> = {
  price: "Τιμή",
  weight: "Βάρος",
  certifications: "Πιστοποιήσεις",
  in_stock: "Διαθεσιμότητα",
};

function renderCell(p: CompareProduct, field: string, locale: string): string {
  if (field === "price") {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(p.price);
  }
  if (field === "weight") {
    return p.weight ? `${p.weight}g` : "—";
  }
  if (field === "certifications") {
    return p.certifications.length ? p.certifications.join(", ") : "—";
  }
  if (field === "in_stock") {
    return p.in_stock ? "✓" : "✗";
  }
  return "—";
}

export function ChatProductCompare({ products, fields }: Props) {
  const locale = useLocale();
  return (
    <div className={styles.compareWrap}>
      <table className={styles.compare}>
        <thead>
          <tr>
            <th></th>
            {products.map((p) => (
              <th key={p.id} scope="col">
                <Link
                  href={`/${locale}/product/${p.slug}`}
                  className={styles.compareName}
                  prefetch={false}
                >
                  {p.brand} {p.name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((f) => (
            <tr key={f}>
              <th scope="row">{LABELS[f] ?? f}</th>
              {products.map((p) => (
                <td key={p.id + f}>{renderCell(p, f, locale)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: tsc clean**

- [ ] **Step 3: Commit**

```powershell
git add src/app/[locale]/(store)/_components/chat/chat-product-compare.tsx
git commit -m @'
feat(chat): ChatProductCompare table for compareProducts tool result

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 10: ChatToolChip Component

**Files:**
- Create: `src/app/[locale]/(store)/_components/chat/chat-tool-chip.tsx`

Small inline confirmation badge used by navigateTo / applyFilters / addToCart.

- [ ] **Step 1: Implement**

```tsx
// src/app/[locale]/(store)/_components/chat/chat-tool-chip.tsx
"use client";

import styles from "./chat.module.css";

interface Props {
  icon: string;
  label: string;
  detail?: string;
  variant?: "info" | "success" | "warning";
}

export function ChatToolChip({ icon, label, detail, variant = "info" }: Props) {
  const variantClass =
    variant === "success"
      ? styles.toolChipSuccess
      : variant === "warning"
        ? styles.toolChipWarning
        : "";
  return (
    <div className={`${styles.toolChip} ${variantClass}`.trim()} role="status">
      <span aria-hidden="true">{icon}</span>
      <span className={styles.toolChipLabel}>{label}</span>
      {detail && <span className={styles.toolChipDetail}>{detail}</span>}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/app/[locale]/(store)/_components/chat/chat-tool-chip.tsx
git commit -m @'
feat(chat): ChatToolChip inline confirmation badge

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 11: CSS Updates for New Components

**Files:**
- Modify: `src/app/[locale]/(store)/_components/chat/chat.module.css` (append to existing)

- [ ] **Step 1: Append new styles**

Add to the end of the existing `chat.module.css`:

```css
/* --- Product card (T7) --- */
.card {
  width: 200px;
  flex: 0 0 200px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  scroll-snap-align: start;
}
.cardImageLink {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  background: #1a1a1c;
  overflow: hidden;
}
.cardImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.cardImagePlaceholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a1c, #2a2a2c);
}
.cardBody {
  padding: 0.625rem 0.75rem 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}
.cardBrand {
  font-size: 0.6875rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
}
.cardName {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--mm-fg, #f5f5f4);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.25;
  min-height: 2.5em;
}
.cardName:hover { text-decoration: underline; }
.cardFooter {
  margin-top: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding-top: 0.375rem;
}
.cardPrice {
  font-weight: 600;
  font-size: 0.9375rem;
}
.cardOos {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}
.cardCta {
  background: #e10600;
  color: white;
  border: none;
  border-radius: 999px;
  width: 28px;
  height: 28px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  display: grid;
  place-items: center;
}

/* --- Carousel (T8) --- */
.carouselWrap { width: 100%; }
.carousel {
  display: flex;
  gap: 0.625rem;
  overflow-x: auto;
  padding: 0.25rem 0 0.5rem;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
}
.carouselNotFound {
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.5);
  margin: 0.25rem 0 0;
  font-style: italic;
}

/* --- Compare (T9) --- */
.compareWrap {
  width: 100%;
  overflow-x: auto;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.compare {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}
.compare th,
.compare td {
  padding: 0.5rem 0.625rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  vertical-align: top;
}
.compare thead th {
  background: rgba(255, 255, 255, 0.04);
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.compareName {
  color: inherit;
  text-decoration: none;
}
.compareName:hover { text-decoration: underline; }

/* --- Tool chip (T10) --- */
.toolChip {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 999px;
  font-size: 0.8125rem;
  font-style: italic;
  color: rgba(255, 255, 255, 0.7);
}
.toolChipSuccess { color: #4ade80; border-color: rgba(74, 222, 128, 0.3); }
.toolChipWarning { color: #facc15; border-color: rgba(250, 204, 21, 0.3); }
.toolChipLabel { font-style: normal; font-weight: 500; }
.toolChipDetail { opacity: 0.75; }
```

- [ ] **Step 2: Commit**

```powershell
git add src/app/[locale]/(store)/_components/chat/chat.module.css
git commit -m @'
feat(chat): CSS for product cards, carousel, compare, tool chips

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 12: chat-messages.tsx — Render Tool-Result Parts

**Files:**
- Modify: `src/app/[locale]/(store)/_components/chat/chat-messages.tsx` (replace contents)

Render different React components depending on each message part's type/toolName. The AI SDK v6 message parts arrive as `{ type: "text", text }` for prose and `{ type: "tool-<toolName>", state, input, output }` for tool calls.

- [ ] **Step 1: Inspect v6 message part shape**

```powershell
Select-String -Path "node_modules\ai\dist\index.d.ts" -Pattern "UIMessagePart|ToolUIPart" -Context 0,3 | Select-Object -First 30
```

Confirm whether tool parts have type like `tool-${name}` and how `output` is shaped. Adapt code below if the discriminant differs.

- [ ] **Step 2: Replace `chat-messages.tsx`**

```tsx
// src/app/[locale]/(store)/_components/chat/chat-messages.tsx
"use client";

import type { UIMessage } from "ai";
import { ChatProductCarousel } from "./chat-product-carousel";
import { ChatProductCompare } from "./chat-product-compare";
import { ChatToolChip } from "./chat-tool-chip";
import type { ShowProductCardsResult } from "@/lib/chat/tools/show-product-cards";
import type { CompareProductsResult } from "@/lib/chat/tools/compare-products";
import type { AddToCartResult } from "@/lib/chat/tools/add-to-cart";
import styles from "./chat.module.css";

interface Props {
  messages: UIMessage[];
  onAddToCart?: (productId: string) => void;
}

// Discriminator helper — v6 emits tool parts with type "tool-<name>"
function partToolName(part: UIMessage["parts"][number]): string | null {
  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    return part.type.slice("tool-".length);
  }
  return null;
}

function partOutput(part: UIMessage["parts"][number]): unknown {
  // v6: tool parts have state ('input-available' | 'output-available' | ...)
  // and an output field when state is output-available.
  const p = part as unknown as { state?: string; output?: unknown };
  if (p.state === "output-available") return p.output;
  return null;
}

export function ChatMessages({ messages, onAddToCart }: Props) {
  return (
    <div className={styles.messages} role="log" aria-live="polite">
      {messages.length === 0 && (
        <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
          Γεια! Είμαι ο Πιτ. Τι μηχανή έχεις και τι ψάχνεις;
        </div>
      )}
      {messages.map((m) => {
        // Plain text content
        const text = m.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("");

        const bubbleClass =
          m.role === "user"
            ? `${styles.bubble} ${styles.bubbleUser}`
            : `${styles.bubble} ${styles.bubbleAssistant}`;

        return (
          <div key={m.id} className={styles.messageGroup}>
            {text && <div className={bubbleClass}>{text}</div>}

            {m.role === "assistant" &&
              m.parts.map((part, idx) => {
                const toolName = partToolName(part);
                if (!toolName) return null;
                const output = partOutput(part);

                if (toolName === "showProductCards" && output) {
                  const o = output as ShowProductCardsResult;
                  return (
                    <ChatProductCarousel
                      key={`${m.id}-${idx}`}
                      products={o.products}
                      notFound={o.notFound}
                      onAddToCart={onAddToCart}
                    />
                  );
                }

                if (toolName === "compareProducts" && output) {
                  const o = output as CompareProductsResult;
                  return (
                    <ChatProductCompare
                      key={`${m.id}-${idx}`}
                      products={o.products}
                      fields={o.fields}
                    />
                  );
                }

                if (toolName === "navigateTo" && output) {
                  const o = output as { ok: boolean; route?: string; error?: string };
                  return (
                    <ChatToolChip
                      key={`${m.id}-${idx}`}
                      icon="📍"
                      label={o.ok ? "Πήγα στο:" : "Δεν μπόρεσα να πάω:"}
                      detail={o.ok ? o.route : o.error}
                      variant={o.ok ? "success" : "warning"}
                    />
                  );
                }

                if (toolName === "applyFilters" && output) {
                  const o = output as {
                    ok: boolean;
                    appliedKeys?: string[];
                    error?: string;
                  };
                  return (
                    <ChatToolChip
                      key={`${m.id}-${idx}`}
                      icon="🔧"
                      label={o.ok ? "Φίλτρα:" : "Δεν εφάρμοσα φίλτρα:"}
                      detail={o.ok ? o.appliedKeys?.join(", ") : o.error}
                      variant={o.ok ? "success" : "warning"}
                    />
                  );
                }

                if (toolName === "addToCart" && output) {
                  const o = output as AddToCartResult;
                  return (
                    <ChatToolChip
                      key={`${m.id}-${idx}`}
                      icon="🛒"
                      label={o.success ? "Καλάθι:" : "Δεν μπήκε στο καλάθι:"}
                      detail={
                        o.success
                          ? `${o.cartItemCount ?? "?"} προϊόντα στο καλάθι`
                          : o.error
                      }
                      variant={o.success ? "success" : "warning"}
                    />
                  );
                }

                // searchProducts / getProductDetails / checkStock / handoffToHuman
                // are internal — don't render their results to the user.
                return null;
              })}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: tsc clean**

If the v6 part discriminator differs (e.g. `part.type === "tool-invocation"` with `part.toolName`), adapt `partToolName()` / `partOutput()` accordingly. Keep the rest stable.

- [ ] **Step 4: Add `messageGroup` style** (small append to chat.module.css)

```css
.messageGroup {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
```

- [ ] **Step 5: Commit**

```powershell
git add src/app/[locale]/(store)/_components/chat/chat-messages.tsx src/app/[locale]/(store)/_components/chat/chat.module.css
git commit -m @'
feat(chat): render tool-result parts as React components in chat-messages

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 13: useCoPilot Hook (TDD safety + execution)

**Files:**
- Create: `src/app/[locale]/(store)/_components/chat/use-co-pilot.ts`
- Create: `src/app/[locale]/(store)/_components/chat/use-co-pilot.test.ts`

Encapsulates the logic for handling client-side tool calls. Pure function (no hook deps) for the safety/transform layer so it's unit-testable; the hook just wires up `useRouter`/`usePathname` and calls the pure logic.

- [ ] **Step 1: Write the failing test for the pure logic**

```ts
// src/app/[locale]/(store)/_components/chat/use-co-pilot.test.ts
import { describe, it, expect } from "vitest";
import { resolveNavigateTo, resolveApplyFilters } from "./use-co-pilot";

describe("resolveNavigateTo", () => {
  it("returns ok with locale-prefixed route", () => {
    const r = resolveNavigateTo({ route: "/category/kranh", locale: "el", currentPath: "/el" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.target).toBe("/el/category/kranh");
  });
  it("strips an already-prefixed locale", () => {
    const r = resolveNavigateTo({ route: "/en/product/foo", locale: "en", currentPath: "/en" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.target).toBe("/en/product/foo");
  });
  it("refuses admin", () => {
    const r = resolveNavigateTo({ route: "/admin", locale: "el", currentPath: "/el" });
    expect(r.ok).toBe(false);
  });
  it("refuses checkout sub-route", () => {
    const r = resolveNavigateTo({
      route: "/checkout/payment",
      locale: "el",
      currentPath: "/el/checkout",
    });
    expect(r.ok).toBe(false);
  });
});

describe("resolveApplyFilters", () => {
  it("returns ok with target URL on a PLP", () => {
    const r = resolveApplyFilters({
      filters: { color: "black", priceMax: 300 },
      currentPath: "/el/category/kranh",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.target.startsWith("/el/category/kranh?")).toBe(true);
      expect(r.target).toContain("color=black");
      expect(r.target).toContain("price_max=300");
      expect(r.appliedKeys).toContain("color");
      expect(r.appliedKeys).toContain("priceMax");
    }
  });
  it("rejects when not on a PLP route", () => {
    const r = resolveApplyFilters({
      filters: { color: "black" },
      currentPath: "/el",
    });
    expect(r.ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run — expect failures**

```powershell
pnpm exec vitest run src/app/[locale]/(store)/_components/chat/use-co-pilot.test.ts
```

- [ ] **Step 3: Implement**

```ts
// src/app/[locale]/(store)/_components/chat/use-co-pilot.ts
"use client";

import { useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { isRouteAllowed } from "@/lib/chat/tools/navigate-to";
import {
  buildFilterSearchParams,
  isFilterContextAllowed,
  type ChatFilters,
} from "@/lib/chat/tools/apply-filters";

export type CoPilotResult<T extends object = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

interface ResolveNavInput {
  route: string;
  locale: string;
  currentPath: string;
}

export function resolveNavigateTo(
  input: ResolveNavInput,
): CoPilotResult<{ target: string }> {
  if (!isRouteAllowed(input.route)) {
    return { ok: false, error: "forbidden route" };
  }
  // If the model already prefixed the locale, accept as-is.
  const localePrefix = `/${input.locale}`;
  const target = input.route.startsWith(localePrefix + "/") || input.route === localePrefix
    ? input.route
    : input.route.match(/^\/[a-z]{2}(\/|$)/)
      ? input.route
      : `${localePrefix}${input.route === "/" ? "" : input.route}`;
  return { ok: true, target };
}

interface ResolveFiltersInput {
  filters: ChatFilters;
  currentPath: string;
}

export function resolveApplyFilters(
  input: ResolveFiltersInput,
): CoPilotResult<{ target: string; appliedKeys: string[] }> {
  if (!isFilterContextAllowed(input.currentPath)) {
    return {
      ok: false,
      error: "filters are only valid on /category/* pages — navigate there first",
    };
  }
  const params = buildFilterSearchParams(input.filters);
  const appliedKeys = Object.entries(input.filters)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k]) => k);
  const target = `${input.currentPath}?${params.toString()}`;
  return { ok: true, target, appliedKeys };
}

/**
 * Client hook used by the chat provider to execute navigateTo / applyFilters
 * tool calls coming from the stream.
 */
export function useCoPilot() {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const locale = useLocale();

  const navigate = useCallback(
    (route: string): CoPilotResult<{ route: string }> => {
      const r = resolveNavigateTo({ route, locale, currentPath: pathname });
      if (!r.ok) return r;
      router.push(r.target);
      return { ok: true, route: r.target };
    },
    [locale, pathname, router],
  );

  const applyFilters = useCallback(
    (filters: ChatFilters): CoPilotResult<{ appliedKeys: string[] }> => {
      const r = resolveApplyFilters({ filters, currentPath: pathname });
      if (!r.ok) return r;
      router.replace(r.target);
      return { ok: true, appliedKeys: r.appliedKeys };
    },
    [pathname, router],
  );

  return { navigate, applyFilters };
}
```

- [ ] **Step 4: Run — all pass**

- [ ] **Step 5: tsc clean**

- [ ] **Step 6: Commit**

```powershell
git add src/app/[locale]/(store)/_components/chat/use-co-pilot.ts src/app/[locale]/(store)/_components/chat/use-co-pilot.test.ts
git commit -m @'
feat(chat): useCoPilot hook with pure resolveNavigateTo / resolveApplyFilters

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 14: chat-provider.tsx — Wire onToolCall + addToCart Callback

**Files:**
- Modify: `src/app/[locale]/(store)/_components/chat/chat-provider.tsx`

Wires v6 `useChat({ onToolCall })` to run client tools via `useCoPilot()` and feed results back via `addToolResult`.

- [ ] **Step 1: Inspect v6 `onToolCall` shape**

```powershell
Select-String -Path "node_modules\@ai-sdk\react\dist\index.d.ts" -Pattern "onToolCall|addToolResult|ToolCall" -Context 0,3 | Select-Object -First 30
```

The expected v6 surface is approximately:
```ts
useChat({
  onToolCall: async ({ toolCall }) => {
    // toolCall: { toolCallId, toolName, input }
    // ⇒ return value becomes the tool result
  },
});
```
If the actual shape differs (e.g. needs explicit `addToolResult({toolCallId, result})` from the returned API), adapt — the test in Task 13 stays the same because it tests pure logic.

- [ ] **Step 2: Replace chat-provider.tsx**

```tsx
// src/app/[locale]/(store)/_components/chat/chat-provider.tsx
"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

import { useCoPilot } from "./use-co-pilot";
import { useCartSummary } from "./use-cart-summary";

interface ChatContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  chat: ReturnType<typeof useChat>;
  addToCart: (productId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside <ChatProvider>");
  return ctx;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const locale = useLocale();
  const pathname = usePathname() ?? "/";
  const cart = useCartSummary();
  const coPilot = useCoPilot();

  const chat = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        locale,
        pathname,
        cartItemCount: cart.itemCount,
        cartTotalCents: cart.totalCents,
        currency: cart.currency,
      }),
    }),
    onToolCall: async ({ toolCall }) => {
      // Client-side tools — v6 returns the value as the tool result.
      if (toolCall.toolName === "navigateTo") {
        const { route } = toolCall.input as { route: string };
        return coPilot.navigate(route);
      }
      if (toolCall.toolName === "applyFilters") {
        const { filters } = toolCall.input as { filters: Parameters<typeof coPilot.applyFilters>[0] };
        return coPilot.applyFilters(filters);
      }
      // Server tools (searchProducts, addToCart, etc) don't reach onToolCall — they
      // execute server-side and the result arrives in the stream.
      return undefined;
    },
  });

  // Quick add-to-cart from the inline product cards.
  const addToCart = (productId: string) => {
    chat.sendMessage({ text: `Πρόσθεσε στο καλάθι το προϊόν ${productId}` });
  };

  const value: ChatContextValue = {
    isOpen,
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen((v) => !v),
    chat,
    addToCart,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
```

> **Note**: `useCartSummary` is the hook the Sub-Project A T22 implementer extracted. It already exists somewhere — likely in `chat-provider.tsx` itself or co-located. Inspect the file first; if the hook is inline, extract it to its own file `use-cart-summary.ts` as part of this task (the import above expects that file).

- [ ] **Step 3: Extract `useCartSummary` if currently inline**

If `useCartSummary` is currently defined inside `chat-provider.tsx`, move it to a new file:

```ts
// src/app/[locale]/(store)/_components/chat/use-cart-summary.ts
"use client";

import { useEffect, useRef, useState } from "react";

export interface CartSummary {
  itemCount: number;
  totalCents: number;
  currency: string;
}

const DEFAULT: CartSummary = { itemCount: 0, totalCents: 0, currency: "EUR" };

export function useCartSummary(): CartSummary {
  const [summary, setSummary] = useState<CartSummary>(DEFAULT);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    fetch("/api/cart/summary", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.itemCount === "number") setSummary(data);
      })
      .catch(() => {
        // best-effort — chat works fine with zeros
      });
  }, []);

  return summary;
}
```

- [ ] **Step 4: Update chat-panel.tsx to pass addToCart**

`chat-panel.tsx` uses `ChatMessages` — update the rendering call to pass `onAddToCart={addToCart}`:

```tsx
// in chat-panel.tsx (modify only the ChatMessages line)
const { chat, addToCart } = useChatContext();
// ...
<ChatMessages messages={chat.messages} onAddToCart={addToCart} />
```

- [ ] **Step 5: tsc clean + lint**

```powershell
pnpm exec tsc --noEmit
pnpm lint
```

- [ ] **Step 6: Commit**

```powershell
git add src/app/[locale]/(store)/_components/chat/chat-provider.tsx src/app/[locale]/(store)/_components/chat/use-cart-summary.ts src/app/[locale]/(store)/_components/chat/chat-panel.tsx
git commit -m @'
feat(chat): wire onToolCall for client tools + quick add-to-cart from cards

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
'@
```

---

## Task 15: E2E Smoke Verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

```powershell
pnpm test
```
Expected: all chat tests green plus the new ones from Sub-Project B (~25+ new tests). Pre-existing failures from Sub-Project A baseline (2) remain.

- [ ] **Step 2: tsc + lint**

```powershell
pnpm exec tsc --noEmit
pnpm lint
```
Expected: clean for all files under `src/lib/chat/**` and `src/app/[locale]/(store)/_components/chat/**`.

- [ ] **Step 3: Dev server smoke (curl)**

Start the dev server in background:
```powershell
pnpm dev
```
Wait ~10–15 seconds. Then send a multi-tool conversation:

```powershell
curl.exe -i -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{\"messages\":[{\"id\":\"m1\",\"role\":\"user\",\"parts\":[{\"type\":\"text\",\"text\":\"Δείξε μου 3 κράνη touring\"}]}],\"locale\":\"el\",\"pathname\":\"/\"}'
```

Expected: 200 OK + a stream that contains `searchProducts` + `showProductCards` tool-call/tool-result parts visible in the SSE chunks.

- [ ] **Step 4: Manual browser smoke (owner only — your subagent can ask the human)**

If you have access to a browser:
1. `pnpm dev`, open `http://localhost:3000/el`
2. Click the floating chat button.
3. Type: "Βρες μου ένα κράνος touring κάτω από 400€."
4. Expected: streamed reply + a **horizontal carousel of real product cards** inside the chat bubble.
5. Type: "Πάμε στα κράνη".
6. Expected: chip "📍 Πήγα στα: /el/category/kranh", site behind the chat navigates to the category page.
7. Type: "Μόνο μαύρα κάτω από 300".
8. Expected: chip "🔧 Φίλτρα: color, priceMax", URL updates with `?color=black&price_max=300`.
9. Tap "+" on a card.
10. Expected: chip "🛒 Καλάθι: N προϊόντα στο καλάθι".

A subagent driver doesn't have a browser — leave this verification to the human owner after the branch is pushed.

- [ ] **Step 5: Push to origin**

```powershell
git push origin feat/ai-sales-assistant
```

- [ ] **Step 6: Final commit if needed**

If smoke surfaced any last fixes, commit them with descriptive messages and push.

---

## Definition of Done for Sub-Project B

- [ ] All 15 tasks completed and committed on `feat/ai-sales-assistant`.
- [ ] `pnpm test` green (excluding the 2 pre-existing failures inherited from Sub-Project A).
- [ ] `pnpm exec tsc --noEmit` clean.
- [ ] `pnpm lint` clean for chat files.
- [ ] The 5 new tools appear in `chatTools` registry: `showProductCards`, `compareProducts`, `addToCart`, `navigateTo`, `applyFilters`.
- [ ] The base prompt enumerates all 9 tools.
- [ ] `/api/chat` smoke test confirms inline product cards stream into the response.
- [ ] Branch pushed to `origin/feat/ai-sales-assistant`.
- [ ] Manual browser smoke documented (or deferred to owner).

Once this is done, the next planning cycle starts on **Sub-Project C (Persistence + Memory)** — `upsertUserContext`, `recallEarlier`, `getRecentOrders` tools, anonymous→login thread linking, history drawer UI.
