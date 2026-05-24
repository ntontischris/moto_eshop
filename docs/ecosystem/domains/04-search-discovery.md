# Domain 04 — Search & Discovery

> **Κεφάλαιο του βιβλίου · στόχος: πλήρης γνώση του χώρου πριν χτίσεις.**
> Status: ✅ χαρτογραφημένο | Stack: Meilisearch · Supabase · Claude API (semantic/NL) · embeddings
> Cross-refs: [[08-ai-layer]] (gear copilot, semantic) · [[03-reviews-social-proof]] (ratings στο ranking) · [[09-ops-odoo]] (data quality, variants) · [[10-analytics-measurement]] (search analytics)

Σε έναν κατάλογο **20.000 προϊόντων**, το discovery **είναι** το προϊόν: αν ο πελάτης
δεν βρει αυτό που θέλει, δεν το πουλάς — όσο καλό κι αν είναι. Αυτό το κεφάλαιο
χαρτογραφεί όλους τους τρόπους που ο πελάτης βρίσκει προϊόντα, και πώς το AI τους κάνει «έξυπνους».

---

## Μέρος Α — Η οικονομία / γιατί αξίζει

| Δείκτης | Νούμερο* | Τι σημαίνει |
|---|---|---|
| Conversion των search users | **~2–3× υψηλότερο** | όποιος ψάχνει, ξέρει τι θέλει = high intent |
| No-results rate | **κάθε % = χαμένες πωλήσεις** | «δεν βρέθηκε» = ο πελάτης φεύγει |
| Μεγάλος κατάλογος | 20k SKU | χωρίς καλό discovery, το 90% είναι αόρατο |

\* βιομηχανικά benchmarks (Baymard/Algolia) — τάξη μεγέθους.

**Η κεντρική θεωρία — δύο τύποι αγοραστών:**
- **Searchers** (ξέρουν τι θέλουν) → πάνε στη **μπάρα αναζήτησης**. Θες ταχύτητα & ακρίβεια.
- **Browsers** (εξερευνούν) → **κατηγορίες, φίλτρα, recommendations**. Θες καθοδήγηση.

Πρέπει να εξυπηρετείς **και τους δύο**. Και στις δύο περιπτώσεις, **relevance = τα πάντα**:
το σωστό αποτέλεσμα στη θέση 1-3, αλλιώς τους έχασες.

---

## Μέρος Β — Ο πλήρης χάρτης: οι μηχανισμοί discovery

| # | Μηχανισμός | Για ποιον | Κλειδιά |
|---|---|---|---|
| 1 | **Search bar** | searchers | typo-tolerance, synonyms, **greeklish**, autocomplete, «did you mean», no-results fallback |
| 2 | **Faceted filters** | browsers | brand, τιμή, μέγεθος, πιστοποίηση, χρήση, χρώμα |
| 3 | **Category nav / PLP** | browsers | mega menu, breadcrumbs, subcategory chips |
| 4 | **Sorting** | both | relevance, τιμή, δημοφιλία, νεότερα, rating |
| 5 | **Recommendations** | both | «μπορεί να σου αρέσει», «αγοράστηκαν μαζί», similar, recently-viewed |
| 6 | **Merchandising** | (εσύ) | pinned/boosted, εποχικά, overstock push |
| 7 | **Guided discovery** | browsers | **«Βρες ανά μηχανή» (My-Bike)**, buying guides, quizzes |
| 8 | **Personalization** | both | αποτελέσματα προσαρμοσμένα σε ιστορικό/segment |

**Σημεία θεωρίας:**
- **Zero-results = conversion killer.** Πάντα fallback (συγγενικά, δημοφιλή, «μήπως εννοείς»).
- **Greeklish/typo** είναι κρίσιμο στην ΕΛ αγορά («mpoufan»↔«μπουφάν», «shoei»↔«σοέι»).
- **Search query data = χρυσός:** σου λέει τι ζητάει ο κόσμος (demand signal) — ακόμα &
  τι ΔΕΝ βρίσκει (gap στον κατάλογο).
- **Guided discovery** (My-Bike) είναι moto-specific διαφοροποιητής: «δείξε μου ό,τι ταιριάζει στη μηχανή μου».

---

## Μέρος Γ — Η υποδομή από κάτω

**Το σημερινό πρόβλημα:** η αναζήτηση είναι PostgREST `ilike` — χωρίς typo-tolerance,
synonyms, greeklish, σωστό ranking. Τα φίλτρα Πιστοποίηση/Χρήση/μέγεθος είναι **display-only**.

- **Meilisearch** (η μηχανή): index των products (name, brand, category, specs) με
  **typo-tolerance**, **synonyms** (greeklish↔ελληνικά), **facets**, **custom ranking**
  (δημοτικότητα/rating/απόθεμα), **instant-search** dropdown. Αντικαθιστά το ilike.
