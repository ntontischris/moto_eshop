# Domain 07 — Payments & Checkout

> **Κεφάλαιο του βιβλίου · στόχος: πλήρης γνώση του χώρου πριν χτίσεις.**
> Status: ✅ χαρτογραφημένο | Stack: Viva (target) · COD (τώρα) · Next.js checkout · Supabase orders
> Cross-refs: [[02-email-messaging]] (abandoned cart, confirmations) · [[01-foundations]] (coupons) · [[09-ops-odoo]] (orders→ERP) · [[10-analytics-measurement]] (funnel)

Το checkout είναι **το τελευταίο μέτρο πριν τα λεφτά** — και εκεί χάνονται οι
περισσότερες πωλήσεις. Κάθε τριβή κοστίζει άμεσα. Αυτό το κεφάλαιο χαρτογραφεί τις
μεθόδους πληρωμής (ειδικά για ΕΛ) και τη βελτιστοποίηση του checkout.

---

## Μέρος Α — Η οικονομία / γιατί αξίζει

| Δείκτης | Νούμερο* | Τι σημαίνει |
|---|---|---|
| Cart abandonment | **~70%** μ.ό. | 7 στους 10 φεύγουν στο τελευταίο βήμα |
| Λόγος #1 εγκατάλειψης | extra κόστη / πολυπλοκότητα | κάθε τριβή = χαμένη πώληση |
| Recovery (abandoned cart email) | επανακτά **5–15%** | δένει με [[02-email-messaging]] |

\* βιομηχανικά benchmarks (Baymard) — τάξη μεγέθους.

**Η θεωρία:** στο checkout ο πελάτης έχει ήδη αποφασίσει· δουλειά σου είναι να **μην του
βάλεις εμπόδια**. Κάθε επιπλέον πεδίο, έκπληξη κόστους ή υποχρεωτικό login → απώλεια.
Το checkout optimization έχει το **υψηλότερο ROI** γιατί δουλεύεις με ήδη-ζεστό κοινό.

---

## Μέρος Β — Ο πλήρης χάρτης: μέθοδοι πληρωμής (ΕΛ αγορά)

| Μέθοδος | Τι είναι | ΕΛ σημείωση |
|---|---|---|
| **Κάρτες (Viva)** | credit/debit μέσω Viva Smart Checkout | ο βασικός online τρόπος· **target** |
| **IRIS** | άμεση τραπεζική πληρωμή (P2B) | **ραγδαία ανάπτυξη στην ΕΛ**, χαμηλό κόστος |
| **Αντικαταβολή (COD)** | πληρωμή στην παράδοση | **τεράστιο στην ΕΛ**· ο τωρινός μοναδικός τρόπος |
| **Δόσεις** | άτοκες/έντοκες με κάρτα | σημαντικό για ακριβά (κράνη/στολές) |
| **Apple/Google Pay** | wallet 1-tap | μειώνει τριβή σε mobile |
| **Τραπεζική κατάθεση** | manual | παλιό αλλά ζητείται |

**Θεωρία επιλογών:** οι Έλληνες θέλουν **επιλογές & εμπιστοσύνη** — COD + IRIS + κάρτες
καλύπτουν το μεγαλύτερο φάσμα. Οι **δόσεις** ξεκλειδώνουν τα ακριβά προϊόντα (μέσο
καλάθι ↑). Λείπει οποιοδήποτε online → τώρα μόνο COD (χάνεις όσους θέλουν να πληρώσουν τώρα).

---

## Μέρος Γ — Η υποδομή: το checkout flow & η βελτιστοποίηση

**Το checkout σήμερα:** guest form + server action `placeOrder` → γράφει `orders`/`order_items`
(COD μόνο, Viva DISABLED placeholder). Υπάρχει `discount` field.

