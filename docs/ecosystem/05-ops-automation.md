# 05 · Ops & Automation

Το «self-running» κομμάτι: ό,τι κάνει το eshop να **τρέχει μόνο του** χωρίς χειροκίνητη
δουλειά — και ξεκλειδώνει σχεδόν όλα τα υπόλοιπα. **Εδώ κάθεται το Odoo.** Χωρίς αυτόν
τον πυλώνα, πολλά features πάνω είναι ⛔ (απόθεμα, τιμές, παραγγελίες).

Status: 🔵 ιδέα · 🟡 σχεδιασμένο · 🟢 σε υλοποίηση · ✅ live · ⛔ blocked

---

### Odoo 18 integration — 🔵
- **Τι:** το **Odoo γίνεται το source of truth** για προϊόντα, απόθεμα, τιμές, παραγγελίες,
  πελάτες. Το eshop διαβάζει/γράφει μέσω API· το Supabase γίνεται read-cache/storefront layer.
- 🛒 **Baseline:** Shopify ΕΙΝΑΙ το backend· εσύ φέρνεις δικό σου ERP (πιο δυνατό, πιο δουλειά).
- 🔧 **Headless build:** Odoo self-hosted + sync layer (Odoo XML-RPC/JSON-RPC ↔ Supabase).
  Αποφασίζουμε direction ανά οντότητα: products/stock/prices **Odoo→Supabase**· orders
  **Supabase→Odoo**. Idempotent sync, conflict policy.
- 🤖 **AI upgrade:** AI data-mapping legacy Entersoft↔Odoo κατά τη μετάβαση.
- 📊 **Very High** / High. **Εξάρτηση:** Odoo instance. **Ξεκλειδώνει:** inventory, pricing,
  orders, RMA, feeds accuracy, urgency, back-in-stock, fit advisor.
- ❓ Πότε στήνεται το Odoo; Παράλληλη λειτουργία με Entersoft στη μετάβαση;

### Inventory sync — 🔵 (το μεγάλο unblock)
- **Τι:** πραγματικό απόθεμα στο storefront. **Λύνει το `stock`=0-παντού** που μπλοκάρει
  urgency, back-in-stock, σωστά feeds, availability badges.
- 🔧 **Headless build:** periodic ή event-driven sync απόθεμα Odoo/Entersoft→Supabase.
  Ενδιάμεσο βήμα ΠΡΙΝ το Odoo: αν το Entersoft API δίνει stock, sync από εκεί τώρα.
- 📊 **Very High** / High. **Εξάρτηση:** Odoo ή Entersoft stock API.
- ❓ Δίνει το Entersoft API απόθεμα τώρα; συχνότητα sync; ανά κατάστημα;

### Order orchestration — 🔵
- **Τι:** η παραγγελία ρέει αυτόματα: eshop → ERP → τιμολόγηση → courier → tracking →
  πελάτης. Τώρα γράφουμε `orders`/`order_items` (COD), χωρίς downstream automation.
- 🔧 **Headless build:** push orders στο Odoo, courier integration (voucher/tracking),
  status webhooks → transactional email + account.
- 🤖 **AI upgrade:** AI fraud/anomaly flagging σε ύποπτες παραγγελίες.
- 📊 High / Med. **Εξάρτηση:** Odoo + Viva (online πληρωμές) + courier.

### Pricing & promo automation — 🔵
- **Τι:** τιμές & προσφορές κεντρικά από Odoo, με κανόνες (markdown, bundles, εποχικά),
  price history (ξεκλειδώνει price-drop alerts + νόμιμη «προηγούμενη τιμή» Omnibus).
- 🔧 **Headless build:** prices Odoo→Supabase + `price_history` πίνακας + promo rules engine.
- 📊 Med / Med. **Εξάρτηση:** Odoo prices. **Νομικό:** Omnibus directive (εμφάνιση χαμηλότερης 30ημέρου).

### Image pipeline → Supabase CDN — 🟡
- **Τι:** σωστά μεγέθη/format εικόνων από fast CDN αντί legacy proxy (ταχύτητα = SEO + conversion).
- 🛒 **Baseline:** Shopify CDN auto-optimizes.
- 🔧 **Headless build:** mirror legacy/Odoo images → **Supabase Storage**, pre-sized WebP/AVIF
  στο ingest. `SmartImage` ήδη βελτιστοποιεί supabase URLs. (Προηγ. προσπάθεια image-mirror
  αφαιρέθηκε — επανασχεδιασμός.)
- 📊 High / Med. **Εξάρτηση:** Storage. Δες memory `project-image-architecture`.

### Catalog data quality — 🔵
- **Τι:** ο legacy κατάλογος (scrape) έχει ακατάστατα specs, κενά πεδία, διπλά. Καθαρός
  κατάλογος = καλύτερα search/feeds/recs/filters.
- 🔧 **Headless build:** validation rules + dedup + completeness reports.
- 🤖 **AI upgrade:** AI normalization specs, AI κατηγοριοποίηση, AI fill-gaps (με review).
- 📊 Med / Med. **Εξάρτηση:** Claude + Odoo (canonical).

### AI ops agents (το management layer) — 🔵
- **Τι:** το μακρινό όραμα — AI «agents» που παρακολουθούν & δρουν: review responder,
  inventory watcher (low-stock reorder hints), pricing monitor (ανταγωνισμός/Skroutz),
  insight reporter. Όλα ταΐζουν ένα admin dashboard.
- 🔧 **Headless build:** πατάει σε **όλα** τα προηγούμενα (Claude tool-use + Odoo + events).
- 🤖 **AI upgrade:** είναι εξ ολοκλήρου AI· ξεκινά ως **Owner insights** (→ AI layer) και
  μεγαλώνει σε action-taking με guardrails & approvals.
- 📊 High / High. **Εξάρτηση:** ολόκληρο το stack. **Το «AI που τρέχει το eshop» που οραματίζεσαι.**
- ❓ Πόση αυτονομία (suggest vs act); audit trail;

---

**Η μεγάλη εικόνα της σειράς:**
1. **Image pipeline** μπορεί τώρα (ταχύτητα, ανεξάρτητο από Odoo).
2. **Inventory sync** ASAP — αν το Entersoft δίνει stock, ξεμπλοκάρει 4-5 features άμεσα,
   χωρίς να περιμένει το Odoo.
3. **Odoo integration** = το μεγάλο project που κάνει τα υπόλοιπα «σωστά» & μόνιμα.
4. **AI ops agents** = το τελευταίο επίπεδο, αφού υπάρχουν δεδομένα & υποδομή.
