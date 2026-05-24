# Motomarket — Το Βιβλίο του Οικοσυστήματος

> Το **company book** για το marketing / engagement / AI που χτίζουμε γύρω από το
> headless eshop. Ζωντανό έγγραφο: πρώτα η σκέψη, μετά ο σχεδιασμός, μετά η υλοποίηση.

## Γιατί υπάρχει αυτό

Φτιάχνουμε **headless commerce** σε Next.js — κάτι που στην Ελλάδα δεν είναι διαδεδομένο.
Το τίμημα της ελευθερίας: **όλα όσα ένα WooCommerce/Shopify σου δίνουν τσάμπα με ένα
plugin** (reviews, loyalty, abandoned cart, feeds, search, RMA…) εδώ πρέπει να τα
**χτίσουμε εμείς**. Η ευκαιρία: τα χτίζουμε **AI-native** — δηλαδή όχι απλώς ίδια με
τα έτοιμα, αλλά **καλύτερα**, με το AI χωμένο μέσα στη ροή.

Στόχος του βιβλίου: να ξέρεις, για κάθε κομμάτι, **τι είναι αληθινά εφικτό τώρα** με
το stack σου — όχι dystopian «AI κάνει τα πάντα» προτάσεις, αλλά grounded ρεαλισμός.

## Πώς διαβάζεται κάθε feature (το template)

Κάθε capability γράφεται με τον ίδιο σκελετό, ώστε να ξεχωρίζει το εφικτό από το ευχολόγιο:

```
### <Feature> — <status>
- Τι είναι & γιατί έχει σημασία
- 🛒 WooCommerce/Shopify: τι σου δίνουν τσάμπα (το baseline που πρέπει να φτάσουμε)
- 🔧 Headless build: πώς το χτίζουμε ΕΜΕΙΣ, στο πραγματικό stack
- 🤖 AI upgrade: πού το AI το κάνει ΚΑΛΥΤΕΡΟ απ' το baseline (αν εφαρμόζει)
- 📊 Impact × Effort + κύρια εξάρτηση
- ❓ Ανοιχτά ερωτήματα
```

**Status:** 🔵 ιδέα · 🟡 σχεδιασμένο · 🟢 σε υλοποίηση · ✅ live · ⛔ blocked (λείπει προϋπόθεση)
**Impact/Effort:** Low / Medium / High (πρόχειρη εκτίμηση, για priority)

## Το πραγματικό stack (η βάση κάθε πρότασης)

| Layer | Τώρα | Στόχος |
|---|---|---|
| Storefront | Next.js 16 (App Router, RSC, `"use cache"`), Vercel | ίδιο |
| Data/Auth | Supabase (Postgres + RLS + Auth + Storage) | ίδιο, + Storage CDN για images |
| Search | PostgREST `ilike` (αδύναμο) | **Meilisearch** |
| Payments | COD μόνο (Viva placeholder) | **Viva** (cards/IRIS) |
| CMS / content | hardcoded | **Payload** |
| ERP / source of truth | Entersoft (legacy scrape) | **Odoo 18** self-hosted |
| AI | — | **Claude API** (+ prompt caching) |
| Images | legacy proxy (motomarket-shop.gr) | Supabase Storage / CDN |

**Σκληρές αλήθειες του δεδομένου (να μην τις ξεχνάμε):**
- `stock` = 0 σε **όλα** τα ~20.4k προϊόντα (δεν συγχρονίζεται inventory) → ό,τι θέλει
  πραγματικό απόθεμα είναι ⛔ μέχρι το Odoo/Entersoft sync.
- Πίνακας `reviews` **άδειος**, 0 προϊόντα με `review_count` → on-site reviews θέλουν
  πρώτα μηχανισμό **συλλογής**.
- Το brand έχει τεράστιο εξωτερικό asset: **~3.172 Google reviews 4.9★** + Skroutz 5.0★,
  ~40 χρόνια, φυσικά καταστήματα. ~28k legacy `erp_customers`.
- Single developer, bias to ship → προτεραιότητα σε High-impact / Low-effort που τρέχει
  στο **σημερινό** stack (Supabase + Claude), χωρίς να περιμένει το Odoo.

## Status board — όλο το οικοσύστημα με μια ματιά

> Ενημερώνεται καθώς προχωράμε. Το «Unblocks» δείχνει τι ξεκλειδώνει μια προϋπόθεση.

