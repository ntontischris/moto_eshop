# Domain 09 — Ops & Automation (Odoo)

> **Κεφάλαιο του βιβλίου · το «self-running» — εδώ κάθεται το Odoo.**
> Status: ✅ χαρτογραφημένο | Stack: Odoo 18 (target) · Entersoft (legacy) · Supabase · Supabase Storage · Claude
> Cross-refs: ξεκλειδώνει [[01-foundations]] (inventory), [[06-acquisition-ads-feeds]] (feeds), [[07-payments-checkout]] (orders), [[03-reviews-social-proof]], [[04-search-discovery]] (data quality)

Αυτό το επίπεδο κάνει το eshop να **τρέχει μόνο του** — και ξεκλειδώνει σχεδόν όλα τα
υπόλοιπα. Χωρίς αυτό, πολλά features είναι ⛔ (απόθεμα, τιμές, παραγγελίες). **Εδώ κάθεται
το Odoo** ως source of truth.

---

## Μέρος Α — Η οικονομία / γιατί αξίζει

- **Χρόνος = κόστος:** κάθε χειροκίνητη δουλειά (ενημέρωση αποθέματος/τιμών, καταχώρηση
  παραγγελίας) δεν κλιμακώνει. Το automation = να μη μεγαλώνει το προσωπικό όσο μεγαλώνει ο τζίρος.
- **Ακρίβεια = τζίρος:** σωστό απόθεμα/τιμές → σωστά feeds, λιγότερες ακυρώσεις, εμπιστοσύνη.
- **Το θεμέλιο δεδομένων:** όλα τα «έξυπνα» (AI, recs, feeds) θέλουν **καθαρά, σωστά δεδομένα**.

**Η θεωρία — single source of truth:** μία αυθεντική πηγή (Odoo) για προϊόντα/απόθεμα/τιμές/
παραγγελίες· το storefront (Supabase) γίνεται **read-cache**. Αλλιώς, ασυμφωνίες παντού.

---

## Μέρος Β — Ο πλήρης χάρτης

| # | Κομμάτι | Τι κάνει | Ξεκλειδώνει |
|---|---|---|---|
| 1 | **Odoo 18 integration** | source of truth: προϊόντα/απόθεμα/τιμές/παραγγελίες/πελάτες | σχεδόν τα πάντα |
| 2 | **Inventory sync** ⭐ | πραγματικό απόθεμα στο storefront | urgency, back-in-stock, feeds, availability |
| 3 | **Order orchestration** | eshop→ERP→τιμολόγηση→courier→tracking | fulfillment, transactional email |
| 4 | **Pricing & promo automation** | τιμές/προσφορές κεντρικά + price history | price-drop alerts, Omnibus compliance |
| 5 | **Image pipeline → Supabase CDN** | σωστά μεγέθη/format από fast CDN | ταχύτητα (SEO/conversion) |
| 6 | **Catalog data quality** | καθαρά specs, dedup, πληρότητα | search/feeds/recs/filters |
| 7 | **AI ops agents** | agents που παρακολουθούν & δρουν | το «AI management» |

---

## Μέρος Γ — Η υποδομή από κάτω

- **Odoo integration:** sync layer (Odoo XML-RPC/JSON-RPC ↔ Supabase). Direction ανά οντότητα:
  products/stock/prices **Odoo→Supabase**, orders **Supabase→Odoo**. Idempotent, conflict policy.
- **Inventory sync (το μεγάλο unblock):** λύνει το `stock`=0-παντού. **Ενδιάμεσο βήμα ΠΡΙΝ
  το Odoo:** αν το Entersoft API δίνει stock, sync από εκεί **τώρα** → ξεμπλοκάρει 4-5 features.
- **Image pipeline:** mirror legacy/Odoo images → **Supabase Storage**, pre-sized WebP/AVIF στο
  ingest. `SmartImage` ήδη βελτιστοποιεί supabase URLs (→ memory `project-image-architecture`).
- **Data quality:** validation rules + dedup + completeness reports πάνω στον scrape-κατάλογο.

---

## Μέρος Δ — Το AI επίπεδο

- **AI data-mapping** legacy Entersoft ↔ Odoo κατά τη μετάβαση + specs normalization.
- **AI catalog enrichment:** fill gaps, κατηγοριοποίηση, καθαρισμός (με review).
- **AI ops agents** (το όραμα): inventory watcher (low-stock reorder hints), pricing monitor
  (ανταγωνισμός/Skroutz), review responder, insight reporter → όλα σε admin dashboard.
- Ξεκινά ως **Owner insights** ([[08-ai-layer]]) και μεγαλώνει σε action-taking **με guardrails & approvals**.

---

## Μέρος Ε — KPIs

| Metric | Τι δείχνει |
|---|---|
| Inventory accuracy | σωστό απόθεμα = λιγότερες ακυρώσεις |
| Sync latency/failures | υγεία integration |
| Order cycle time (eshop→shipped) | αποδοτικότητα fulfillment |
| Feed disapproval rate | συνέπεια δεδομένων |
| Catalog completeness | ποιότητα για search/feeds/recs |
| Manual hours saved | η αξία του automation |

## Μέρος ΣΤ — Παγίδες

- **Διπλή πηγή αλήθειας** (Odoo & Supabase γράφουν το ίδιο) → ασυμφωνίες. Όρισε direction.
- **Non-idempotent sync** → διπλές παραγγελίες/λάθη.
- **Big-bang migration** Entersoft→Odoo → ρίσκο· προτίμησε σταδιακή/παράλληλη.
- **Αναμονή του Odoo για ΟΛΑ** → αν το Entersoft δίνει stock, ξεμπλόκαρε inventory τώρα.
- **Image pipeline χωρίς fallback** → (έχει ξανασυμβεί) placeholder disaster· κράτα fallback chain.

## Μέρος Ζ — Για το Motomarket: το πλάνο

**Πού είσαι:** Entersoft legacy (scrape), Odoo = target, `stock`=0 παντού, εικόνες μέσω legacy proxy.

**Σειρά υλοποίησης:**
1. **Image pipeline → Supabase CDN** — γίνεται **τώρα**, ανεξάρτητο από Odoo (ταχύτητα).
2. **Inventory sync ASAP** — αν το Entersoft API δίνει stock, ξεμπλοκάρει 4-5 features άμεσα.
3. **Odoo integration** — το μεγάλο project που κάνει τα υπόλοιπα «σωστά & μόνιμα».
4. **Order orchestration** (μετά Viva online + Odoo) + **pricing/promo automation**.
5. **Catalog data quality** (AI-assisted) — παράλληλα, βελτιώνει search/feeds/recs.
6. **AI ops agents** — το τελευταίο επίπεδο, αφού υπάρχουν δεδομένα & υποδομή.

**Φάσεις:** (Φ1) image pipeline + inventory sync (Entersoft) · (Φ2) Odoo integration ·
(Φ3) order orchestration + pricing · (Φ4) AI ops agents.

## Ανοιχτά ερωτήματα / αποφάσεις
- **Δίνει το Entersoft API απόθεμα τώρα;** (ενδιάμεση λύση πριν το Odoo)
- **Πότε στήνεται το Odoo;** Παράλληλη λειτουργία με Entersoft στη μετάβαση;
- **Inventory:** real-time ή periodic; ανά κατάστημα ή ενιαίο;
- **AI ops agents:** πόση αυτονομία (suggest vs act); audit trail;
