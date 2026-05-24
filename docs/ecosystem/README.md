# Motomarket — Το Βιβλίο του Οικοσυστήματος

> Το **company book / curriculum** για το marketing · engagement · AI γύρω από το
> headless eshop. **Στόχος: πρώτα να αποκτήσεις πλήρη γνώση του χώρου, μετά να χτίσεις.**
> Δεν είναι λίστα tasks — είναι εκπαιδευτικά **κεφάλαια-domains**, καθένα πλήρης χάρτης.

## Γιατί υπάρχει αυτό

Φτιάχνουμε **headless commerce** σε Next.js — κάτι που στην Ελλάδα δεν είναι διαδεδομένο.
Το τίμημα της ελευθερίας: **όλα όσα ένα WooCommerce/Shopify σου δίνουν τσάμπα με ένα
plugin** (email, reviews, loyalty, feeds, search, RMA…) εδώ πρέπει να τα **χτίσουμε εμείς**.
Η ευκαιρία: τα χτίζουμε **AI-native** — όχι ίδια με τα έτοιμα, αλλά **καλύτερα**.

Κάθε κεφάλαιο σε **μορφώνει** πάνω στον χώρο του: όλα τα είδη, τη θεωρία, την υποδομή
από κάτω, τα KPIs, τις παγίδες, και το τι μετράει για το **Motomarket** ειδικά.

## Ο φακός κάθε θέματος

**🛒 WooCommerce στο δίνει τσάμπα → 🔧 Headless: το χτίζεις εσύ → 🤖 AI: σε βάζει μπροστά**

Status κεφαλαίου: ✅ χαρτογραφημένο · 🔜 σε σειρά · Status feature: 🔵 ιδέα · 🟡 σχεδιασμένο · 🟢 υλοποίηση · ✅ live · ⛔ blocked

## Τα 3 κλειδιά που ξεκλειδώνουν δυσανάλογα πολλά
📧 **Transactional email** · 🎟️ **Coupons** · 📦 **Inventory sync** — τα δύο πρώτα γίνονται *τώρα* (Supabase + Resend), χωρίς να περιμένουν Odoo.

## Το πραγματικό stack (η βάση κάθε πρότασης)

| Layer | Τώρα | Στόχος |
|---|---|---|
| Storefront | Next.js 16 (RSC, `"use cache"`), Vercel | ίδιο |
| Data/Auth | Supabase (Postgres + RLS + Auth + Storage) | + Storage CDN για images |
| Search | PostgREST `ilike` (αδύναμο) | **Meilisearch** |
| Email | — | **Resend** + React Email |
| Payments | COD μόνο (Viva placeholder) | **Viva** (cards/IRIS) |
| CMS / content | hardcoded | **Payload** |
| ERP / source of truth | Entersoft (legacy scrape) | **Odoo 18** self-hosted |
| AI | — | **Claude API** (+ prompt caching) |

**Σκληρές αλήθειες του δεδομένου:** `stock`=0 σε όλα τα ~20.4k προϊόντα (⛔ μέχρι inventory sync) ·
`reviews` άδειος (θέλει συλλογή) · τεράστιο εξωτερικό asset: **~3.172 Google reviews 4.9★** + Skroutz ·
~28k legacy `erp_customers` · ~40 χρόνια brand + φυσικά καταστήματα · single developer (bias to ship).

---

## 📚 Τα κεφάλαια (10 domains) — το curriculum

Χτίζονται **ένα-ένα σε βάθος**. Σειρά ανάγνωσης ελεύθερη· κάθε κεφάλαιο στέκει μόνο του.

| # | Domain | Τι θα μάθεις | Status |
|---|---|---|---|
| 01 | **[Foundations & ο φόρος του headless](domains/01-foundations.md)** | τι δίνει τσάμπα μια πλατφόρμα & γιατί headless = το χτίζεις εσύ | ✅ |
| 02 | **[Email & messaging](domains/02-email-messaging.md)** | 3 οικογένειες email + SMS/Viber/push, deliverability, flows, KPIs | ✅ |
| 03 | **[Reviews & social proof](domains/03-reviews-social-proof.md)** | on-site reviews, UGC, Google/Skroutz, trust signals, AI Review Engine | ✅ |
| 04 | **[Search & discovery](domains/04-search-discovery.md)** | search (Meili), filters, merchandising, recommendations, personalization | ✅ |
| 05 | **[Loyalty & retention](domains/05-loyalty-retention.md)** | points, tiers, referral, segmentation/RFM, CRM | ✅ |
| 06 | **[Acquisition, ads & feeds](domains/06-acquisition-ads-feeds.md)** | Skroutz/Google/Meta feeds, SEO content engine, paid, affiliate | ✅ |
| 07 | **[Payments & checkout](domains/07-payments-checkout.md)** | Viva/IRIS/COD, checkout UX, conversion, fraud | ✅ |
| 08 | **[The AI layer](domains/08-ai-layer.md)** | assistant/gear copilot, semantic search, AI content, support, owner insights | ✅ |
| 09 | **[Ops & automation (Odoo)](domains/09-ops-odoo.md)** | inventory, orders, pricing, image pipeline, data quality, AI ops agents | ✅ |
| 10 | **[Analytics & measurement](domains/10-analytics-measurement.md)** | KPIs, funnels, attribution, consent/GDPR, «ρώτα το eshop σου» | ✅ |

## Δομή κάθε κεφαλαίου (το template)
1. **Η οικονομία/γιατί αξίζει** — τα νούμερα & η λογική
2. **Ο πλήρης χάρτης** — όλα τα είδη/εργαλεία του χώρου, με τη θεωρία τους
3. **Η υποδομή από κάτω** — το υπόβαθρο που κανείς δεν λέει
4. **KPIs** — πώς το μετράμε
5. **Παγίδες** — τι να αποφύγεις
6. **Για το Motomarket** — stack mapping + σειρά + τι είναι blocked
7. **Ανοιχτά ερωτήματα** — αποφάσεις που εκκρεμούν

## Deep-dives (ειδικά features)
- [AI Review Engine](features/ai-review-engine.md)

## Σχέση με άλλα έγγραφα
- `ROADMAP.md` → οι σελίδες/features του storefront.
- memory `project-home-engagement-roadmap` → τα home engagement modules.
- Αυτό το βιβλίο → η **γνώση** του growth + AI οικοσυστήματος (curriculum).
