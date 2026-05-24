# i18n + AI Translation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the storefront fully multilingual with SEO-grade per-language URLs (next-intl), UI translated by Claude and catalog translated by an automated AI batch pipeline, launching with 6 locales and scalable to any.

**Architecture:** `next-intl` v4 App Router with a `[locale]` segment and `localePrefix: "as-needed"` (Greek stays at `/`). Two translation layers: static UI via message catalogs (`messages/{locale}.json`) and dynamic catalog via `product_translations` / `category_translations` tables read with an `el` fallback. An engine-swappable batch script fills the catalog.

**Tech Stack:** Next.js 16 (`cacheComponents: true`, turbopack), next-intl 4.9, Supabase (PostgREST + service role), vitest (source-string + unit tests), Claude API (Haiku/Sonnet) for the catalog pipeline.

**Spec:** `docs/superpowers/specs/2026-05-25-i18n-ai-translation-design.md`
**Branch:** `feat/i18n` (already created).

---

## ⚠️ Cross-cutting rules (read before every task)

- **Next 16 is non-standard** (see `AGENTS.md`). Before the routing tasks (7–10), skim `node_modules/next/dist/docs/` for App Router layouts/i18n. If an API differs from this plan, prefer the installed docs and note the deviation.
- **`components.css` CRLF trap:** after editing `src/app/(store)/_styles/components.css` (or after any `git checkout`/merge), normalize to LF or the reveal/hero source-string tests break:
  ```bash
  node -e "const fs=require('fs');const f='src/app/(store)/_styles/components.css';fs.writeFileSync(f,fs.readFileSync(f,'latin1').replace(/\r\n/g,'\n'),'latin1')"
  ```
- **Verify with `pnpm build`, not just `tsc`** — Next typechecks `scripts/` too.
- **Mobile-first:** the language switcher must be verified on a phone viewport (project rule).
- **Never push to `main`** without explicit per-deploy authorization. Work stays on `feat/i18n`.
- After each task: `pnpm exec tsc --noEmit` + `pnpm vitest run` must stay green, then commit.

---

## File Structure

**New files**
```
src/i18n/routing.ts                 # defineRouting (locales, defaultLocale, localePrefix)
src/i18n/navigation.ts              # createNavigation → locale-aware Link/redirect/usePathname/useRouter
src/i18n/request.ts                 # getRequestConfig → loads messages per request
src/i18n/metadata.ts               # buildAlternates() helper for hreflang/canonical
messages/{el,en,bg,sr,ro,sq}.json   # UI message catalogs
src/app/[locale]/layout.tsx         # html + fonts + NextIntlClientProvider (localized subtree)
src/app/admin/layout.tsx            # html + fonts for non-localized admin
src/app/[locale]/(store)/…          # moved from src/app/(store)/…
src/app/[locale]/sitemap.ts         # per-locale sitemap (or app/sitemap.ts emitting all locales)
src/app/(store)/_components/shell/language-switcher.tsx
supabase/migrations/20260525000001_catalog_translations.sql
src/lib/i18n/glossary.ts            # non-translatable terms
src/lib/i18n/translate-engine.ts    # engine-agnostic translate() interface + Claude adapter
scripts/translate-catalog.ts        # batch fill of product/category translations
src/lib/i18n/glossary.test.ts
scripts/translate-catalog.test.ts
```

**Modified files**
```
next.config.ts                      # wrap with createNextIntlPlugin
src/middleware.ts                   # compose intl middleware + existing supabase auth
src/app/layout.tsx                  # becomes pass-through (return children); fonts/metadata move out
src/app/(store)/_components/shell/v3-provider.tsx   # drop dead lang state
src/lib/queries/products.ts         # locale param + translation join + COALESCE
src/lib/queries/categories.ts       # locale param + translation join + COALESCE
src/types/database.ts               # add translation tables
~41 (store) components              # hardcoded Greek → t("…")
```

---

## Phase 1 — next-intl foundation

### Task 1: Routing config

**Files:**
- Create: `src/i18n/routing.ts`
- Test: `src/i18n/routing.test.ts`

- [ ] **Step 1: Write the failing test**
```ts
import { describe, it, expect } from "vitest";
import { routing } from "./routing";

describe("routing", () => {
  it("uses el as default and ships the 6 launch locales", () => {
    expect(routing.defaultLocale).toBe("el");
    expect(routing.locales).toEqual(["el", "en", "bg", "sr", "ro", "sq"]);
  });
  it("keeps Greek unprefixed (as-needed)", () => {
    expect(routing.localePrefix).toBe("as-needed");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run src/i18n/routing.test.ts`
Expected: FAIL — cannot find module `./routing`.

