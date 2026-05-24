# 01 · Commerce Foundations

Τα **must-have** που ένα WooCommerce/Shopify σου δίνει με ένα κλικ, και που στο
headless πρέπει να τα χτίσουμε. Δεν είναι «growth» — είναι το **έδαφος**: χωρίς αυτά
οι πάνω πυλώνες δεν πατάνε πουθενά. Προτεραιότητα: αυτά που ξεκλειδώνουν τα υπόλοιπα.

Status: 🔵 ιδέα · 🟡 σχεδιασμένο · 🟢 σε υλοποίηση · ✅ live · ⛔ blocked

---

### On-site reviews & ratings — 🔵
- **Τι:** κριτικές/αστέρια στο PDP, με φωτογραφίες πελάτη (UGC). Το #1 conversion signal.
- 🛒 **Baseline:** WooCommerce έχει built-in reviews· Shopify με Judge.me/Loox (1 plugin).
- 🔧 **Headless build:** ο πίνακας `reviews` υπάρχει αλλά είναι **άδειος**. Χρειάζεται
  (α) μηχανισμός **συλλογής** — post-purchase email «αξιολόγησε την αγορά σου» (δένει με
  το email lifecycle) → form → γράφει στο `reviews` με `order_id` για **verified buyer**
  badge· (β) display component στο PDP + aggregate στο `product`· (γ) moderation.
- 🤖 **AI upgrade:** auto-reply σε κάθε κριτική + summary («τι λένε οι αναβάτες»)
  + sentiment → όλα στο [AI Review Engine](features/ai-review-engine.md).
- 📊 High impact / Med effort. **Εξάρτηση:** email lifecycle (για να μαζευτούν).
- ❓ Verified-only ή και guest; κίνητρο για κριτική (πόντοι/−%);

### Site search — 🔵
- **Τι:** η μπάρα αναζήτησης. Σε eshop με 20k SKU, το search φέρνει δυσανάλογο τζίρο.
- 🛒 **Baseline:** πλατφόρμες έχουν αξιοπρεπές search· Shopify+Searchanise/Algolia.
- 🔧 **Headless build:** τώρα κάνουμε PostgREST `.or()` ilike — τυπογραφικά, συνώνυμα,
  ελληνικά/greeklish, ranking = όλα αδύναμα. Στόχος **Meilisearch**: index των products
  (name, brand, category, specs), typo-tolerance, synonyms (greeklish↔ελληνικά:
  «mpoufan»↔«μπουφάν»), facets, instant-search dropdown.
- 🤖 **AI upgrade:** semantic search + φυσική γλώσσα → [AI layer](04-ai-layer.md).
- 📊 High / Med. **Εξάρτηση:** Meili instance (Vercel-friendly host ή self-host).
- ❓ Meili Cloud ή self-host; ποια fields searchable/filterable;

### Faceted filters & navigation — 🟢
- **Τι:** φίλτρα (brand/τιμή/μέγεθος/πιστοποίηση/χρήση) + sort + pagination στο PLP.
- 🛒 **Baseline:** standard σε κάθε πλατφόρμα.
- 🔧 **Headless build:** το data layer **υπάρχει** (`getProductsByCategory` +
  `getProductFilters` με brands/τιμές/certifications/riderTypes). Λείπει: τα φίλτρα
  Πιστοποίηση/Χρήση/μέγεθος είναι **display-only** — να κουμπώσουν στα URL params.
- 🤖 **AI upgrade:** «έξυπνα» facets που αναδεικνύονται ανά κατηγορία (AI merchandising).
- 📊 Med / Low. **Εξάρτηση:** —.
- ❓ Μεγέθη: από πού (variant data λείπει — Odoo;).

### Wishlist & persistent cart (account-bound) — 🟡
- **Τι:** αγαπημένα & καλάθι που επιβιώνουν refresh/συσκευής.
- 🛒 **Baseline:** πλατφόρμες κρατάνε cart server-side per-user.
- 🔧 **Headless build:** τώρα είναι **localStorage** (χάνονται σε άλλη συσκευή). Στόχος:
  πίνακες `wishlists`/`carts` στο Supabase, RLS per-user, merge guest→user στο login.
  Ξεκλειδώνει abandoned-cart & wishlist nudges.
- 🤖 **AI upgrade:** «το wishlist σου σε προσφορά» triggers (engagement).
- 📊 Med / Low. **Εξάρτηση:** auth (υπάρχει).
- ❓ Guest cart TTL;

### Coupons / discount codes — 🟡
- **Τι:** κωδικοί έκπτωσης, ο θεμέλιος λίθος για −10% newsletter, referral, reviews→customers.
- 🛒 **Baseline:** core feature παντού.
- 🔧 **Headless build:** το `order` έχει **ήδη** `discount` field. Λείπει: πίνακας
  `coupons` (code, type %/€, όρια, λήξη, per-user/one-time), validation στο checkout,
  redemption tracking. **Αυτό ξεκλειδώνει 3-4 growth features ταυτόχρονα.**
