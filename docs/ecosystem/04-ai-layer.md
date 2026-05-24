# 04 · AI Layer

Εδώ είναι ο λόγος που πας headless. Τα προηγούμενα τρία επίπεδα φτάνουν ένα
WooCommerce· **αυτό το επίπεδο το ξεπερνά.** Το AI δεν είναι ξεχωριστό «feature» —
χώνεται μέσα στις υπάρχουσες ροές (search, PDP, reviews, support, διαχείριση).

**Κανόνας anti-dystopia:** κάθε AI feature εδώ τρέχει με **Claude API + δεδομένα που
ΕΧΟΥΜΕ** (κατάλογος, orders, reviews). Καμία πρόταση δεν υποθέτει δεδομένα/υποδομή
που δεν αποκτιέται ρεαλιστικά. Όπου το AI ακουμπά πελάτη → **human-in-the-loop** στην αρχή.

Status: 🔵 ιδέα · 🟡 σχεδιασμένο · 🟢 σε υλοποίηση · ✅ live · ⛔ blocked

---

### AI Review Engine — 🔵 · [deep-dive →](features/ai-review-engine.md)
- **Τι:** (Α) AI διαβάζει κάθε κριτική → προσωπική απάντηση (αρνητικές → άνθρωπος),
  (Β) μετατρέπει τους 3.172 Google reviewers σε πελάτες με −10% κωδικούς (GDPR-safe).
- 🛒 **Baseline:** καμία πλατφόρμα δεν το κάνει.
- 🔧/🤖 **Build:** Claude API + Supabase `reviews` + Google Business Profile API. Πλήρες
  flow, guardrails, φάσεις, GDPR → [features/ai-review-engine.md](features/ai-review-engine.md).
- 📊 High / Med. **Εξάρτηση:** Claude API · GBP API access.

### AI / semantic search — 🔵
- **Τι:** αναζήτηση με **νόημα & φυσική γλώσσα**: «ζεστό αδιάβροχο μπουφάν για χειμώνα
  κάτω από 200€» → σωστά αποτελέσματα, όχι keyword match.
- 🛒 **Baseline:** Algolia/Searchanise (keyword + λίγο AI) — εσύ μπορείς παραπάνω.
- 🔧 **Headless build:** **Meilisearch** (→ foundations) ως βάση + **embeddings** (vector
  search) για semantic. Meili υποστηρίζει hybrid (keyword + vector) → απευθείας.
- 🤖 **AI upgrade:** query understanding (Claude μετατρέπει «ζεστό φθηνό μπουφάν» →
  filters: category=μπουφάν, season=χειμώνας, price<200) + re-ranking. Greeklish/typo.
- 📊 High / Med. **Εξάρτηση:** Meili + embeddings pipeline.
- ❓ Embeddings: Voyage/OpenAI/Cohere; cost ανά 20k SKU (one-time + updates).

### AI shopping assistant — «gear copilot» — 🔵
- **Τι:** chat που ρωτάς «τι κράνος για καθημερινή πόλη με γυαλιά;» και σου προτείνει
  **πραγματικά προϊόντα από τον κατάλογο** με αιτιολόγηση. Ο πωλητής που δεν κοιμάται.
- 🛒 **Baseline:** Shopify Sidekick/apps — γενικά, όχι expert moto.
- 🔧 **Headless build:** Claude (tool use) με tools που χτυπάνε τα δικά μας queries
  (search/filter/product lookup) → grounded απαντήσεις (RAG πάνω στον κατάλογο, **όχι
  hallucinations**). Widget στο storefront.
- 🤖 **AI upgrade:** το core. Brand voice + moto expertise στο system prompt + prompt caching.
- 📊 High / Med. **Εξάρτηση:** catalog queries (υπάρχουν) + Claude. Καλύτερο με Meili.
- ❓ Πόσο proactive (popup) vs on-demand; να κλείνει αγορά (add-to-cart) ή μόνο συμβουλή;

### AI product content & translations — 🔵
- **Τι:** πλούσιες, SEO-friendly περιγραφές + **EL→EN μετάφραση** όλου του καταλόγου
  (τώρα τα δεδομένα είναι μόνο ελληνικά· το EN toggle δεν μεταφράζει).
- 🛒 **Baseline:** apps κάνουν bulk translation/descriptions.
- 🔧 **Headless build:** batch Claude jobs που γράφουν `description_en`, `description_rich`,
  normalized specs, meta/alt-text → Supabase. **Prompt caching** (ίδιο system prompt σε
  20k κλήσεις = πολύ φθηνότερο). Human spot-check.
- 🤖 **AI upgrade:** consistency στο brand voice + specs normalization (ο legacy κατάλογος
  έχει ακατάστατα specs).