- [ ] **Step 3: Write minimal implementation**
```ts
import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./config";

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: "as-needed",
  localeCookie: { name: "NEXT_LOCALE" },
});
```

- [ ] **Step 4: Run test to verify it passes**
Run: `pnpm vitest run src/i18n/routing.test.ts` → PASS.

- [ ] **Step 5: Commit**
```bash
git add src/i18n/routing.ts src/i18n/routing.test.ts
git commit -m "feat(i18n): add next-intl routing config"
```

### Task 2: Navigation helpers

**Files:**
- Create: `src/i18n/navigation.ts`

- [ ] **Step 1: Implement** (no separate test — exercised via build/components later)
```ts
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 2: Typecheck**
Run: `pnpm exec tsc --noEmit` → no new errors.

- [ ] **Step 3: Commit**
```bash
git add src/i18n/navigation.ts
git commit -m "feat(i18n): add locale-aware navigation helpers"
```

### Task 3: Request config (per-request messages)

**Files:**
- Create: `src/i18n/request.ts`

- [ ] **Step 1: Implement**
```ts
import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

- [ ] **Step 2: Commit** (build verified after Task 5 when messages exist)
```bash
git add src/i18n/request.ts
git commit -m "feat(i18n): add next-intl request config"
```

### Task 4: Wire the next-intl plugin

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Edit** — add the plugin import at top and wrap the export. Keep `cacheComponents` and `turbopack` untouched.
```ts
import createNextIntlPlugin from "next-intl/plugin";
// …existing imports + nextConfig unchanged…
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
export default withNextIntl(nextConfig);
```

- [ ] **Step 2: Commit**
```bash
git add next.config.ts
git commit -m "build(i18n): wire next-intl plugin"
```

### Task 5: Message-catalog scaffolding

**Files:**
- Create: `messages/el.json`, `messages/en.json`, `messages/bg.json`, `messages/sr.json`, `messages/ro.json`, `messages/sq.json`
- Test: `messages/messages.test.ts`

- [ ] **Step 1: Write the failing test** (every locale must have the same keys as `el`)
```ts
import { describe, it, expect } from "vitest";
import el from "./el.json";
import en from "./en.json";
import bg from "./bg.json";
import sr from "./sr.json";
import ro from "./ro.json";
import sq from "./sq.json";

const flat = (o: object, p = ""): string[] =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === "object" ? flat(v, `${p}${k}.`) : [`${p}${k}`],
  );

describe("message catalogs", () => {
  const base = flat(el).sort();
  it.each([["en", en], ["bg", bg], ["sr", sr], ["ro", ro], ["sq", sq]])(
    "%s has the same keys as el",
    (_name, cat) => {
      expect(flat(cat).sort()).toEqual(base);
    },
  );
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run messages/messages.test.ts` → FAIL (files missing).

- [ ] **Step 3: Create `messages/el.json`** with an initial structure (extend in Task 12). Seed with a few real keys so the provider has content:
```json
{
  "common": {
    "addToCart": "Προσθήκη στο καλάθι",
    "outOfStock": "Εξαντλήθηκε",
    "search": "Αναζήτηση",
    "account": "Λογαριασμός",
    "cart": "Καλάθι"
  },
  "nav": {
    "home": "Αρχική"
  },
  "lang": {
    "switcherLabel": "Γλώσσα"
  }
}
```

- [ ] **Step 4: Create the other 5 files.** Claude (the implementer) translates the `el` values per locale — same keys, translated strings. `en.json` example:
```json
{
  "common": {
    "addToCart": "Add to cart",
    "outOfStock": "Out of stock",
    "search": "Search",
    "account": "Account",
    "cart": "Cart"
  },
  "nav": { "home": "Home" },
  "lang": { "switcherLabel": "Language" }
}
```
Repeat for `bg`, `sr`, `ro`, `sq` (translate the values; keep keys identical). For the launch, `el` + `en` are authoritative; `bg/sr/ro/sq` may start as machine-translated and be refined.

- [ ] **Step 5: Run test to verify it passes**
Run: `pnpm vitest run messages/messages.test.ts` → PASS.

- [ ] **Step 6: Commit**
```bash
git add messages/
git commit -m "feat(i18n): scaffold message catalogs for 6 locales with key-parity test"
```

### Task 6: Compose i18n + auth middleware

**Files:**
- Modify: `src/middleware.ts`

> The existing middleware does Supabase auth + protected-path redirects. We must run next-intl's middleware (locale detect/redirect + cookie) and keep auth working with locale-prefixed paths (`/en/account`).

