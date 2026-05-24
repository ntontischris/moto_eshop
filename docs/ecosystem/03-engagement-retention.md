# 03 · Engagement & Retention

Acquisition φέρνει κόσμο **μία φορά**· εδώ τον **κρατάμε & τον μεγαλώνουμε**. Το
φθηνότερο τζίρο: ο πελάτης που έχεις ήδη. Σε moto gear (επαναλαμβανόμενες αγορές:
λάδια, αναλώσιμα, νέα σεζόν) το retention είναι χρυσός.

Status: 🔵 ιδέα · 🟡 σχεδιασμένο · 🟢 σε υλοποίηση · ✅ live · ⛔ blocked

---

### Email lifecycle (welcome / post-purchase / win-back) — 🟡
- **Τι:** αυτοματοποιημένες σειρές email στη σωστή στιγμή: welcome (μετά newsletter
  signup), post-purchase (ευχαριστώ + ζήτα κριτική), win-back (90 μέρες σιωπής),
  seasonal (αρχή σεζόν).
- 🛒 **Baseline:** Klaviyo/Omnisend κουμπώνουν σε Shopify σε ώρες.
- 🔧 **Headless build:** η λίστα **υπάρχει** (`newsletter_subscribers`). Λείπει: email
  provider (**Resend** → foundations), templates (React Email), trigger engine —
  Supabase `pg_cron`/Edge Functions ή Vercel cron που διαβάζει events & στέλνει.
- 🤖 **AI upgrade:** AI subject lines + personalized περιεχόμενο ανά segment + best-send-time.
- 📊 High / Med. **Εξάρτηση:** transactional email (Resend). **Δένει:** reviews collection.
- ❓ Δικό μας engine (Resend+cron) ή έτοιμο (Klaviyo); Το headless ζορίζει το «έτοιμο».

### Abandoned cart recovery — 🔵
- **Τι:** ο χρήστης βάζει στο καλάθι, φεύγει → email/notification υπενθύμισης (συχνά +
  μικρό κίνητρο). **Από τα υψηλότερα ROI features σε κάθε eshop.**
- 🛒 **Baseline:** built-in/1-app σε πλατφόρμες — **κλασικό «δωρεάν στο Woo, χτίσ' το μόνος» κενό**.
- 🔧 **Headless build:** θέλει **persistent cart** (→ foundations) ώστε να ξέρεις τι
  εγκαταλείφθηκε + email του χρήστη + cron που εντοπίζει stale carts → email σειρά
  (1h / 24h / 72h). Για guests: capture email στο πρώτο βήμα checkout.
- 🤖 **AI upgrade:** AI-tuned timing & κίνητρο (πότε/πόσο −% χρειάζεται για να κλείσει).
- 📊 **Very High** / Med. **Εξάρτηση:** persistent cart + email.
- ❓ Κίνητρο από το 1ο email ή μόνο στο 3ο (να μην «μάθουν» να εγκαταλείπουν);

### Loyalty / points — 🔵
- **Τι:** πόντοι ανά αγορά → εξαργύρωση. Tiers (π.χ. «Rookie/Rider/Pro»). Κρατάει
  τον πελάτη στο δικό σου eshop αντί στο Skroutz.
- 🛒 **Baseline:** Smile.io/LoyaltyLion σε Shopify.
- 🔧 **Headless build:** `loyalty_accounts` + `points_ledger` στο Supabase, earn στο
  order completion, redeem ως coupon (→ foundations). Account UI με υπόλοιπο/ιστορικό.
- 🤖 **AI upgrade:** personalized rewards/challenges («αγόρασε γάντια, +διπλοί πόντοι»).
- 📊 High / High. **Εξάρτηση:** accounts + orders + coupons.
- ❓ Earn rate; λήξη πόντων; tiers από την αρχή ή flat;

### Personalization & recommendations — 🔵
- **Τι:** «μπορεί να σου αρέσει», «αγοράστηκαν μαζί», personalized rails στο homepage.
  Αυξάνει AOV & relevance.
- 🛒 **Baseline:** Shopify recs API· Woo με plugin.
- 🔧 **Headless build:** δεδομένα **υπάρχουν** (`order_items` για co-purchase, μπορούμε
  να γράφουμε `view_events`). Ξεκίνα απλά: «bought-together» (SQL/association rules),
  «same category popular», recently-viewed (client). Μετά: embeddings-based similarity.
- 🤖 **AI upgrade:** semantic similarity (embeddings) + LLM re-ranking ανά context →
  [AI layer](04-ai-layer.md).
- 📊 High / Med. **Εξάρτηση:** order_items (υπάρχει) + view events.
- ❓ Personalized μόνο για logged-in ή και session-based για guests;

### Recently viewed — 🔵
- **Τι:** «είδες πρόσφατα» rail. Απλό, αποτελεσματικό re-engagement.
- 🔧 **Headless build:** localStorage (guests) + sync σε account. Conditional rail στο
  homepage (κρύβεται αν άδειο — anti-overkill κανόνας του home roadmap).
- 📊 Med / Low. **Εξάρτηση:** —.

### Back-in-stock & price-drop alerts — ⛔
- **Τι:** «ειδοποίησέ με όταν επιστρέψει / πέσει η τιμή». Μετατρέπει lost sales + χτίζει list.
- 🛒 **Baseline:** plugin σε πλατφόρμες.
- 🔧 **Headless build:** ⛔ θέλει **inventory** (back-in-stock) & **price history**
  (price-drop) — και τα δύο εξαρτώνται από Odoo sync. Η UI (κουμπί «ειδοποίησέ με» +
  πίνακας `stock_alerts`) χτίζεται από τώρα· τα triggers ανάβουν μετά το sync.
- 📊 High / Med. **Εξάρτηση:** inventory + price history (Odoo).

### Segmentation / RFM — 🔵
- **Τι:** ομαδοποίηση πελατών (Recency/Frequency/Monetary, κατηγορία, brand affinity)
  για στοχευμένο marketing. Έχεις **~28k legacy `erp_customers`**.
- 🛒 **Baseline:** Klaviyo segments.
- 🔧 **Headless build:** SQL/materialized views πάνω σε orders + erp_customers → segments
  → τροφοδοτούν lifecycle/campaigns.
- 🤖 **AI upgrade:** AI churn-prediction & next-best-product ανά segment → [Owner insights](04-ai-layer.md).
- 📊 Med / Med. **Εξάρτηση:** orders + erp_customers. **GDPR:** legal basis για χρήση legacy δεδομένων.
- ❓ Τα 28k legacy customers έχουν marketing consent;

---

**Σειρά που προτείνω:**
1. **Email lifecycle** (μόλις υπάρχει Resend) — ξεκλειδώνει και τη συλλογή reviews.
2. **Abandoned cart** (μόλις υπάρχει persistent cart) — από τα υψηλότερα ROI.
3. **Recently viewed + απλές recs** — low effort, άμεσο relevance.
4. Loyalty → Segmentation → (μετά Odoo) back-in-stock.
