# Domain 03 — Reviews & Social Proof

> **Κεφάλαιο του βιβλίου · στόχος: πλήρης γνώση του χώρου πριν χτίσεις.**
> Status: ✅ χαρτογραφημένο | Stack: Supabase (`reviews`) · Resend (collection) · schema.org · Google Business Profile API · Claude API
> Cross-refs: [[02-email-messaging]] (review request flow) · [[features/ai-review-engine]] · [[08-ai-layer]] · [[06-acquisition-ads-feeds]] (rich snippets)

Το social proof είναι **ψυχολογία, όχι feature**: όταν δεν είμαστε σίγουροι, κοιτάμε τι
κάνουν οι άλλοι (Cialdini — *social proof*). Σε ένα eshop όπου ο πελάτης δεν μπορεί να
αγγίξει το προϊόν, οι κριτικές & τα σήματα εμπιστοσύνης **αντικαθιστούν τον πωλητή του
φυσικού καταστήματος**. Αυτό το κεφάλαιο χαρτογραφεί όλον τον χώρο της απόδειξης
εμπιστοσύνης.

---

## Μέρος Α — Η οικονομία / γιατί αξίζει

| Δείκτης | Νούμερο* | Τι σημαίνει |
|---|---|---|
| Διαβάζουν reviews πριν αγοράσουν | **~93%** | χωρίς αυτά, ο πελάτης φεύγει αβέβαιος |
| Conversion lift με reviews | **+10–30%** | προϊόντα με κριτικές πουλάνε σαφώς περισσότερο |
| Star rating σε Google/feeds | **+CTR** | τα ⭐ στα search results τραβάνε κλικ |
| Trust = retention | — | η εμπιστοσύνη φέρνει το επόμενο purchase |

\* βιομηχανικά benchmarks (Spiegel/BrightLocal/Baymard) — δείκτες τάξης μεγέθους.

**Η τετραπλή αξία των reviews:** (1) **conversion** (πείθουν), (2) **SEO** (φρέσκο UGC
περιεχόμενο + rich snippets), (3) **retention** (εμπιστοσύνη → επανάληψη), (4) **product
insight** (τι αγαπούν/παραπονιούνται → βελτίωση καταλόγου & merchandising).

---

## Μέρος Β — Ο πλήρης χάρτης: οι μορφές social proof

> Δεν είναι «μόνο αστεράκια». Είναι 8 ξεχωριστά εργαλεία, καθένα σε διαφορετικό σημείο του funnel.

| # | Μορφή | Τι είναι | Γιατί δουλεύει / πού |
|---|---|---|---|
| 1 | **On-site product reviews** | αστέρια + κείμενο στο PDP | η απόδειξη ακριβώς εκεί που αποφασίζει — peer validation |
| 2 | **Verified buyer + photos (UGC)** | «επιβεβαιωμένη αγορά» + φωτό πελάτη | αυθεντικότητα· φωτό = «έτσι είναι στ' αλήθεια» (μειώνει επιστροφές) |
| 3 | **External platforms** | Google, Skroutz, Trustpilot, FB | aggregate trust από τρίτη, αδιάβλητη πηγή |
| 4 | **Aggregate stats / numbers** | «40 χρόνια», «X παραγγελίες/βδομάδα», συνολικό rating | bandwagon — «όλοι τους εμπιστεύονται» |
| 5 | **Trust badges & guarantees** | ασφαλής πληρωμή, επιστροφές, authorized dealer, certifications | μειώνει αντιληπτό ρίσκο τη στιγμή της αγοράς |
| 6 | **Real-time / behavioral** | «X αγόρασαν σήμερα», bestseller, «δημοφιλές» | scarcity + popularity — ⚠️ **ΜΟΝΟ αν είναι αληθινό** |
| 7 | **Expert / editorial** | «οι ειδικοί μας προτείνουν», pro rider picks | authority — ταιριάζει στο racing/40χρονο DNA |
| 8 | **Influencer / community** | moto clubs, ambassadors, ride reports | tribe belonging — δυνατό στο moto κοινό |

**Η θεωρία ανά σημείο funnel:**
- **Top (ανακάλυψη):** external stats + ⭐ σε feeds/SERP → τραβάνε κλικ.
- **Middle (PDP, αξιολόγηση):** product reviews + UGC photos + Q&A → πείθουν.
- **Bottom (checkout):** trust badges + guarantees → διώχνουν το τελευταίο δισταγμό.
- **Post (μετά):** η εμπειρία γίνεται νέα κριτική → ο κύκλος τροφοδοτεί τον εαυτό του.

---

## Μέρος Γ — Η υποδομή από κάτω

Το #1 πρόβλημα: **δεν έχεις κριτικές αν δεν τις μαζέψεις.** Ο πίνακας `reviews` είναι άδειος.

- **Collection engine:** post-purchase email (→ [[02-email-messaging]]) +X μέρες μετά την
  παράδοση → form → γράφει στο `reviews` με `order_id`. **Χωρίς αυτό, ο χώρος μένει κενός.**