- **Data quality dependency:** βρώμικα specs → κακά facets & search. Το discovery είναι
  τόσο καλό όσο τα δεδομένα → δένει με [[09-ops-odoo]] (catalog data quality).
- **Variants/μεγέθη:** για facet «μέγεθος» χρειάζεται variant data (έρχεται με Odoo).
- **Search analytics:** κατέγραψε queries, clicks, **no-results** → βελτίωσε συνώνυμα & κατάλογο.

---

## Μέρος Δ — Το AI επίπεδο (ο διαφοροποιητής)

- **Semantic / vector search:** αναζήτηση με **νόημα**, όχι keyword. «ζεστό αδιάβροχο για
  χειμώνα» → σωστά αποτελέσματα. Meili hybrid (keyword + **embeddings**).
- **Natural language query understanding:** Claude μετατρέπει «ζεστό φθηνό μπουφάν κάτω
  από 200€» → filters (category=μπουφάν, season=χειμώνας, price<200).
- **AI recommendations:** similarity (embeddings) + LLM re-ranking ανά context.
- **AI merchandising:** dynamic ranking βάσει performance (CTR/conversion/margin/απόθεμα).
- **Gear copilot:** συνομιλιακό discovery («τι κράνος για πόλη με γυαλιά;») → [[08-ai-layer]].
- **AI no-results recovery:** όταν δεν βρίσκει, το AI προτείνει εναλλακτικά.

---

## Μέρος Ε — KPIs

| Metric | Τι δείχνει |
|---|---|
| Search usage rate | πόσοι χρησιμοποιούν τη μπάρα |
| **Search conversion rate** | πόσο πουλάει η αναζήτηση (high intent) |
| **No-results rate** | χαμένες πωλήσεις + gaps καταλόγου |
| Search exit rate | κακή relevance |
| Filter usage | πόσο βοηθάνε τα facets |
| Rec click-through / attach rate | αξία των recommendations (AOV) |
| Time-to-find | ευκολία discovery |

---

## Μέρος ΣΤ — Παγίδες

- **Zero-results dead ends** → πάντα fallback.
- **Κακό greeklish/typo handling** → χάνεις μισή ΕΛ αγορά.
- **Πολλά/άσχετα φίλτρα** → paralysis· δείξε τα σχετικά ανά κατηγορία.
- **Αργή αναζήτηση** → πρέπει να είναι instant (<50ms αίσθηση).
- **Άσχετες recommendations** → χάνουν εμπιστοσύνη· καλύτερα λίγες & σχετικές.
- **Αγνόηση των search queries** → πετάς το πιο καθαρό demand signal.
- **Garbage in:** βρώμικος κατάλογος → κακό discovery (φτιάξε data quality παράλληλα).

---

## Μέρος Ζ — Για το Motomarket: το πλάνο

**Τα δεδομένα σου:** 20k κατάλογος (μεγάλος → discovery κρίσιμο), αδύναμο ilike search,
φίλτρα μερικώς display-only, **«Βρες ανά μηχανή» (My-Bike) υπάρχει** (image-led finder).

**Σειρά υλοποίησης:**
1. **Meilisearch** — typo/synonyms/greeklish/instant + custom ranking. Το μεγάλο άλμα.
2. **Wire τα display-only φίλτρα** (Πιστοποίηση/Χρήση) στα URL params (data layer έτοιμο).
3. **Recommendations** — «bought-together» (έχεις `order_items`) + recently-viewed.
4. **My-Bike personalized rail** — αξιοποίησε το finder για στοχευμένο discovery.
5. **Semantic/AI search** + natural language → 6) **gear copilot**.

**⛔ Blocked / προσοχή:** facet «μέγεθος» θέλει variants (Odoo)· φίλτρο «σε απόθεμα» θέλει
inventory· ποιότητα search εξαρτάται από catalog data quality ([[09-ops-odoo]]).

**Φάσεις:** (Φ1) Meili + φίλτρα · (Φ2) recs + My-Bike rail · (Φ3) semantic/NL search ·
(Φ4) AI merchandising + gear copilot.

---

## Ανοιχτά ερωτήματα / αποφάσεις
- **Meilisearch Cloud ή self-host;** (cost vs έλεγχος)
- **Ποια fields** searchable vs filterable; (ranking weights)
- **Greeklish synonyms:** manual seed dictionary ή AI-generated;
- **Variant/μέγεθος data:** από Odoo — πότε διαθέσιμο;
- **Embeddings provider** (Voyage/OpenAI/Cohere) & κόστος για 20k SKU;
