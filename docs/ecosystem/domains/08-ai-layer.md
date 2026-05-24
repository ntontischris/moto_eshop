# Domain 08 — The AI Layer

> **Κεφάλαιο του βιβλίου · ο διαφοροποιητής — ο λόγος που πας headless.**
> Status: ✅ χαρτογραφημένο | Stack: Claude API (+ prompt caching, Batch API) · Supabase · Meilisearch · embeddings
> Cross-refs: [[04-search-discovery]] · [[03-reviews-social-proof]] · [[features/ai-review-engine]] · [[10-analytics-measurement]] · [[09-ops-odoo]]

Τα προηγούμενα κεφάλαια φτάνουν ένα WooCommerce. **Αυτό το επίπεδο το ξεπερνά.** Το AI
δεν είναι ξεχωριστό feature — **χώνεται μέσα** στις υπάρχουσες ροές (search, PDP, reviews,
support, διαχείριση). Κανόνας anti-dystopia: κάθε feature τρέχει με **Claude + δεδομένα
που ΕΧΟΥΜΕ**, και ό,τι ακουμπά πελάτη ξεκινά **human-in-the-loop**.

---

## Μέρος Α — Η οικονομία / γιατί αξίζει

- **Διαφοροποίηση:** σε αγορά με όμοια eshop, το AI είναι το μόνο που δεν αντιγράφεται με plugin.
- **Κλίμακα χωρίς προσωπικό:** ο «πωλητής που δεν κοιμάται», ο «content writer για 20k προϊόντα», ο «analyst που απαντά σε ερωτήσεις».
- **Κόστος:** με **prompt caching** (ίδιο system prompt σε χιλιάδες κλήσεις) + **Batch API**
  (−50% για async μαζικά), το κόστος ανά κλήση πέφτει δραματικά → εφικτό για 20k κατάλογο.

**Η θεωρία:** το AI αποδίδει όταν είναι **grounded** (RAG πάνω στα δικά σου δεδομένα, όχι
hallucination) και **ενσωματωμένο** στη ροή (όχι ένα chatbot στη γωνία που κανείς δεν ανοίγει).

---

## Μέρος Β — Ο πλήρης χάρτης: τα AI features

| # | Feature | Τι κάνει | Grounded σε |
|---|---|---|---|
| 1 | **Gear copilot (assistant)** | «τι κράνος για πόλη με γυαλιά;» → πραγματικά προϊόντα + αιτιολόγηση | κατάλογος (tool use) |
| 2 | **Semantic / NL search** | αναζήτηση με νόημα & φυσική γλώσσα | Meili + embeddings → [[04-search-discovery]] |
| 3 | **AI content & translations** | πλούσιες περιγραφές, EL→EN, specs normalization, meta/alt | κατάλογος (batch) |
| 4 | **AI Review Engine** | auto-reply + reviewers→πελάτες | reviews → [[features/ai-review-engine]] |
| 5 | **AI merchandising** | dynamic ranking βάσει performance | events + Meili |
| 6 | **AI support copilot** | απαντά «πού είναι η παραγγελία», fit, πολιτικές | orders + FAQ (tool use) |
| 7 | **Owner insights** | «ρώτα το eshop σου» σε φυσική γλώσσα | Supabase (read-only) → [[10-analytics-measurement]] |
| 8 | **AI fit/size advisor** | «τι μέγεθος για 1.80/85;» → μειώνει επιστροφές | size data (Odoo) |

---

## Μέρος Γ — Η κοινή υποδομή (χτίσ' την μία φορά)

> Όλα τα παραπάνω μοιράζονται την ίδια βάση — μην τη χτίσεις 8 φορές.

- **Claude API client** + **prompt caching** (φθηνό σε όγκο) + **Batch API** (bulk content/translations).
- **Brand-voice config** (tone, υπογραφή, do/don'ts) — κοινό σε copilot, support, review engine.
- **Tool-use layer** πάνω στα Supabase queries — το ίδιο pattern τροφοδοτεί assistant,
  support copilot & owner insights (με **read-only guardrails** στο τελευταίο).
- **RAG / grounding** — απαντήσεις μόνο από τα δικά μας δεδομένα (κατά hallucinations).
- **Human-in-the-loop** σε ό,τι δημόσιο/πελατειακό, μέχρι να χτιστεί εμπιστοσύνη.

---

## Μέρος Δ — (το AI ΕΙΝΑΙ το επίπεδο)
Δεν υπάρχει ξεχωριστό «AI upgrade» εδώ — όλο το κεφάλαιο είναι το AI. Η αξία προκύπτει
από το να **ενσωματωθεί** στα άλλα domains, όχι να σταθεί μόνο του.

## Μέρος Ε — KPIs

| Metric | Τι δείχνει |
|---|---|
| Assistant → conversion / attach rate | πουλάει ο copilot; |
| Semantic search no-results ↓ | καλύτερο discovery |
| Content coverage (AI descriptions/translations) | πληρότητα καταλόγου |
| Review response rate/time (auto) | αποδοτικότητα review engine |
| Support deflection rate | πόσα λύνει το AI μόνο του |
| Cost per AI action | βιωσιμότητα (caching/batch) |

## Μέρος ΣΤ — Παγίδες

- **Hallucinations** → πάντα grounded/RAG, ποτέ «ελεύθερο» LLM σε πελάτη.
- **Chatbot στη γωνία** που κανείς δεν ανοίγει → ενσωμάτωσέ το στη ροή.
- **Auto σε ευαίσθητα** (αρνητικές κριτικές, support κρίσεων) → human-in-the-loop.
- **Κόστος εκτός ελέγχου** → caching + batch + rate limits.
- **Read/write AI σε production data** → owner insights = **read-only** guardrails.
- **Dystopian over-promise** → ξεκίνα από grounded, μετρήσιμα, μικρά.

## Μέρος Ζ — Για το Motomarket: το πλάνο

**Σειρά υλοποίησης:**
1. **AI content & translations** (batch) — χαμηλό ρίσκο, ξεκλειδώνει EN + SEO, μαθαίνεις caching.
2. **Gear copilot** — high wow, grounded, μοναδική διαφοροποίηση (moto expertise).
3. **AI Review Engine MVP** (on-site) + **Owner insights** — μοιράζονται tool-use layer.
4. **Semantic/NL search** (μόλις μπει Meili).
5. **AI merchandising** + **support copilot** + **fit advisor**.

**⚠️ Εξαρτήσεις:** Meili (semantic), reviews collection (review engine), size data/Odoo (fit),
events (merchandising), GBP API (review engine Μέρος Β).

**Φάσεις:** (Φ1) content/translations + caching infra · (Φ2) copilot + owner insights ·
(Φ3) review engine + semantic search · (Φ4) merchandising + support + fit.

## Ανοιχτά ερωτήματα / αποφάσεις
- **Batch API** για το one-time 20k content/translation;
- **Copilot:** proactive (popup) vs on-demand; να κλείνει αγορά (add-to-cart) ή μόνο συμβουλή;
- **Embeddings provider** & κόστος; (κοινό με [[04-search-discovery]])
- **Owner insights:** ποιος έχει πρόσβαση & ποια read-only guardrails;