- **Verified buyer:** το `order_id` δίνει το «επιβεβαιωμένη αγορά» badge — η αυθεντικότητα.
- **Photos (UGC):** upload → **Supabase Storage**· moderation πριν εμφανιστούν.
- **Moderation:** spam / fake / προσβλητικά / νομικά (απαιτείται έλεγχος πριν δημοσίευση).
- **Display & aggregation:** PDP (λίστα + σύνοψη), PLP (⭐ στις κάρτες), homepage band.
- **Rich snippets:** `schema.org/Product` + `AggregateRating`/`Review` → ⭐ στο Google SERP
  (δένει με [[06-acquisition-ads-feeds]]).
- **External integration:** Google Business Profile API (read + reply), Skroutz merchant.

---

## Μέρος Δ — Το AI επίπεδο (πού σε βάζει μπροστά)

- **AI Review Engine** — auto προσωπική απάντηση σε κάθε κριτική, αρνητικές→άνθρωπος +
  μετατροπή των 3.172 Google reviewers σε πελάτες με −10% κωδικούς. Πλήρες:
  [[features/ai-review-engine]].
- **AI review summaries** — «τι λένε οι αναβάτες» σε 2 γραμμές πάνω από τις κριτικές.
- **AI moderation** — εντοπισμός fake/spam/τοξικού πριν δημοσιευτεί.
- **Sentiment → product insight** — εξόρυξη παραπόνων/επαίνων → τροφοδοτεί owner insights
  ([[08-ai-layer]]) & merchandising ([[04-search-discovery]]).

---

## Μέρος Ε — KPIs

| Metric | Τι δείχνει |
|---|---|
| Review coverage (% προϊόντων με ≥1 κριτική) | πόσο «ζωντανός» είναι ο κατάλογος |
| Review velocity (νέες/μήνα) | υγεία του collection engine |
| Avg rating + κατανομή | ποιότητα προϊόντων/εμπειρίας |
| Response rate & response time | πόσο φροντίζεις τη σχέση (SEO + trust) |
| Conversion lift (με vs χωρίς reviews) | η απόδειξη της αξίας |
| UGC photo rate | πόσο πλούσιο το social proof |
| Reviewer→customer redemptions | το acquisition σκέλος του Review Engine |

---

## Μέρος ΣΤ — Παγίδες (πολλές είναι ΝΟΜΙΚΕΣ)

- **Fake reviews → παράνομο** (EU Omnibus directive). Μόνο γνήσιες, κατά προτίμηση verified.
- **Εμφάνιση μόνο 5★ / λογοκρισία αρνητικών → παράνομο + σκοτώνει την εμπιστοσύνη.**
- **Καμία απάντηση σε αρνητικές** → χαμένη ευκαιρία διαχείρισης + κακή εικόνα.
- **Ψεύτικο «X βλέπουν τώρα» / urgency χωρίς πραγματικά δεδομένα →** Omnibus + καμένη εμπιστοσύνη.
- **GDPR:** εμφάνιση ονόματος/φωτό πελάτη **μόνο με συναίνεση** (ή initials, όπως στο band).
- **Honesty trap (ήδη εντοπισμένο):** Google reviews = φυσικά καταστήματα/brand, Skroutz = eshop
  → να πλαισιώνονται τίμια· νούμερα στρογγυλοποιημένα **προς τα κάτω**.

---

## Μέρος Ζ — Για το Motomarket: το πλάνο

**Το asset σου είναι τεράστιο & σπάνιο:** ~**3.172 Google reviews 4.9★** + Skroutz 5.0★ +
~**40 χρόνια** + φυσικά καταστήματα. Λίγα ελληνικά eshop έχουν τέτοιο trust capital.

**Τι έγινε ήδη:** social-proof band στο homepage (external proof, clickable, τίμιο
framing, στρογγυλοποίηση κάτω) — βλ. [[project-home-engagement-roadmap]].

**Το κενό:** ο πίνακας `reviews` είναι άδειος → καμία on-site κριτική, κανένα ⭐ στις
κάρτες/SERP. Λύνεται με collection (post-purchase email).

**Σειρά υλοποίησης:**
1. **External proof display** ✅ (homepage band — έγινε).
2. **Collection engine** — post-purchase email → on-site reviews (ξεκλειδώνει τα πάντα εδώ).
3. **Verified buyer + photos** (Supabase Storage) + display σε PDP/PLP.
4. **Rich snippets** (schema) → ⭐ στο Google SERP (δωρεάν CTR).
5. **AI Review Engine** — auto-reply + reviewers→customers (−10%).

**⛔ Blocked / προσοχή:** real-time «X αγόρασαν» θέλει order events + απόλυτη ειλικρίνεια·
«δημοφιλές/σε απόθεμα» θέλει inventory ([[09-ops-odoo]]).

**Φάσεις:** (Φ1) collection + on-site display · (Φ2) photos + rich snippets ·
(Φ3) AI Review Engine MVP (on-site) · (Φ4) Google GBP API → reviewers→customers κύμα.

---

## Ανοιχτά ερωτήματα / αποφάσεις
- **Google Business Profile API access** — το έχει/μπορεί να το δώσει ο owner; (το #1 gate)
- **Κίνητρο για κριτική;** Νόμιμα: μπορείς να δώσεις κίνητρο, αλλά με **disclosure** και
  **όχι** υπό όρο θετικής βαθμολογίας.
- **Skroutz:** υπάρχει merchant API για εμφάνιση/απάντηση κριτικών, ή χειροκίνητα;
- **UGC photos:** moderation χειροκίνητο ή AI-assisted από την αρχή;