- [ ] **Step 1: Rewrite `src/middleware.ts`**
```ts
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const PROTECTED_PATHS = ["/account", "/admin"];
const AUTH_PATHS = ["/login", "/register"];

// strip a leading locale segment (e.g. /en/account -> /account)
function stripLocale(pathname: string): string {
  const seg = pathname.split("/")[1];
  if ((routing.locales as readonly string[]).includes(seg)) {
    return pathname.slice(seg.length + 1) || "/";
  }
  return pathname;
}

export async function middleware(request: NextRequest) {
  // 1) Let next-intl handle locale detection/redirect + NEXT_LOCALE cookie.
  const intlResponse = intlMiddleware(request);
  // If next-intl issued a redirect (e.g. to add a prefix), honor it immediately.
  if (intlResponse.headers.get("location")) return intlResponse;

  // 2) Run Supabase auth on top, copying intl's headers/cookies forward.
  let response = intlResponse;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = stripLocale(request.nextUrl.pathname);
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login"; // intl middleware re-prefixes on the next pass
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (isAuthPage && user) {
    const nextPath =
      request.nextUrl.searchParams.get("next") ?? "/account";
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = nextPath;
    redirectUrl.searchParams.delete("next");
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Manual smoke** (after Phase 2 the routing exists). Note in the task: re-verify `/account` redirects to `/login?next=` and `/en/account` redirects to `/en/login?next=` after Task 10.

- [ ] **Step 3: Commit**
```bash
git add src/middleware.ts
git commit -m "feat(i18n): compose next-intl middleware with supabase auth"
```

---

## Phase 2 — Routing migration (structural)

> Goal: a `[locale]` subtree owns `<html>`; the root layout becomes a pass-through. Admin keeps its own html. **Read `node_modules/next/dist/docs/` first.**

### Task 7: Root layout → pass-through + shared chrome module

**Files:**
- Create: `src/app/_chrome.tsx` (shared fonts + base metadata)
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create `src/app/_chrome.tsx`** — move the font defs + exported `baseMetadata`/`viewport` out of the old root layout so both `[locale]/layout.tsx` and `admin/layout.tsx` reuse them.
```tsx
import type { Metadata, Viewport } from "next";
import { Russo_One, Chakra_Petch } from "next/font/google";

export const russoOne = Russo_One({
  weight: "400", subsets: ["latin"], variable: "--font-russo", display: "optional",
});
export const chakraPetch = Chakra_Petch({
  weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-chakra", display: "optional",
});
export const fontVars = `${russoOne.variable} ${chakraPetch.variable}`;

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#050608" },
    { media: "(prefers-color-scheme: dark)", color: "#050608" },
  ],
  width: "device-width",
  initialScale: 1,
};
```

- [ ] **Step 2: Replace `src/app/layout.tsx` with a pass-through** (no `<html>`; a descendant layout renders it):
```tsx
import "@/app/globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
```

- [ ] **Step 3: Verify** `pnpm exec tsc --noEmit` clean. (Build is checked after Task 10.)

- [ ] **Step 4: Commit**
```bash
git add src/app/_chrome.tsx src/app/layout.tsx
git commit -m "refactor(i18n): make root layout a pass-through; extract shared chrome"
```

### Task 8: `[locale]/layout.tsx`

**Files:**
- Create: `src/app/[locale]/layout.tsx`

- [ ] **Step 1: Implement**
```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { fontVars, viewport } from "@/app/_chrome";
import { Providers } from "@/app/providers";

export { viewport };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: { default: t("title"), template: `%s | MotoMarket` },
    description: t("description"),
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning className={fontVars}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider>
          {children}
          <Providers />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Add `meta` namespace** to all 6 catalogs (key parity test will enforce it). `el`:
```json
"meta": {
  "title": "MotoMarket - Premium εξοπλισμός μοτοσυκλέτας",
  "description": "Premium e-shop για εξοπλισμό αναβάτη και μοτοσυκλέτας: κράνη, μπουφάν, γάντια, μπότες, αξεσουάρ και ανταλλακτικά."
}
```
(Translate for the other 5.) Run `pnpm vitest run messages/messages.test.ts` → PASS.

- [ ] **Step 3: Commit**
```bash
git add src/app/[locale]/layout.tsx messages/
git commit -m "feat(i18n): add [locale] layout with provider, fonts, metadata"
```

### Task 9: Admin keeps its own html

**Files:**
- Create: `src/app/admin/layout.tsx`

