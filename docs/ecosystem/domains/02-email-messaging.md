# Domain 02 — Email & Messaging

> **Κεφάλαιο του βιβλίου · στόχος: πλήρης γνώση του χώρου πριν χτίσεις.**
> Status: ✅ χαρτογραφημένο | Stack: Resend · React Email · Supabase · (μελλοντικά Odoo order events)
> Cross-refs: [[03-reviews-social-proof]] (review request) · [[05-loyalty-retention]] (lifecycle) · [[08-ai-layer]] (AI subject/timing)

Το email δεν είναι «μια λειτουργία». Είναι **ολόκληρο κανάλι** — το πιο κερδοφόρο που
θα έχεις, και το μόνο που **σου ανήκει 100%** (δεν πληρώνεις algorithm για να φτάσεις
τον πελάτη). Αυτό το κεφάλαιο χαρτογραφεί όλον τον χώρο: την οικονομία, τα 3 είδη
email, τα άλλα κανάλια messaging, την υποδομή από κάτω, τα KPIs, τις παγίδες, και το
πλάνο για το Motomarket.

---

## Μέρος Α — Η οικονομία του email (γιατί αξίζει διπλά)

| Δείκτης | Νούμερο* | Τι σημαίνει |
|---|---|---|
| ROI | **~€36–42 ανά €1** | το #1 κανάλι του commerce σε απόδοση |
| Flows vs campaigns | **flows = 30%+ του τζίρου** από <5% των αποστολών | τα *αυτόματα* email φέρνουν δυσανάλογο τζίρο |
| Open rate transactional | **40–60%** | vs 15–25% στα marketing — ο πελάτης τα περιμένει |
| Ιδιοκτησία | **100% owned** | δεν εξαρτάσαι από Meta/Google reach |

\* βιομηχανικά benchmarks (Klaviyo/Shopify/Litmus averages) — δείκτες τάξης μεγέθους, όχι δικά σου νούμερα.

**Η κεντρική αρχή — flows > campaigns:** ένα campaign (newsletter) το γράφεις κάθε
φορά από την αρχή. Ένα **flow** (π.χ. abandoned cart) το στήνεις **μία φορά** και
δουλεύει για πάντα, στοχευμένα, στη σωστή στιγμή για κάθε πελάτη ξεχωριστά. Γι' αυτό
τα flows έχουν την υψηλότερη απόδοση: είναι 1-προς-1 και triggered από πραγματική πρόθεση.

---

## Μέρος Β — Ο πλήρης χάρτης: 3 οικογένειες email

### 🧾 1. Transactional — triggered από συναλλαγή, το περιμένει ο πελάτης

> Λειτουργικά · υψηλότατο open rate · **νόμιμα χωρίς marketing consent** (είναι μέρος της εξυπηρέτησης).

**Η θεωρία (γιατί δουλεύουν):**
- **Post-purchase anxiety gap.** Ανάμεσα στο «πλήρωσα» και «το κρατάω» υπάρχει
  αβεβαιότητα. Κάθε email κλείνει το κενό → λιγότερο άγχος → **λιγότερα τηλέφωνα,
  λιγότερες ακυρώσεις & chargebacks**.
- **Owned attention.** 100% προσοχή χωρίs ad κόστος → εδώ μπολιάζεις διακριτικά review
  request / cross-sell χωρίς να γίνεσαι spam.
- **Trust → repeat.** Η ομαλή post-purchase εμπειρία είναι ο #1 λόγος επανάληψης· το
  πρώτο επαναληπτικό purchase κερδίζεται εδώ.

