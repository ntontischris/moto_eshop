# MotoMarket — ROADMAP (single source of truth)

_Ενημέρωση: 2026-05-21. Αντικαθιστά & συγχωνεύει τα παλιά: `MOTOMARKET_MASTER_PLAN.md`, `MOTOMARKET_BUILD_PLAN.md`, το παλιό `ROADMAP.md`, `prd.md` (αρχειοθετήθηκαν στο `../docs-archive/`)._
_Γραμμένο για να είναι ξεκάθαρο — όχι για εντυπωσιασμό._

---

## 0. TL;DR
- Ένα πραγματικό storefront ζωντανό: `src/app/(store)/*` (design «Industrial Race»), με πραγματικά δεδομένα Supabase.
- Μια σοβαρή **αλλαγή σε εξέλιξη**: «Ride Selector Commerce» (στυλ Alpinestars) — προστατευμένη στο branch `feat/ride-selector-commerce`, **δεν** έχει βγει live ακόμα (περιμένει οπτική έγκριση).
- **Το live έχει bug** που διορθώνεται με ένα push (δες §2).

---

## 1. Κατάσταση σήμερα

### ✅ Δουλεύει
- Αρχική, κατηγορίες (PLP), προϊόντα (PDP) με πραγματικά δεδομένα Supabase (11.862 ενεργά προϊόντα, 8 roots).
- Μενού/κατηγορίες, breadcrumbs, ταξινόμηση, σελιδοποίηση, recursion σε non-leaf κατηγορίες.
- Καλάθι **μόνιμο** (localStorage) + πλήρης σελίδα `/cart` + wishlist.
- Checkout (guest, **μόνο αντικαταβολή/COD**) → γράφει πραγματικές `orders`+`order_items`.
- Auth: `/login`, `/register`, `/account` (Supabase auth), guard στο `/account`.
- Αναζήτηση `/search?q=` (PostgREST `.or()`).
- Hero: στατική webp εικόνα (το video αφαιρέθηκε — ήταν η πηγή του "leftover βίντεο").

### ⚠️ Φαίνονται έτοιμα αλλά είναι «βιτρίνα»
- Φίλτρα **Πιστοποίηση / Χρήση / My-Bike** → το data layer (`getProductsByCategory`, `getProductFilters`) ΥΠΟΣΤΗΡΙΖΕΙ ήδη `certifications`/`riderTypes`· λείπει μόνο το wiring στο plp-params + filter-sidebar.
- **Μεγέθη** στο PDP → δεν συνδέονται με απόθεμα ανά μέγεθος.
- **EL/EN** → υπάρχει κουμπί, δεν μεταφράζει (περιεχόμενο μόνο ελληνικά).
- **Light theme** → έρχεται με το redesign (το redesign φτιάχνει σωστό light commerce surface).

### ❌ Δεν υπάρχουν ακόμα
- Πληρωμή με κάρτα (Viva/IRIS) — **χρειάζεται λογαριασμός + κλειδιά από εσένα**.
- Σελίδες brand, journal/blog, στατικές (Όροι/Επικοινωνία/Αποστολές/Επιστροφές/Warranty), size guides.
- Πραγματικό πολυγλωσσικό (`/en/...`).
- Standalone routes `bikes/`, `garage/`, `wishlist/` υπάρχουν αλλά να επιβεβαιωθεί ότι συνδέονται από το νέο storefront (αλλιώς αφαιρούνται).

---

## 2. Git & Deploy

### Branch map (μετά το cleanup 2026-05-21)
| Branch | Commit | Ρόλος |
|---|---|---|
| `feature/cinematic-redesign` | `d03c401` | **Trunk / deploy** — last-known-good, καθαρό. Push αυτό στο `main`. |
| `feat/ride-selector-commerce` | (HEAD) | **Active dev** — το redesign + τα cleanups. |
| `main` (local) | `bf9ebf7` | ΠΑΛΙΟ/stale (05-13). Αγνόησέ το ή reset στο origin/main. |
| `origin/claude/start-plan-3-unka7` | — | Orphan (Απρίλιος, i18n). Διαγραφή. |

### Deploy = push σε origin/main (Vercel auto-deploy)
```bash
# ΔΙΟΡΘΩΣΗ LIVE (αφαιρεί το images_cdn που σπάει τα listings + φέρνει checkout/auth)
git push origin feature/cinematic-redesign:main

# Backup του redesign στο remote
git push -u origin feat/ride-selector-commerce

# Διαγραφή orphan branch
git push origin --delete claude/start-plan-3-unka7
```
> **ΚΑΝΟΝΑΣ:** ΠΟΤΕ μην προσθέσεις `images_cdn` στα product selects αν δεν τρέξει πρώτα στο Supabase:
> `alter table products add column if not exists images_cdn jsonb;` — αλλιώς όλα τα listings αδειάζουν (PostgREST 42703).

---

## 3. Η σειρά προς τα μπρος

> Λογική: πρώτα να **πουλάει**, μετά εύρεση/περιεχόμενο, η ταχύτητα (CWV) **τελευταία** ως φινίρισμα.