**Best practices (η «επιστήμη» του checkout):**
- **Guest checkout** (μην επιβάλλεις λογαριασμό) — #1 anti-abandonment.
- **Λίγα βήματα / single-page** — κάθε βήμα χάνει κόσμο.
- **Διαφάνεια κόστους νωρίς** (μεταφορικά/φόροι) — όχι εκπλήξεις στο τέλος.
- **Trust signals στο checkout** (ασφαλής πληρωμή, επιστροφές) → [[03-reviews-social-proof]].
- **Address autocomplete, καθαρά λάθη, mobile-first.**
- **Coupon field** (→ [[01-foundations]]) χωρίς να «τραβάει» τον κόσμο να ψάχνει κωδικό έξω.
- **Email capture στο 1ο βήμα** → ενεργοποιεί abandoned-cart recovery.

**Payment integration:** Viva Smart Checkout / Smart Checkout API· **webhook verification**
για το πραγματικό payment status (ποτέ μην εμπιστεύεσαι client-side)· idempotency.

---

## Μέρος Δ — Το AI επίπεδο

- **AI fraud / anomaly detection** σε ύποπτες παραγγελίες (ειδικά COD — risk ακύρωσης).
- **AI-tuned abandoned cart** (timing & κίνητρο) → [[02-email-messaging]].
- **AI address normalization** (καθαρά ελληνικά πεδία/ΤΚ).
- **Dynamic checkout nudges** (π.χ. «+15€ για δωρεάν μεταφορικά») με πραγματικά δεδομένα.

---

## Μέρος Ε — KPIs

| Metric | Τι δείχνει |
|---|---|
| **Checkout conversion rate** | πόσοι ολοκληρώνουν |
| **Cart/checkout abandonment** | πού & πόσο χάνεις |
| Payment method mix | τι προτιμούν (COD vs online) |
| Payment failure rate | τεχνικά/trust προβλήματα |
| COD cancellation rate | ρίσκο αντικαταβολής |
| AOV (μέσο καλάθι) | επίδραση δόσεων/upsell |

---

## Μέρος ΣΤ — Παγίδες

- **Υποχρεωτικό login** → μαζική εγκατάλειψη. Πάντα guest.
- **Κρυφά κόστη στο τέλος** → ο #1 λόγος abandonment.
- **Εμπιστοσύνη client-side payment status** → ασφάλεια/λογιστικό χάος· μόνο webhooks.
- **Μόνο COD** → χάνεις όσους θέλουν να πληρώσουν online τώρα + ρίσκο ακυρώσεων.
- **Πολλά βήματα / κακό mobile** → οι Έλληνες αγοράζουν πολύ από κινητό.
- **Omnibus/τιμές** στο checkout (συνέπεια με PLP).

---

## Μέρος Ζ — Για το Motomarket: το πλάνο

**Πού είσαι:** checkout guest υπάρχει, **μόνο COD**, Viva placeholder, `discount` field έτοιμο.

**Σειρά υλοποίησης:**
1. **Viva (κάρτες) + webhook verification** — η μεγάλη απουσία· ξεκλειδώνει online πληρωμή.
2. **IRIS** — φθηνό, ανερχόμενο στην ΕΛ.
3. **Coupon field** στο checkout (→ ενεργοποιεί −10% / loyalty redemption).
4. **Email capture + abandoned cart** (→ [[02-email-messaging]]).
5. **Checkout UX pass** (βήματα, διαφάνεια κόστους, trust, mobile).
6. **Δόσεις** για ακριβά (κράνη/στολές) → AOV ↑.

**⚠️ Εξαρτήσεις:** Viva account/keys (user) · orders→Odoo για fulfillment ([[09-ops-odoo]]).

**Φάσεις:** (Φ1) Viva + webhooks + coupon field · (Φ2) IRIS + abandoned cart ·
(Φ3) checkout UX + δόσεις · (Φ4) AI fraud + dynamic nudges.

---

## Ανοιχτά ερωτήματα / αποφάσεις
- **Viva account & keys** — υπάρχουν; (το gate για online πληρωμές)
- **Δόσεις:** μέσω Viva ή τράπεζας; από ποιο ποσό;
- **COD:** προμήθεια/όριο/χρέωση για μείωση ακυρώσεων;
- **Τιμολόγηση/ΑΑΔΕ** (myDATA) — μέσω Odoo;