- 🤖 **AI upgrade:** μοναδικοί κωδικοί ανά reviewer/segment (review engine, segmentation).
- 📊 High / Med. **Εξάρτηση:** — (μόνο dev). **Ξεκλειδώνει:** newsletter −10%, referral, reviews→customers.
- ❓ Stackable; ελάχιστο καλάθι; auto-apply vs code;

### Inventory / availability — ⛔
- **Τι:** «διαθέσιμο / λίγα κομμάτια / εξαντλήθηκε», σωστό stock.
- 🛒 **Baseline:** core· η πλατφόρμα κρατάει απόθεμα.
- 🔧 **Headless build:** ⛔ **BLOCKED** — `stock`=0 σε όλα. Πιθανό latent bug: τα
  availability badges μπορεί να δείχνουν τα πάντα out-of-stock. Λύνεται **μόνο** με
  inventory sync από Odoo/Entersoft → [Ops](05-ops-automation.md).
- 📊 High / —. **Εξάρτηση:** Odoo inventory sync. **Ξεκλειδώνει:** urgency, back-in-stock.
- ❓ Real-time ή periodic sync; ανά κατάστημα ή ενιαίο;

### Returns / RMA — 🔵
- **Τι:** αιτήματα επιστροφής/αλλαγής με tracking — απαίτηση νόμου + εμπιστοσύνη.
- 🛒 **Baseline:** Shopify/Woo με app.
- 🔧 **Headless build:** πίνακας `return_requests` δεμένος σε orders, account UI, statuses.
- 🤖 **AI upgrade:** AI triage λόγου επιστροφής → insight (λάθος μέγεθος → fit advisor).
- 📊 Med / Med. **Εξάρτηση:** orders (Odoo για πλήρη ροή).

### Transactional email — 🔵
- **Τι:** επιβεβαίωση παραγγελίας, αποστολή, reset password. Το «λειτουργικό» email.
- 🛒 **Baseline:** auto παντού.
- 🔧 **Headless build:** δεν υπάρχει provider. Στόχος **Resend** (ή Supabase SMTP) +
  React Email templates. **Προϋπόθεση** για reviews-collection & lifecycle & abandoned cart.
- 📊 High / Low. **Εξάρτηση:** email provider. **Ξεκλειδώνει:** reviews, lifecycle, cart recovery.
- ❓ Resend vs Postmark; domain/DKIM ποιος έχει;

### Accounts & order history — 🟢
- **Τι:** login, προφίλ, ιστορικό παραγγελιών, διευθύνσεις.
- 🔧 **Headless build:** auth + /account υπάρχουν. Να εμπλουτιστούν: addresses, reorder,
  saved bikes (δένει με My-Bike), tracking.
- 📊 Med / Low.

### SEO essentials — 🟢
- **Τι:** structured data, sitemaps, canonical, OG, fast pages — το οργανικό κανάλι.
- 🔧 **Headless build:** JSON-LD Product υπάρχει στο PDP. Λείπουν: sitemaps (20k προϊόντα),
  category/breadcrumb schema, OG images, hreflang (EL/EN), robots. Next.js το κάνει εύκολα.
- 🤖 **AI upgrade:** auto meta/alt-text generation → [AI content](04-ai-layer.md).
- 📊 High / Low. **Εξάρτηση:** —. Δένει με SEO content engine ([Acquisition](02-acquisition.md)).

### Analytics & consent — 🔵
- **Τι:** να ξέρεις τι συμβαίνει (funnels, conversion) — νόμιμα (GDPR cookie consent).
- 🛒 **Baseline:** Shopify analytics built-in.
- 🔧 **Headless build:** GA4 ή Plausible + e-commerce events (view_item, add_to_cart,
  purchase) + Consent Mode v2 + CMP banner. **Προϋπόθεση** για paid channels & personalization.
- 📊 High / Low. **Εξάρτηση:** —. **Ξεκλειδώνει:** paid data layer, recs.
- ❓ GA4 (free, βαρύ) vs Plausible (privacy, απλό); server-side events;

---

**Σειρά που προτείνω (ξεκλειδώνει τα περισσότερα με το λιγότερο):**
1. **Transactional email** (Resend) → ξεκλειδώνει reviews + lifecycle + cart recovery
2. **Coupons** → ξεκλειδώνει −10% newsletter + referral + reviews→customers
3. **Analytics & consent** → ξεκλειδώνει paid + personalization
4. **Account-bound cart/wishlist** → ξεκλειδώνει abandoned cart + nudges
5. **Meilisearch** → search + βάση για AI search
6. (περιμένει Odoo) **Inventory sync** → ξεκλειδώνει urgency + back-in-stock