- [ ] **Step 1: Implement** (admin is not localized; render html with the shared fonts; default lang `el`)
```tsx
import "@/app/globals.css";
import { fontVars, viewport } from "@/app/_chrome";

export { viewport };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="el" suppressHydrationWarning className={fontVars}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Check `src/app/auth/`** — if it contains a page (not just a route handler), give it the same treatment or move it under `[locale]`. Route handlers (`route.ts`) need nothing.

- [ ] **Step 3: Commit**
```bash
git add src/app/admin/layout.tsx
git commit -m "feat(i18n): give admin its own html layout (non-localized)"
```

### Task 10: Move `(store)` under `[locale]` + fix internal navigation

**Files:**
- Move: `src/app/(store)/` → `src/app/[locale]/(store)/`
- Modify: internal `next/link` imports across the moved tree → `@/i18n/navigation`

- [ ] **Step 1: Kill any dev server first** (PowerShell), then move with git so history is kept:
```bash
git mv "src/app/(store)" "src/app/[locale]/(store)"
```

- [ ] **Step 2: Swap `Link` + navigation imports.** In the moved tree, replace `import Link from "next/link"` with `import { Link } from "@/i18n/navigation"`, and `useRouter`/`usePathname`/`redirect` from `next/navigation` with the `@/i18n/navigation` equivalents **for app navigation** (keep `next/navigation` only for `notFound`, `useSearchParams`, `useParams`). Find them:
```bash
grep -rln "from \"next/link\"\|from 'next/link'" "src/app/[locale]/(store)"
grep -rln "useRouter\|usePathname\|\bredirect\b" "src/app/[locale]/(store)"
```
Edit each. The next-intl `Link`/`useRouter` automatically prefix the active locale, so existing `href="/category/x"` keeps working and becomes `/en/category/x` under `en`.

- [ ] **Step 3: Normalize `components.css`** (the move may flip line endings):
```bash
node -e "const fs=require('fs');const f='src/app/[locale]/(store)/_styles/components.css';fs.writeFileSync(f,fs.readFileSync(f,'latin1').replace(/\r\n/g,'\n'),'latin1')"
```

- [ ] **Step 4: Verify build + tests**
Run: `pnpm exec tsc --noEmit` → clean.
Run: `pnpm vitest run` → all green (test files moved with the tree).
Run: `pnpm build` → exit 0. Then `npx next start -p 3000` and check `/` (el), `/en`, `/en/category/<slug>` render 200 with products.
Expected: localized routes serve; `/` unchanged for Greek.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "refactor(i18n): move storefront under [locale] segment + locale-aware links"
```

---

## Phase 3 — Language switcher

### Task 11: LanguageSwitcher + drop dead `lang` state

**Files:**
- Create: `src/app/[locale]/(store)/_components/shell/language-switcher.tsx`
- Modify: `src/app/[locale]/(store)/_components/shell/v3-provider.tsx` (remove `lang`/`setLang`)
- Modify: the shell/header that currently renders the EL/EN toggle

- [ ] **Step 1: Write the failing test** (source-string test, matches repo convention)
```ts
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const src = readFileSync(
  "src/app/[locale]/(store)/_components/shell/language-switcher.tsx",
  "utf8",
);
describe("language-switcher", () => {
  it("uses next-intl navigation, not next/navigation", () => {
    expect(src).toContain('from "@/i18n/navigation"');
  });
  it("offers every routing locale", () => {
    expect(src).toContain("routing.locales");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**
Run: `pnpm vitest run "src/app/[locale]/(store)/_components/shell/language-switcher.test.ts"` → FAIL.

- [ ] **Step 3: Implement the switcher** (preserves the current path, swaps locale, sets cookie via next-intl)
```tsx
"use client";