**ΤΩΡΑ — Σταθεροποίηση**
1. Push το live fix (§2). Επιβεβαίωσε ότι ξαναγεμίζουν τα προϊόντα.
2. Τελείωσε & ενέκρινε οπτικά το «Ride Selector Commerce» redesign στο branch του.

**ΦΑΣΗ 1 — Πληρωμή (το μόνο που λείπει για πλήρη αγορά)**
3. Viva Smart Checkout + IRIS (νομικά υποχρεωτικό GR από 1/12/2025) + κράτηση COD. Χρειάζεται **κλειδιά**.

**ΦΑΣΗ 2 — Εύρεση**
4. Meilisearch (αντί PostgREST `.or()`), με `fitment_keys` για συμβατότητα μηχανής.
5. Ενεργοποίηση των display-only φίλτρων (Πιστοποίηση/Χρήση/My-Bike) + μεγέθη με απόθεμα.

**ΦΑΣΗ 3 — Περιεχόμενο & γλώσσες**
6. Στατικές σελίδες + brand + journal.
7. Πολυγλωσσικό (next-intl `/el` x-default + `/en`) με AI on-demand + cache στη βάση.

**ΦΑΣΗ 4 — Φινίρισμα ταχύτητας (CWV)**
8. De-client / static / payload reduction + Lighthouse. Ειλικρινής οροφή: σταθερά **mid/high-90s** mobile (όχι flat-100 για e-shop 11k προϊόντων).

**Backend (παράλληλα, μετά):** μετάβαση από Supabase/Entersoft σε **Odoo 18** (JSON-RPC, aggressive cache + tag revalidation από webhooks).

---

## 4. Locked αποφάσεις (από το research master plan)
- **Framework:** Next.js 16 + Cache Components (`cacheComponents: true`). Όχι migration σε Astro/Qwik.
- **Backend:** Odoo 18 self-hosted, single source of truth. Όχι Shopify/Medusa. Odoo `website` module OFF — το Next.js είναι το storefront.
- **Search:** Meilisearch Cloud (~$30/mo) > Algolia.
- **Payments:** Viva.com (primary) + IRIS (υποχρεωτικό) + COD + Apple/Google Pay. Stripe μόνο fallback (δεν κάνει IRIS/myDATA/Δόσεις).
- **CMS:** Payload v3 (self-hosted, Next-native).
- **i18n:** next-intl, `/el` (x-default) + `/en` subdirectories.
- **Skroutz feed:** non-negotiable (top-3 τιμή + MPN/EAN + «Άμεσα διαθέσιμο»).
- **myDATA:** μέσω Odoo 18 OCA `l10n_gr_edi`.

_Πλήρες σκεπτικό & 90-day content plan: `../docs-archive/MOTOMARKET_MASTER_PLAN.md`._

---

## 5. Design DNA (premium χωρίς να σκοτώνει CWV)
- Το premium έρχεται από **τυπογραφία, spacing, product cards, art direction, microinteractions** — ΟΧΙ από video/3D/scroll-jacking.
- Hero = στατική optimized εικόνα ως LCP (με `fetchPriority`). **Όχι** autoplay video above fold.
- Product cards: σταθερό aspect ratio (μηδέν CLS), καθαρή ιεραρχία, hover lift με `transform`.
- Motion: 150–300ms fade/slide, drawer transitions, sticky CTA. **Banned:** scroll-jacking, long intros, heavy parallax mobile.
- Design budget ανά σελίδα πριν γράψουμε κώδικα (homepage/PLP/PDP/checkout).
- Κανόνας: αν κάτι δεν αυξάνει εμπιστοσύνη / ανακάλυψη / αγορά → δεν μπαίνει στο critical path.

_Πλήρες execution framework: `../docs-archive/prd.md`._

---

## 6. Route checklist
- [x] `/` (home), `/category/[slug]` (PLP), `/product/[slug]` (PDP)
- [x] `/cart`, `/checkout`, `/checkout/success`, `/search`
- [x] `/login`, `/register`, `/account`
- [ ] Πληρωμή με κάρτα (Viva/IRIS) στο checkout
- [ ] `/brand/[slug]`, `/journal`, `/journal/[slug]`
- [ ] `/about`, `/contact`, `/stores`, `/shipping`, `/returns`, `/warranty`, `/size-guides`
- [ ] `/en/...` (i18n)
- [ ] feeds: `/feed/google-merchant.xml` (υπάρχει), Skroutz feed
- [?] `bikes/`, `garage/`, `wishlist/` — επιβεβαίωσε ή αφαίρεσε

---

## 7. Deep references
- Specs/plans ανά feature: `docs/superpowers/specs|plans/*` (πιο πρόσφατο: `2026-05-20-motomarket-ride-selector-commerce`).
- Schema/Supabase πρόσβαση: στη μνήμη Claude (`reference-supabase-access`, `project-state-schema`).
- Πλήρες research + design framework: `../docs-archive/`.