### 01 · Commerce foundations — [→](01-commerce-foundations.md)
| Feature | Status | Impact | Effort | Κύρια εξάρτηση |
|---|---|---|---|---|
| On-site reviews & ratings | 🔵 | High | Med | μηχανισμός συλλογής |
| Site search (Meilisearch) | 🔵 | High | Med | Meili instance |
| Faceted filters | 🟢 | Med | Low | — (data layer έτοιμο) |
| Wishlist (account-bound) | 🟡 | Med | Low | auth (υπάρχει) |
| Persistent cart (account-bound) | 🟡 | Med | Low | auth (υπάρχει) |
| Coupons / discount codes | 🟡 | High | Med | order.`discount` υπάρχει |
| Inventory / availability | ⛔ | High | — | Odoo inventory sync |
| Returns / RMA | 🔵 | Med | Med | Odoo orders |
| Transactional email | 🔵 | High | Low | email provider (Resend) |
| Accounts & order history | 🟢 | Med | Low | — |
| SEO essentials (schema/sitemaps) | 🟢 | High | Low | — |
| Analytics & consent | 🔵 | High | Low | GA4/Plausible + CMP |

### 02 · Acquisition — [→](02-acquisition.md)
| Feature | Status | Impact | Effort | Κύρια εξάρτηση |
|---|---|---|---|---|
| Product feeds (Skroutz/Google/Meta) | 🔵 | **Very High** | Med | catalog + τιμές/απόθεμα |
| SEO content engine (guides) | 🔵 | High | Med | Payload + Claude |
| Reviews → customers (−10% codes) | 🔵 | High | Med | → review engine, coupons |
| Referral («φέρε φίλο») | 🔵 | Med | Med | coupons + accounts |
| Affiliate / community | 🔵 | Med | High | tracking + payouts |
| Paid-channel data layer | 🔵 | Med | Low | analytics events |

### 03 · Engagement & retention — [→](03-engagement-retention.md)
| Feature | Status | Impact | Effort | Κύρια εξάρτηση |
|---|---|---|---|---|
| Email lifecycle (welcome/winback) | 🟡 | High | Med | newsletter list (υπάρχει) + Resend |
| Abandoned cart recovery | 🔵 | **Very High** | Med | persistent cart + email |
| Loyalty / points | 🔵 | High | High | accounts + orders |
| Personalization & recs | 🔵 | High | Med | order_items + view events |
| Recently viewed | 🔵 | Med | Low | client/localStorage |
| Back-in-stock & price-drop alerts | ⛔ | High | Med | inventory + price history |
| Segmentation / RFM | 🔵 | Med | Med | erp_customers + orders |

### 04 · AI layer — [→](04-ai-layer.md)
| Feature | Status | Impact | Effort | Κύρια εξάρτηση |
|---|---|---|---|---|
| AI Review Engine | 🔵 | High | Med | Claude API · [deep-dive](features/ai-review-engine.md) |
| AI / semantic search | 🔵 | High | Med | Meili + embeddings |
| AI shopping assistant (gear copilot) | 🔵 | High | Med | catalog + Claude |
| AI product content & translations | 🔵 | High | Med | Claude + Payload |
| AI merchandising / ranking | 🔵 | Med | Med | events + Meili |
| AI support copilot | 🔵 | Med | Med | tickets + catalog |
| Owner insights («ρώτα το eshop σου») | 🔵 | High | Med | Supabase + Claude |
| AI fit/size advisor | 🔵 | Med | Med | size data |

### 05 · Ops & automation — [→](05-ops-automation.md)
| Feature | Status | Impact | Effort | Κύρια εξάρτηση |
|---|---|---|---|---|
| Odoo 18 integration | 🔵 | **Very High** | High | Odoo instance |
| Inventory sync (το μεγάλο unblock) | 🔵 | **Very High** | High | Odoo/Entersoft |
| Order orchestration | 🔵 | High | Med | Odoo |
| Pricing & promo automation | 🔵 | Med | Med | Odoo prices |
| Image pipeline → Supabase CDN | 🟡 | High | Med | Storage |
| Catalog data quality | 🔵 | Med | Med | Claude + Odoo |
| AI ops agents (management) | 🔵 | High | High | όλα τα παραπάνω |

## Πυλώνες
1. [Commerce foundations](01-commerce-foundations.md) — τα must-have που δίνει τσάμπα μια πλατφόρμα
2. [Acquisition](02-acquisition.md) — φέρε επισκέπτες & πελάτες
3. [Engagement & retention](03-engagement-retention.md) — κράτα & μεγάλωσέ τους
4. [AI layer](04-ai-layer.md) — ο διαφοροποιητής
5. [Ops & automation](05-ops-automation.md) — το «self-running» (Odoo)

## Deep-dives
- [AI Review Engine](features/ai-review-engine.md)

## Σχέση με άλλα έγγραφα
- `ROADMAP.md` → οι σελίδες/features του storefront.
- memory `project-home-engagement-roadmap` → τα home engagement modules.
- Αυτό το βιβλίο → το **growth + AI** οικοσύστημα πάνω στο storefront & στο μελλοντικό Odoo.
