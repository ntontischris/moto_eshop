# 02 · Acquisition

Πώς **έρχεται κόσμος** στο eshop — και πώς γίνεται πελάτης. Στην Ελλάδα το παιχνίδι
έχει ιδιαιτερότητες (Skroutz κυριαρχεί στο comparison shopping), οπότε τα feeds δεν
είναι «nice to have», είναι **οξυγόνο**.

Status: 🔵 ιδέα · 🟡 σχεδιασμένο · 🟢 σε υλοποίηση · ✅ live · ⛔ blocked

---

### Product feeds — Skroutz / Google Shopping / Meta — 🔵
- **Τι:** δομημένα XML/feeds του καταλόγου προς comparison & ad πλατφόρμες. **Στην
  Ελλάδα, το Skroutz feed είναι ίσως το #1 acquisition κανάλι για eshop.**
- 🛒 **Baseline:** WooCommerce/Shopify με plugin (π.χ. XML feed for Skroutz) σε λεπτά.
  **Εδώ είναι το πιο χτυπητό παράδειγμα του «τι χάνεις πηγαίνοντας headless».**
- 🔧 **Headless build:** Next.js route handlers που παράγουν feeds:
  `/feeds/skroutz.xml`, `/feeds/google.xml`, `/feeds/meta.xml` από τα products.
  Κάθε πλατφόρμα έχει δικό της schema (Skroutz: συγκεκριμένα tags, availability,
  τιμή με ΦΠΑ, κατηγορία mapping). **Πρόβλημα:** χρειάζονται **σωστό απόθεμα & τιμές**
  → μερικώς ⛔ μέχρι το inventory sync (λάθος availability = ποινή/απόρριψη feed).
- 🤖 **AI upgrade:** AI category-mapping (ο 20k κατάλογος → κατηγορίες Skroutz/Google
  taxonomy αυτόματα) + AI-βελτιωμένοι τίτλοι feed για καλύτερο match.
- 📊 **Very High** / Med. **Εξάρτηση:** σωστές τιμές+απόθεμα (Odoo). **Ξεκλειδώνει:** Skroutz/Google/Meta traffic.
- ❓ Skroutz Marketplace (πώληση μέσα στο Skroutz) ή μόνο feed σύγκρισης; Ποιος έχει merchant accounts;

### SEO content engine (buying guides) — 🔵
- **Τι:** editorial περιεχόμενο που πιάνει organic queries: «καλύτερο κράνος για πόλη
  2026», «πώς διαλέγω μπουφάν αναβάτη», size guides ανά brand. Φέρνει top-funnel + SEO juice.
- 🛒 **Baseline:** Woo/Shopify έχουν blog· εσύ έχεις και την ευελιξία να το κάνεις πλούσιο.
- 🔧 **Headless build:** **Payload CMS** για τα άρθρα/guides + Next.js render + internal
  linking προς PLP/PDP. Δένει με το "Editorial" section του homepage.
- 🤖 **AI upgrade:** AI **drafts** buying guides από τα δεδομένα καταλόγου (specs,
  brands, κατηγορίες) — με ανθρώπινο edit/approve, ΟΧΙ auto-publish (ποιότητα + Google).
  Internal-link suggestions, meta, alt-text. → [AI content](04-ai-layer.md).
- 📊 High / Med. **Εξάρτηση:** Payload + Claude.
- ❓ Πόσο AI-assisted vs human; συχνότητα;

### Reviews → customers (−10% codes) — 🔵
- **Τι:** οι **~3.172 Google reviewers** = warm leads που μας εμπιστεύονται αλλά ίσως
  δεν αγόρασαν ποτέ online. Τους μετατρέπουμε σε eshop πελάτες.
- 🛒 **Baseline:** καμία πλατφόρμα δεν το κάνει — **εδώ το AI σε βάζει μπροστά**.
- 🔧 **Headless build:** μοναδικοί coupon codes (→ foundations) + landing + redemption
  tracking. **GDPR:** ΟΧΙ scraping emails· μόνο **δημόσια** απάντηση με προσωπικό
  ευχαριστώ + κωδικό/link. In-store QR «άσε κριτική & πάρε −10%» για opt-in.
- 🤖 **AI upgrade:** το core — δες [AI Review Engine, Μέρος Β](features/ai-review-engine.md).
- 📊 High / Med. **Εξάρτηση:** coupons + Google Business Profile API access.
- ❓ Έχει ο owner GBP API πρόσβαση; (open Q στο review engine)

### Referral — «φέρε φίλο» — 🔵
- **Τι:** υπάρχων πελάτης φέρνει νέο → και οι δύο παίρνουν κίνητρο. Φθηνό, viral-ish.
- 🛒 **Baseline:** Shopify με app (ReferralCandy).
- 🔧 **Headless build:** referral codes per-user (πάνω στα coupons + accounts),
  attribution (ποιος έφερε ποιον), διπλό reward στο checkout.
- 🤖 **AI upgrade:** μικρό — ίσως personalized κάλεσμα μέσω lifecycle.
- 📊 Med / Med. **Εξάρτηση:** coupons + accounts.
- ❓ Reward: € έκπτωση, πόντοι, ή δωρεάν μεταφορικά;

### Affiliate / community — 🔵
- **Τι:** moto influencers / clubs / riders προωθούν με δικό τους link & προμήθεια.
  Ταιριάζει στο racing/community DNA του brand.
- 🛒 **Baseline:** app-based σε πλατφόρμες.
- 🔧 **Headless build:** affiliate links + cookie attribution + dashboard + payouts.
  Βαρύτερο (λογιστικό/payouts) → αργότερα.
- 📊 Med / High. **Εξάρτηση:** analytics/attribution + accounts.

### Paid-channel data layer — 🔵
- **Τι:** η υποδομή ώστε Google/Meta ads να δουλεύουν σωστά (events, conversions,
  catalog, server-side tracking) — δεν είναι «καμπάνια», είναι το **σωλήνωμα**.
- 🛒 **Baseline:** Shopify στέλνει events έτοιμα στα pixels.
- 🔧 **Headless build:** standardized e-commerce events (→ analytics foundation),
  Meta CAPI / Google Enhanced Conversions server-side (πιο ακριβές, cookie-proof),
  catalog feed (→ product feeds).
- 🤖 **AI upgrade:** AI budget/creative suggestions (πολύ αργότερα).
- 📊 Med / Low (αφού υπάρχει analytics). **Εξάρτηση:** analytics + feeds.

---

**Σειρά που προτείνω:**
1. **Skroutz/Google feeds** — το μεγαλύτερο μονό acquisition lever στην ΕΛ αγορά (μόλις
   υπάρχουν σωστές τιμές· availability μπορεί προσωρινά «κατόπιν παραγγελίας»).
2. **Reviews → customers** — μοναδικό asset (3.172 reviews), δένει με review engine.
3. **SEO content engine** — αργό αλλά compounding· AI-assisted για ταχύτητα.
4. Referral → Affiliate → Paid (όταν υπάρχει η βάση).