import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { localeNames } from "@/i18n/config";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  return (
    <select
      aria-label={localeNames[locale as keyof typeof localeNames]}
      value={locale}
      onChange={(e) =>
        router.replace(
          // @ts-expect-error -- pathname+params is the documented next-intl pattern
          { pathname, params },
          { locale: e.target.value },
        )
      }
      className="v3-lang-switch"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l}>
          {localeNames[l]}
        </option>
      ))}
    </select>
  );
}
```

- [ ] **Step 4: Run test to verify it passes** → PASS.

- [ ] **Step 5: Remove dead `lang` state from `v3-provider.tsx`** — delete the `lang`/`setLang` fields from the context type, the `useState<"el"|"en">`, and the provider value entries. Replace any consumer of `lang` with `useLocale()` from `next-intl`, and any consumer of `setLang` with `<LanguageSwitcher />`.
```bash
grep -rln "useMM().*lang\|\.lang\b\|setLang" "src/app/[locale]/(store)"
```

- [ ] **Step 6: Render `<LanguageSwitcher />`** where the old EL/EN toggle lived in the shell/header. Verify on a phone viewport (mobile-first rule).

- [ ] **Step 7: Verify + commit**
Run: `pnpm exec tsc --noEmit` + `pnpm vitest run` → green.
```bash
git add -A
git commit -m "feat(i18n): URL-based language switcher; remove dead lang toggle"
```

---

## Phase 4 — UI translation (Layer A)

### Task 12: Extract hardcoded Greek → message keys

> ~719 Greek string literals across ~41 `(store)` components. This is iterative; do it file-by-file with the pattern below. Each commit covers a few related files so review stays small.

**Method (apply per file):**
1. List Greek literals in the file:
   ```bash
   grep -nP "[Α-Ωα-ωάέίόύήώϊϋΐΰ]{2,}" <file>
   ```
2. For each user-visible string, add a key under a namespace named after the component area (e.g. `pdp`, `plp`, `cart`, `checkout`, `home.newsletter`) in **`messages/el.json`** with the Greek as the value, then the translated value in the other 5 catalogs (key-parity test enforces completeness).
3. In the component, read it:
   - **Client component:** `import { useTranslations } from "next-intl"; const t = useTranslations("pdp");` → `t("addToCart")`.
   - **Server component:** `import { getTranslations } from "next-intl/server"; const t = await getTranslations("pdp");`
4. Leave non-UI Greek (code comments, data values from Supabase) untouched — only translate literals rendered to users.

**Worked example** — `…/_components/commerce/product-card.tsx` (client): replace
```tsx
<button>Προσθήκη στο καλάθι</button>
<span>{outOfStock ? "Εξαντλήθηκε" : "Διαθέσιμο"}</span>
```
with
```tsx
const t = useTranslations("common");
// …
<button>{t("addToCart")}</button>
<span>{outOfStock ? t("outOfStock") : t("inStock")}</span>
```
and add `common.inStock` to all 6 catalogs.

- [ ] **Step 1: Build the file checklist**
```bash
grep -rlP "[Α-Ωα-ωάέίόύήώ]{2,}" "src/app/[locale]/(store)" --include="*.tsx" > /tmp/i18n-files.txt
cat /tmp/i18n-files.txt
```

- [ ] **Step 2..N: Per file (or small group): extract → add keys to all 6 catalogs → switch to `t()` → run `pnpm vitest run messages/messages.test.ts` (key parity) + `pnpm exec tsc --noEmit` → commit.**
Example commit:
```bash
git add -A && git commit -m "i18n(ui): translate product card + plp grid strings"
```

- [ ] **Final step: full sweep verification**
Run: `grep -rcP "[Α-Ωα-ωάέίόύήώ]{2,}" "src/app/[locale]/(store)" --include="*.tsx"` — remaining matches should be comments/data only.
Run: `pnpm vitest run` + `pnpm build` → green.

---

## Phase 5 — SEO

### Task 13: hreflang + canonical helper

**Files:**
- Create: `src/i18n/metadata.ts`
- Modify: `generateMetadata` in `[locale]/(store)/product/[slug]/page.tsx`, `category/[slug]/page.tsx`, and the home page.

- [ ] **Step 1: Write the failing test**
```ts
import { describe, it, expect } from "vitest";
import { buildAlternates } from "./metadata";

describe("buildAlternates", () => {
  it("emits canonical for the locale and hreflang for all + x-default", () => {
    const a = buildAlternates("en", "/category/helmets");
    expect(a.canonical).toBe("/en/category/helmets");
    expect(a.languages["el"]).toBe("/category/helmets");
    expect(a.languages["bg"]).toBe("/bg/category/helmets");
    expect(a.languages["x-default"]).toBe("/category/helmets");
  });
});
```

- [ ] **Step 2: Run → FAIL.**
Run: `pnpm vitest run src/i18n/metadata.test.ts`

- [ ] **Step 3: Implement** (Greek is unprefixed because of `as-needed`)
```ts
import { routing } from "./routing";

export function buildAlternates(locale: string, path: string) {
  const url = (l: string) =>
    l === routing.defaultLocale ? path : `/${l}${path}`;

  const languages: Record<string, string> = {};
  for (const l of routing.locales) languages[l] = url(l);
  languages["x-default"] = url(routing.defaultLocale);

  return { canonical: url(locale), languages };
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Use it** in each localized `generateMetadata`, e.g. product page:
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const { locale, slug } = await params;
  const product = await getProduct(slug, locale);
  // …title/description from translated product…
  return { /* … */, alternates: buildAlternates(locale, `/product/${slug}`) };
}
```

- [ ] **Step 6: Commit**
```bash
git add src/i18n/metadata.ts src/i18n/metadata.test.ts "src/app/[locale]/(store)"
git commit -m "feat(seo): hreflang + canonical alternates per locale"
```

### Task 14: Per-locale sitemap

**Files:**
- Create: `src/app/sitemap.ts`

- [ ] **Step 1: Implement** — emit each route for every locale (Greek unprefixed). Reuse `getPopularProductSlugs()` + category slugs.
```ts
import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getPopularProductSlugs } from "@/lib/queries/products";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";

