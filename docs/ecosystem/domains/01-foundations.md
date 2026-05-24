# Domain 01 — Foundations & ο φόρος του headless

> **Κεφάλαιο του βιβλίου · το framing όλου του οικοσυστήματος.**
> Status: ✅ χαρτογραφημένο | Stack: Next.js 16 · Supabase · Resend · Viva · Payload · Odoo · Claude
> Cross-refs: όλα τα domains — αυτό εξηγεί *γιατί* υπάρχουν.

Αυτό το κεφάλαιο είναι η **φιλοσοφία** πίσω από το βιβλίο: τι σου δίνει τσάμπα μια
πλατφόρμα, γιατί στο headless πληρώνεις «φόρο» χτίζοντάς τα μόνος, και ποια θεμέλια
πρέπει να μπουν για να πατήσουν όλα τα υπόλοιπα.

---

## Μέρος Α — Η θεωρία: ο «φόρος του headless»

**Τι σημαίνει headless:** χωρίζεις το storefront (Next.js, ό,τι βλέπει ο πελάτης) από
το backend (δεδομένα/λογική). Αντί για ένα μονολιθικό WooCommerce/Shopify, συνθέτεις
δικά σου κομμάτια.

| | Μονολιθικό (Woo/Shopify) | Headless (εσύ) |
|---|---|---|
| Design/UX | template-bound | **πλήρης ελευθερία** (το εντυπωσιακό σου design) |
| Ταχύτητα | μέτρια | **κορυφαία** (Next.js, edge) |
| Features (email/reviews/loyalty…) | **τσάμπα, 1 plugin** | **τα χτίζεις εσύ** ← ο φόρος |
| AI ενσωμάτωση | περιορισμένη | **βαθιά, AI-native** ← η ανταμοιβή |
| Κόστος συντήρησης | χαμηλό | υψηλότερο (είσαι ο platform) |

**Η συμφωνία:** δίνεις «εύκολο» και παίρνεις «έλεγχο + ταχύτητα + AI». Ο φόρος αξίζει
**μόνο** αν χτίσεις σωστά τα θεμέλια — αλλιώς έχεις ένα όμορφο site χωρίς τα βασικά
που έχει κάθε φτηνό eshop.

---

## Μέρος Β — Ο πλήρης χάρτης: τα θεμέλια

Πολλά θεμέλια έχουν **δικό τους κεφάλαιο**. Εδώ ο κατάλογος + όσα είναι cross-cutting.

| Θεμέλιο | Πού | Status |
|---|---|---|
| Transactional email | [[02-email-messaging]] | 🔵 (unlock key) |
| Reviews & ratings | [[03-reviews-social-proof]] | 🔵 |
| Search & filters | [[04-search-discovery]] | 🔵→🟢 |
| **Coupons / discount codes** | εδώ ↓ | 🟡 (unlock key) |
| **Accounts, cart & wishlist persistence** | εδώ ↓ | 🟢→🟡 |
| **SEO essentials** | εδώ ↓ | 🟢 |
| **i18n (EL/EN)** | εδώ ↓ | 🟡 |
| **Legal/compliance** | εδώ ↓ | 🔵 |
| Inventory / availability | [[09-ops-odoo]] | ⛔ |
| Payments & checkout | [[07-payments-checkout]] | 🟡 |
| Analytics & consent | [[10-analytics-measurement]] | 🔵 |

**Cross-cutting θεμέλια (το «κρέας» αυτού του κεφαλαίου):**

- **🎟️ Coupons / discount codes** — *unlock key*. Το `order` έχει ήδη `discount` field.
  Λείπει: πίνακας `coupons` (code, %/€, όρια, λήξη, per-user), validation στο checkout,
  redemption tracking. **Ξεκλειδώνει:** −10% newsletter, referral, reviews→customers, loyalty redemption.
- **👤 Accounts + persistent cart/wishlist** — auth & /account υπάρχουν· cart/wishlist
  είναι **localStorage** → πρέπει account-bound (Supabase, RLS, merge guest→user στο login).
  **Ξεκλειδώνει:** abandoned cart, wishlist nudges, reorder.
- **🔗 SEO essentials** — JSON-LD Product υπάρχει· λείπουν sitemaps (20k), breadcrumb/Organization
  schema, OG images, hreflang. Δένει με [[06-acquisition-ads-feeds]] & [[03-reviews-social-proof]] (rich snippets).
- **🌍 i18n (EL/EN)** — το toggle υπάρχει αλλά **δεν μεταφράζει** (δεδομένα μόνο ελληνικά).
  Λύση: AI bulk translation (→ [[08-ai-layer]]) + locale routing. Ανοίγει & ξένες αγορές.
- **⚖️ Legal/compliance** — cookie consent (CMP + Consent Mode), Omnibus (προηγούμενη
  χαμηλότερη τιμή), όροι/πολιτικές, ΑΑΔΕ/τιμολόγηση. **Μη διαπραγματεύσιμα νομικά.**

---

## Μέρος Γ — Η υποδομή: τα 3 unlock keys

Από όλα τα θεμέλια, **τρία ξεκλειδώνουν δυσανάλογα πολλά** — προτεραιότητα εδώ:

1. **📧 Transactional email** (Resend) → reviews collection + lifecycle + abandoned cart.
2. **🎟️ Coupons** → −10% / referral / reviews→customers / loyalty.
3. **📦 Inventory sync** → urgency + back-in-stock + σωστά feeds + availability.

Τα δύο πρώτα γίνονται **τώρα** (Supabase + Resend), χωρίς Odoo. Το τρίτο περιμένει Ops.

---

## Μέρος Δ — Το AI επίπεδο
Τα θεμέλια από μόνα τους δεν είναι «AI». Αλλά **κάθε** θεμέλιο γίνεται καλύτερο με AI:
auto meta/alt-text (SEO), AI translations (i18n), AI moderation (reviews), smart coupons.
Δες [[08-ai-layer]] — εκεί η κοινή AI υποδομή.

## Μέρος Ε — KPIs
Τα θεμέλια μετριούνται έμμεσα: conversion rate (το άθροισμα), cart-to-order, account
signup rate, % προϊόντων με σωστά SEO/schema, coupon redemption rate.

## Μέρος ΣΤ — Παγίδες
- **Όμορφο site χωρίς θεμέλια** → μοιάζει premium, αλλά χάνει σε ένα φτηνό Woo που έχει email/coupons/feeds.
- **Παράλειψη legal** (consent/Omnibus) → πρόστιμα.
- **Coupons χωρίς όρια** → abuse.
- **localStorage cart για πάντα** → χαμένα abandoned-cart leads.

## Μέρος Ζ — Για το Motomarket: σειρά
1. **Transactional email** (Resend) · 2. **Coupons** · 3. **Account-bound cart/wishlist**
· 4. **SEO essentials** (sitemaps/schema/hreflang) · 5. **Consent/legal** · 6. (Odoo) **Inventory**.

## Ανοιχτά ερωτήματα
- i18n: AI bulk translation τώρα ή μετά τα EL θεμέλια;
- Coupons: stackable; auto-apply vs code;
- CMP provider (Cookiebot/δικό μας);