| Email | Business logic |
|---|---|
| Επιβεβαίωση παραγγελίας | κλείνει το anxiety gap — η ψηφιακή «απόδειξη» |
| Αποστολή + tracking | απαντά proactively στο «πού είναι;» (το #1 ticket) |
| Παραδόθηκε | κλείνει τον κύκλο — σκαλοπάτι για το review request |
| Πρόβλημα / καθυστέρηση | διαχείριση κρίσης πριν γίνει τηλέφωνο ή κακή κριτική |
| Reset password / λογαριασμός | security & trust |
| Τιμολόγιο / παραστατικό | B2B & λογιστικά |

### ⚙️ 2. Behavioral / Lifecycle flows — triggered από συμπεριφορά

> **ΕΔΩ είναι τα λεφτά.** Αυτόματα, 1-προς-1. Στήνεις μία φορά → δουλεύουν για πάντα.
> ⭐ = κορυφαία προτεραιότητα/απόδοση.

| Flow | Trigger | Business logic | Motomarket |
|---|---|---|---|
| **Welcome series** ⭐ | νέο signup | ο subscriber είναι ο πιο ζεστός — γνωριμία brand + ώθηση 1ης αγοράς | δένει με −10% newsletter |
| **Abandoned cart** ⭐ | προϊόν στο καλάθι, έφυγε | επαναφέρει χαμένη πρόθεση — top ROI flow | θέλει persistent cart |
| Abandoned checkout | ξεκίνησε checkout, δεν πλήρωσε | ακόμα πιο ζεστό — έδωσε στοιχεία | capture email στο 1ο βήμα |
| Browse abandonment | είδε προϊόν, δεν το έβαλε | soft nudge σε ενδιαφέρον | θέλει view events |
| **Post-purchase → review** ⭐ | παράδοση + Χ μέρες | μετατρέπει αγορά σε κριτική | **ταΐζει το asset των 3.172 reviews** |
| **Replenishment / reorder** ⭐ | Χ μέρες μετά από αναλώσιμο | «τελειώνει το λάδι σου;» | **ΧΡΥΣΟΣ για λάδια/αλυσίδες/λάστιχα** |
| Back-in-stock | επιστροφή αποθέματος | επαναφέρει lost demand | ⛔ θέλει inventory sync |
| Price-drop | wishlist item έπεσε | trigger αγοράς σε γνωστό ενδιαφέρον | θέλει price history |
| Win-back / lapsed | 60–120 μέρες σιωπή | φθηνότερο από νέο πελάτη | ~28k legacy customers (με consent) |
| VIP / loyalty milestones | όριο πόντων/τζίρου | αναγνώριση → αφοσίωση | δένει με loyalty |
| Birthday / επέτειος | ημερομηνία | προσωπικό κίνητρο τη σωστή στιγμή | προαιρετικό |
| Wishlist reminders | item στη wishlist | «ακόμα το θες;» — χαμηλή όχληση | θέλει account wishlist |

**Deep στα ⭐ (η θεωρία τους):**
- **Welcome series:** το «παράθυρο ζεστασιάς» είναι λίγες μέρες μετά το signup. Μην
  στείλεις 1 email — στείλε σειρά 2-3 (καλωσόρισμα + brand story + κίνητρο). Θέτει
  expectations & κάνει το πρώτο purchase ευκολότερο.
- **Abandoned cart:** ο πελάτης ΕΔΕΙΞΕ πρόθεση. Σειρά 1h / 24h / 72h· κίνητρο ιδανικά
  στο 3ο (αλλιώς «εκπαιδεύεις» τον κόσμο να εγκαταλείπει για να πάρει έκπτωση).
- **Post-purchase → review:** το ζητάς όταν το προϊόν έχει φτάσει & δοκιμαστεί (π.χ.
  +7-10 μέρες). Χωρίς αυτό το flow, ο πίνακας `reviews` μένει άδειος για πάντα.
- **Replenishment:** το unfair advantage σου. Ξέρεις πότε τελειώνει ένα αναλώσιμο
  (π.χ. λάδι κάθε ~3-4 μήνες). Το email τη σωστή στιγμή = σχεδόν εγγυημένη πώληση.
- **Win-back:** φθηνότερο να ξυπνήσεις «κοιμισμένο» πελάτη παρά να αποκτήσεις νέο.

### 📣 3. Campaign / Broadcast — εσύ αποφασίζεις πότε, σε segments

> Marketing · **απαιτεί opt-in consent (GDPR)** · αξία μέσω **relevance**, όχι όγκου.

| Email | Business logic |
|---|---|
| Newsletter | σχέση + brand voice (το `newsletter_subscribers` σου) |
| New arrivals | νέα προϊόντα/brands στους ενδιαφερόμενους |
| Seasonal / sales | χειμώνας → θερμαινόμενα/αδιάβροχα · καλοκαίρι → αεριζόμενα |
| Buying guides / education | «πώς διαλέγεις κράνος» — value-first (δένει με SEO content) |
| Brand storytelling | 40 χρόνια, racing DNA — διαφοροποίηση από τα «κουτιά» |

**Αρχή των campaigns: segment, μην κάνεις blast.** Το ίδιο email σε όλους = χαμηλό
relevance → unsubscribes. Στόχευσε ανά κατηγορία/brand affinity/RFM (→ [[05-loyalty-retention]]).

---

## Μέρος Γ — Πέρα από το email: τα άλλα κανάλια messaging

Το «Email & messaging» δεν είναι μόνο email. Κάθε κανάλι έχει τον ρόλο του:

| Κανάλι | Δυνατά | Πότε το χρησιμοποιείς | ΕΛ αγορά |
|---|---|---|---|
| **Email** | φθηνό, πλούσιο, owned | τα πάντα (flows + campaigns) | παντού |
| **SMS** | ~98% open, άμεσο | επείγον/transactional: «η παραγγελία στάλθηκε», OTP | κοστίζει/μήνυμα — feαπό με φειδώ |
| **Viber / WhatsApp** | πλούσιο, δημοφιλές | order updates, support, promos | **τεράστιο στην Ελλάδα** (Viber) |
| **Web push** | χωρίς email, instant | back-in-stock, price-drop, cart | καλό για repeat visitors |
| **App push** | άμεσο, owned | future (αν φτιαχτεί app) | μελλοντικό |

**Channel theory:** βάλε το σωστό μήνυμα στο σωστό κανάλι. Επείγον & σύντομο → SMS/Viber.
Πλούσιο & εκπαιδευτικό → email. Real-time & χωρίς στοιχεία επικοινωνίας → web push.
**Μην** στέλνεις τα πάντα παντού (fatigue + κόστος).

---

## Μέρος Δ — Η υποδομή από κάτω (το υπόβαθρο που κανείς δεν σου λέει)

Χωρίς αυτά, ακόμα και τέλεια emails πέφτουν σε spam.

- **Deliverability — SPF + DKIM + DMARC:** DNS records που λένε «ποιος επιτρέπεται να
  στέλνει για το domain σου». Χωρίς αυτά → spam folder. **Πρώτο setup, μία φορά.**
- **Sender reputation:** χτίζεται με τον χρόνο (warmup). Νέο domain που στέλνει 10k
  emails μέρα-1 → κάηκε. Ανέβα σταδιακά.
- **Χώρισε transactional από marketing streams** (ξεχωριστά subdomains, π.χ.
  `orders@` vs `news@`). Έτσι ένα marketing που πέφτει σε spam **δεν ρίχνει** τα
  κρίσιμα confirmation emails.
- **List hygiene:** καθάρισε bounces & inactive. Βρώμικη λίστα → πέφτει η reputation
  → πέφτουν ΟΛΑ.
- **GDPR consent:** transactional = επιτρεπτό χωρίς opt-in (εξυπηρέτηση)· marketing =
  **ΜΟΝΟ με ρητό opt-in** + εύκολο unsubscribe σε κάθε email. Το `newsletter_subscribers`
  είναι η νόμιμη opt-in λίστα σου.

---

## Μέρος Ε — KPIs: πώς το μετράμε

| Metric | Τι δείχνει | Στόχος (τάξη μεγέθους) |
|---|---|---|
| Delivery rate | έφτασε το email | >98% |
| Open rate | τράβηξε το subject | transactional 40-60% · marketing 20-35% |
| Click rate (CTR) | δούλεψε το περιεχόμενο | 2-5% marketing |
| Conversion / revenue per recipient | **το μόνο που μετράει τελικά** | ανά flow |
| Unsubscribe rate | over-mailing / κακό relevance | <0.5% |
| Spam complaint rate | καίει τη reputation | <0.1% |
| List growth | υγεία του καναλιού | θετική |

**Ο κανόνας:** μέτρα **revenue per email**, όχι open rate. Ένα email με μικρό open
αλλά υψηλό conversion αξίζει περισσότερο από ένα «δημοφιλές» που δεν πουλάει.

---

## Μέρος ΣΤ — Παγίδες / pitfalls

- **Over-mailing →** fatigue → unsubscribes → χάνεις το κανάλι. Συχνότητα με σεβασμό.
- **Ανακάτεμα streams →** ένα κακό marketing ρίχνει τα confirmations.
- **Αγορά λιστών →** παράνομο + καταστρέφει reputation. ΠΟΤΕ.
- **Χωρίς consent →** πρόστιμα GDPR. Πάντα opt-in για marketing.
- **Αγνόηση mobile rendering →** τα μισά emails ανοίγονται σε κινητό. Test.
- **Μόνο campaigns, καθόλου flows →** αφήνεις τα εύκολα λεφτά στο τραπέζι.

---

## Μέρος Ζ — Για το Motomarket: το πλάνο

**Stack mapping:**
- **Resend** (αποστολή) + **React Email** (templates) — το head.
- **Triggers:** Supabase Edge Functions / `pg_cron`, ή Vercel cron που διαβάζει
  events (orders, carts, signups). Μελλοντικά: Odoo order/stock events.
- **Consent list:** `newsletter_subscribers` (υπάρχει).
- **Δεδομένα:** orders/order_items (post-purchase, replenishment), erp_customers (win-back).

**Σειρά υλοποίησης:**
1. **Order confirmation + shipping** — το θεμέλιο (foundation).
2. **Post-purchase → review request** — ξεκλειδώνει το asset των 3.172 reviews.
3. **Welcome series + abandoned cart** — τα δύο highest-ROI flows.
4. **Replenishment** — το μυστικό όπλο για consumables.
5. **Win-back** — φθηνός τζίρος από legacy customers (με consent).

**⛔ Blocked (έρχονται με Odoo):** back-in-stock (inventory), price-drop (price history).

**Φάσεις:** (Φ1) transactional + review request · (Φ2) welcome + abandoned cart ·
(Φ3) replenishment + win-back + segmentation · (Φ4) SMS/Viber για επείγοντα + web push.

---

## Ανοιχτά ερωτήματα / αποφάσεις
- **Build vs buy:** δικό μας engine (Resend + cron, max έλεγχος, ταιριάζει στο headless)
  ή έτοιμο (Klaviyo, γρήγορο αλλά ακριβό & λιγότερο «δικό σου»);
- **Domain/DKIM:** ποιος διαχειρίζεται το DNS του domain για το setup;
- **SMS/Viber provider** για ΕΛ (π.χ. Yuboto/Routee) — αξίζει από την αρχή ή Φ4;
- **Replenishment timing:** από πού ξέρουμε τον κύκλο κάθε αναλώσιμου; (heuristic ανά
  κατηγορία τώρα· ακριβές με δεδομένα αγορών αργότερα.)