function urls(path: string): MetadataRoute.Sitemap[number]["alternates"] {
  const languages: Record<string, string> = {};
  for (const l of routing.locales)
    languages[l] = l === routing.defaultLocale ? `${BASE}${path}` : `${BASE}/${l}${path}`;
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await getPopularProductSlugs();
  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, alternates: urls("/") },
    ...slugs.map((s) => ({
      url: `${BASE}/product/${s}`,
      alternates: urls(`/product/${s}`),
    })),
  ];
  return entries;
}
```

- [ ] **Step 2: Verify** `next build` lists `/sitemap.xml`; spot-check it contains `/en/...` alternates.

- [ ] **Step 3: Commit**
```bash
git add src/app/sitemap.ts
git commit -m "feat(seo): per-locale sitemap with hreflang alternates"
```

---

## Phase 6 — Catalog translation: schema + read path (Layer B)

### Task 15: Translation tables migration

**Files:**
- Create: `supabase/migrations/20260525000001_catalog_translations.sql`

- [ ] **Step 1: Write the migration**
```sql
create table if not exists product_translations (
  product_id   bigint not null references products(id) on delete cascade,
  locale       text   not null,
  name         text,
  description  text,
  source_hash  text,
  engine       text,
  translated_at timestamptz not null default now(),
  primary key (product_id, locale)
);
create index if not exists idx_product_translations_locale on product_translations(locale);

create table if not exists category_translations (
  category_id      bigint not null references categories(id) on delete cascade,
  locale           text   not null,
  name             text,
  description      text,
  meta_title       text,
  meta_description text,
  source_hash      text,
  engine           text,
  translated_at    timestamptz not null default now(),
  primary key (category_id, locale)
);
create index if not exists idx_category_translations_locale on category_translations(locale);

alter table product_translations enable row level security;
alter table category_translations enable row level security;

create policy "public read product_translations" on product_translations for select using (true);
create policy "public read category_translations" on category_translations for select using (true);
-- writes happen only via the service-role key (bypasses RLS); no write policy needed.
```

- [ ] **Step 2: Apply** — the user runs it on Supabase (or `pnpm supabase db push`). Confirm tables exist:
```bash
node -e 'require("fs");/* curl product_translations?select=product_id&limit=0 returns 200 */'
```
(Use the REST check pattern from `reference-supabase-access` memory.)

- [ ] **Step 3: Commit**
```bash
git add supabase/migrations/20260525000001_catalog_translations.sql
git commit -m "feat(i18n): product/category translation tables + RLS"
```

### Task 16: Database types

**Files:**
- Modify: `src/types/database.ts`

- [ ] **Step 1: Regenerate** (preferred): `pnpm db:types` if available. Otherwise add the two table types by hand mirroring the migration (Row/Insert/Update with the columns above).

- [ ] **Step 2: Verify** `pnpm exec tsc --noEmit` clean.

- [ ] **Step 3: Commit**
```bash
git add src/types/database.ts
git commit -m "chore(i18n): add translation tables to database types"
```

### Task 17: Locale-aware reads with `el` fallback

**Files:**
- Modify: `src/lib/queries/products.ts` (`getProduct`, `getProductsByCategory`, `searchProducts`, `getRelatedProducts`)
- Modify: `src/lib/queries/categories.ts` (`getCategory`, `getSubcategories`, `getCategoryBreadcrumbs`)

- [ ] **Step 1: Write the failing test** for the merge helper
```ts
import { describe, it, expect } from "vitest";
import { applyTranslation } from "./products";

describe("applyTranslation", () => {
  it("overlays translated fields, falling back to source when missing", () => {
    const base = { id: 1, name: "Κράνη", description: "Περιγραφή" };
    expect(applyTranslation(base, { name: "Helmet", description: null })).toMatchObject({
      name: "Helmet",
      description: "Περιγραφή",
    });
  });
  it("returns the source unchanged for the default locale", () => {
    const base = { id: 1, name: "Κράνη", description: "Περιγραφή" };
    expect(applyTranslation(base, undefined)).toEqual(base);
  });
});
```

- [ ] **Step 2: Run → FAIL.**
Run: `pnpm vitest run src/lib/queries/products.test.ts`

- [ ] **Step 3: Implement `applyTranslation` + thread `locale`.** Add an exported helper and a `locale` param (default `"el"`). When `locale !== "el"`, fetch matching rows from `product_translations` (keyed by id) and overlay with `COALESCE` semantics:
```ts
import type { Locale } from "@/i18n/config";