- 📊 High / Med. **Εξάρτηση:** Claude API. **Ξεκλειδώνει:** σωστό EL/EN i18n + SEO.
- ❓ Batch API (50% φθηνότερο, async) για το one-time 20k bulk;

### AI merchandising / dynamic ranking — 🔵
- **Τι:** η σειρά προϊόντων σε PLP/rails προσαρμόζεται σε performance (CTR, conversion,
  margin, απόθεμα) αντί για στατικό «popular».
- 🛒 **Baseline:** Shopify/Nosto smart sorting.
- 🔧 **Headless build:** events (→ analytics) → scoring → Meili custom ranking ή query sort.
- 🤖 **AI upgrade:** AI εξηγεί *γιατί* + προτείνει ποια προϊόντα να προβληθούν (π.χ.
  overstock push, εποχικά).
- 📊 Med / Med. **Εξάρτηση:** events + Meili.

### AI support copilot — 🔵
- **Τι:** βοηθά (ή απαντά) σε ερωτήσεις πελατών: «πού είναι η παραγγελία μου», «ταιριάζει
  σε Yamaha R6;», «πολιτική επιστροφών». Draft για τον άνθρωπο, ή auto για απλά.
- 🛒 **Baseline:** Gorgias/Zendesk AI σε Shopify.
- 🔧 **Headless build:** RAG πάνω σε FAQ + catalog + order lookup (tool use). Email/chat
  inbox. Ξεκινά **draft-only** (human approve).
- 🤖 **AI upgrade:** το core· δένει με returns triage & review engine (ίδια AI υποδομή).
- 📊 Med / Med. **Εξάρτηση:** orders + FAQ content.
- ❓ Κανάλι: email, on-site chat, ή Viber/WhatsApp (δημοφιλή ΕΛ);

### Owner insights — «ρώτα το eshop σου» — 🔵
- **Τι:** ρωτάς σε φυσική γλώσσα «ποια brands ανέβηκαν τον Μάιο;», «τι παραπονιούνται
  στις κριτικές;» → AI τρέχει τα queries & απαντά με γραφήματα. Το «AI management» που θες.
- 🛒 **Baseline:** Shopify analytics (στατικά dashboards, όχι Q&A).
- 🔧 **Headless build:** Claude (tool use) με **read-only** SQL/RPC σε Supabase +
  chart rendering. Internal admin tool.
- 🤖 **AI upgrade:** το core — text-to-insight + sentiment από reviews + proactive alerts
  («οι επιστροφές στα γάντια X τριπλασιάστηκαν»).
- 📊 High / Med. **Εξάρτηση:** Supabase data + Claude. **Πρόδρομος** των AI ops agents (→ ops).
- ❓ Read-only guardrails (να μη γράφει/σβήνει)· ποιος έχει πρόσβαση.

### AI fit / size advisor — 🔵
- **Τι:** «τι μέγεθος μπουφάν για 1.80μ / 85κ;» — μειώνει επιστροφές (το #1 πρόβλημα σε apparel).
- 🛒 **Baseline:** size-chart apps.
- 🔧 **Headless build:** ⚠️ θέλει **size/variant data** (λείπει — έρχεται με Odoo). Όταν
  υπάρχει: AI συνδυάζει brand size charts + user input. Μέχρι τότε, στατικοί χάρτες.
- 🤖 **AI upgrade:** μάθηση από επιστροφές (return reason → καλύτερη πρόβλεψη).
- 📊 Med / Med. **Εξάρτηση:** size data (Odoo). **Δένει:** returns.

---

**Κοινή υποδομή (χτίσ' την μία φορά, χρησιμοποίησέ την παντού):**
- **Claude API client** + **prompt caching** (το ίδιο brand-voice system prompt σε χιλιάδες
  κλήσεις = δραματικά φθηνότερο) + **Batch API** για bulk (content/translations).
- **Brand-voice config** (tone, υπογραφή, do/don'ts) — κοινό σε review engine, assistant, support.
- **Tool-use layer** πάνω στα Supabase queries — το ίδιο pattern τροφοδοτεί assistant,
  support copilot, owner insights.
- **Human-in-the-loop** σε ό,τι ακουμπά πελάτη/δημόσιο, μέχρι να χτιστεί εμπιστοσύνη.

**Σειρά που προτείνω:**
1. **AI content & translations** (batch, χαμηλό ρίσκο, ξεκλειδώνει EN + SEO, μαθαίνουμε prompt caching).
2. **AI shopping assistant** (high wow, grounded, διαφοροποίηση).
3. **AI Review Engine MVP** (on-site πρώτα) + **Owner insights** (μοιράζονται tool-use layer).
4. **AI semantic search** (μόλις μπει Meili).