export function applyTranslation<T extends { name: string; description?: string | null }>(
  base: T,
  tr: { name?: string | null; description?: string | null } | undefined,
): T {
  if (!tr) return base;
  return {
    ...base,
    name: tr.name ?? base.name,
    description: tr.description ?? base.description ?? null,
  };
}
```
For list queries, batch-fetch translations with `.in("product_id", ids).eq("locale", locale)` and map by id. Keep `"use cache"`; add `locale` to the `cacheTag` (e.g. `cacheTag(\`products:${categorySlug}:${locale}\`)`).
Signature change example: `export async function getProduct(slug: string, locale: Locale = "el")`.

- [ ] **Step 4: Run → PASS.** Update the page callers to pass `locale` (from `await params`).

- [ ] **Step 5: Verify + commit**
Run: `pnpm exec tsc --noEmit` + `pnpm vitest run` + `pnpm build` → green.
```bash
git add src/lib/queries/products.ts src/lib/queries/categories.ts src/lib/queries/products.test.ts "src/app/[locale]/(store)"
git commit -m "feat(i18n): locale-aware catalog reads with el fallback"
```

---

## Phase 7 — AI translation pipeline

### Task 18: Glossary + engine interface

**Files:**
- Create: `src/lib/i18n/glossary.ts`, `src/lib/i18n/translate-engine.ts`
- Test: `src/lib/i18n/glossary.test.ts`

- [ ] **Step 1: Write the failing test**
```ts
import { describe, it, expect } from "vitest";
import { protectGlossary, restoreGlossary } from "./glossary";

describe("glossary", () => {
  it("masks non-translatable terms and restores them verbatim", () => {
    const { masked, map } = protectGlossary("Κράνος Shoei GT-Air II μέγεθος XL");
    expect(masked).not.toContain("Shoei");
    expect(restoreGlossary(masked, map)).toContain("Shoei");
    expect(restoreGlossary(masked, map)).toContain("XL");
  });
});
```

- [ ] **Step 2: Run → FAIL.**
Run: `pnpm vitest run src/lib/i18n/glossary.test.ts`

- [ ] **Step 3: Implement glossary** — replace brand/model/size/unit tokens with placeholders before translating, restore after. Seed brands from the DB `brands` table + a static list of sizes/units/CE levels.
```ts
const STATIC_TERMS = ["XS","S","M","L","XL","XXL","XXXL","CE","Level 1","Level 2","mm","cm","kg","L"];

export function protectGlossary(text: string, brands: string[] = []) {
  const terms = [...brands, ...STATIC_TERMS].filter(Boolean)
    .sort((a, b) => b.length - a.length);
  const map: Record<string, string> = {};
  let masked = text;
  terms.forEach((term, i) => {
    const token = `⟦${i}⟧`;
    const re = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    if (re.test(masked)) { masked = masked.replace(re, token); map[token] = term; }
  });
  return { masked, map };
}

export function restoreGlossary(text: string, map: Record<string, string>) {
  let out = text;
  for (const [token, term] of Object.entries(map)) out = out.split(token).join(term);
  return out;
}
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Implement engine interface** `src/lib/i18n/translate-engine.ts`
```ts
export interface TranslateRequest {
  texts: string[];
  targetLocale: string;
  kind: "name" | "description" | "meta";
}
export interface TranslateEngine {
  name: string;
  translate(req: TranslateRequest): Promise<string[]>;
}

// Claude adapter: Haiku for description, Sonnet for name/meta.
export function createClaudeEngine(apiKey: string): TranslateEngine {
  const model = (kind: string) =>
    kind === "description" ? "claude-haiku-4-5-20251001" : "claude-sonnet-4-6";
  return {
    name: "claude",
    async translate({ texts, targetLocale, kind }) {
      // Batch via the Anthropic SDK with a system prompt that forbids translating
      // ⟦n⟧ placeholder tokens and asks for a JSON array out, same length/order.
      // (Implementation detail: use messages.create with model(kind); parse JSON.)
      throw new Error("wire Anthropic SDK here");
    },
  };
}
```
> Note: the actual Anthropic SDK wiring is done in Task 19; this file defines the contract. Keep it engine-swappable (a Google/DeepL adapter can implement the same interface later).

- [ ] **Step 6: Commit**
```bash
git add src/lib/i18n/glossary.ts src/lib/i18n/glossary.test.ts src/lib/i18n/translate-engine.ts
git commit -m "feat(i18n): glossary masking + engine interface"
```

### Task 19: translate-catalog script

**Files:**
- Create: `scripts/translate-catalog.ts`
- Test: `scripts/translate-catalog.test.ts`

- [ ] **Step 1: Write the failing test** for the change-detection helper
```ts
import { describe, it, expect } from "vitest";
import { sourceHash, needsTranslation } from "./translate-catalog";

describe("translate-catalog", () => {
  it("hashes the source fields deterministically", () => {
    expect(sourceHash({ name: "a", description: "b" }))
      .toBe(sourceHash({ name: "a", description: "b" }));
  });
  it("flags rows whose source changed or have no translation", () => {
    const h = sourceHash({ name: "a", description: "b" });
    expect(needsTranslation({ name: "a", description: "b" }, undefined)).toBe(true);
    expect(needsTranslation({ name: "a", description: "b" }, { source_hash: h })).toBe(false);
    expect(needsTranslation({ name: "a", description: "X" }, { source_hash: h })).toBe(true);
  });
});
```

- [ ] **Step 2: Run → FAIL.**
Run: `pnpm vitest run scripts/translate-catalog.test.ts`

- [ ] **Step 3: Implement.** Export `sourceHash` + `needsTranslation`; the runner: read active products (paginate), compute which `needsTranslation` for the target locale, mask glossary, call the engine in batches, restore, upsert into `product_translations` with `source_hash`/`engine`. CLI flags: `--locale=en`, `--sample=20`, `--field=all|name|description`, `--limit=N`. Idempotent: re-running translates only changed/missing rows. Anthropic SDK wired here into `createClaudeEngine`.
```ts
import { createHash } from "node:crypto";
export const sourceHash = (s: { name: string; description?: string | null }) =>
  createHash("sha1").update(`${s.name} ${s.description ?? ""}`).digest("hex");
export const needsTranslation = (
  src: { name: string; description?: string | null },
  tr: { source_hash?: string | null } | undefined,
) => !tr || tr.source_hash !== sourceHash(src);
// …runner reads .env, Supabase service client, batches, upserts…
```

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit**
```bash
git add scripts/translate-catalog.ts scripts/translate-catalog.test.ts
git commit -m "feat(i18n): catalog translation batch script (resumable, idempotent)"
```

### Task 20: Validation gate (sample run)

- [ ] **Step 1: Dry sample for English**
Run: `pnpm tsx scripts/translate-catalog.ts --locale=en --sample=20`
Expected: 20 products get `product_translations` rows for `en`.

- [ ] **Step 2: Review quality** — fetch the 20 EN rows and read them (user-facing checkpoint). If acceptable, proceed; if not, adjust the system prompt/glossary and re-run (idempotent overwrites because source_hash is unchanged but you can force with `--force`).

- [ ] **Step 3: No commit** (data, not code). Record the decision in the session notes.

---

## Phase 8 — Scale & final verification

### Task 21: Run full catalog + remaining locales

- [ ] **Step 1: English full run**
Run: `pnpm tsx scripts/translate-catalog.ts --locale=en`
Then visit `/en/category/<slug>` and a `/en/product/<slug>` on `next start` — translated text shows, no `el` leakage on covered fields.

- [ ] **Step 2: Finalize UI catalogs** for `bg/sr/ro/sq` (refine the machine-seeded values from Task 5/12). Key-parity test stays green.

- [ ] **Step 3: Run catalog batches** for `bg`, `sr`, `ro`, `sq` (repeat Step 1 per locale). These cost ~€9/locale; run when ready.

### Task 22: Full verification

- [ ] **Step 1:** `pnpm exec tsc --noEmit` → clean.
- [ ] **Step 2:** `pnpm vitest run` → all green (incl. key-parity, glossary, applyTranslation, switcher, alternates).
- [ ] **Step 3:** `pnpm build` → exit 0.
- [ ] **Step 4:** `npx next start -p 3000` and verify: `/` (el, unprefixed), `/en`, `/bg/category/<slug>`; switcher preserves path; `view-source` shows `hreflang` alternates + localized `<title>`; `/sitemap.xml` lists locale alternates.
- [ ] **Step 5:** Mobile viewport (390px) check of the switcher + a PLP/PDP.
- [ ] **Step 6: Final commit**
```bash
git add -A
git commit -m "test(i18n): full verification pass"
```

---

## Self-review notes (spec coverage)

- SEO model (§2 spec): localePrefix as-needed (T1), hreflang/canonical (T13), per-locale sitemap (T14), localized metadata (T8/T13). ✓
- Two layers (§4.2): message catalogs (T5/T12) + translation tables (T15/T17). ✓
- AI pipeline (§4.4): glossary (T18), engine-swappable (T18), Haiku+Sonnet hybrid (T18), resumable/idempotent + source_hash (T19), validation gate (T20). ✓
- Query layer (§4.5): locale + join + COALESCE + per-locale cacheTag (T17). ✓
- Switcher (§4.6): T11. ✓
- Slugs (§4.7): el slug reused across locales — no slug task needed (paths unchanged). ✓
- Out of scope: image mirror (#2), Entersoft stock (#3) — not in this plan. ✓
