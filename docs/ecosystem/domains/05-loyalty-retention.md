# Domain 05 — Loyalty & Retention

> **Κεφάλαιο του βιβλίου · στόχος: πλήρης γνώση του χώρου πριν χτίσεις.**
> Status: ✅ χαρτογραφημένο | Stack: Supabase (loyalty/points/segments) · coupons (foundations) · orders · erp_customers · Claude
> Cross-refs: [[02-email-messaging]] (lifecycle/win-back) · [[06-acquisition-ads-feeds]] (LTV:CAC) · [[01-foundations]] (coupons) · [[08-ai-layer]] (churn/next-best)

Acquisition φέρνει τον πελάτη **μία φορά**· εδώ τον κάνεις να **ξαναέρθει**. Σε moto gear
(λάδια, αναλώσιμα, νέα σεζόν) η επανάληψη είναι φυσική — άρα το retention είναι ο πιο
φθηνός & σταθερός τζίρος σου.

---

## Μέρος Α — Η οικονομία / γιατί αξίζει

| Δείκτης | Νούμερο* | Τι σημαίνει |
|---|---|---|
| Κόστος νέου vs υπάρχοντος πελάτη | **~5× ακριβότερος** ο νέος | το retention είναι φθηνότερος τζίρος |
| +5% retention | **+25–95% κέρδος** | μικρή βελτίωση retention = τεράστιο profit (Bain) |
| Πιθανότητα πώλησης | **60–70%** σε υπάρχοντα vs 5–20% σε νέο | πουλάς πιο εύκολα σε όποιον σε ξέρει |

\* βιομηχανικά benchmarks — τάξη μεγέθους.

**Η σύνδεση με το acquisition:** retention ↑ → **LTV ↑** → μπορείς να ξοδέψεις πιο πολύ
σε CAC από τον ανταγωνιστή (→ [[06-acquisition-ads-feeds]]). Το retention είναι το
«πολλαπλασιαστικό» κομμάτι του μοντέλου.

---

## Μέρος Β — Ο πλήρης χάρτης: τα εργαλεία retention

| # | Εργαλείο | Τι κάνει | Θεωρία |
|---|---|---|---|
| 1 | **Loyalty / points** | πόντοι ανά αγορά → εξαργύρωση | switching cost — «έχω πόντους εδώ, γιατί αλλού;» |
| 2 | **Tiers** (Rookie/Rider/Pro) | επίπεδα με προνόμια | status + στόχος για ανέβασμα |
| 3 | **Referral** | πελάτης φέρνει πελάτη | trust transfer (φθηνό acquisition) |
| 4 | **Email lifecycle** | welcome/win-back/replenishment | → [[02-email-messaging]] |
| 5 | **Segmentation / RFM** | ομαδοποίηση για στόχευση | relevance → απόδοση |
| 6 | **Replenishment / reorder** | «τελειώνει το λάδι σου;» | habit — η φυσική επανάληψη των αναλώσιμων |
| 7 | **VIP / exclusivity** | early access, κλειστά drops | reciprocity + belonging |
| 8 | **Community** | clubs, events, ride reports | tribe — δυνατό στο moto |

**Θεωρία:** το loyalty δεν είναι «έκπτωση», είναι **switching cost + ταυτότητα**. Ο
πελάτης μένει γιατί (α) θα χάσει συσσωρευμένη αξία αν φύγει, (β) ανήκει σε κάτι.

---

## Μέρος Γ — Η υποδομή από κάτω

- **Loyalty engine:** `loyalty_accounts` + `points_ledger` (Supabase). Earn στο order
  completion, **redeem ως coupon** (→ [[01-foundations]] coupons). Account UI με υπόλοιπο/ιστορικό.
- **Tiers:** κανόνες (τζίρος/πόντοι 12μήνου) → tier → προνόμια.
- **Segmentation / RFM:** SQL/materialized views πάνω σε `orders` + **~28k legacy `erp_customers`**
  → segments (Recency/Frequency/Monetary, brand affinity) → τροφοδοτούν lifecycle/campaigns.
- **Referral:** referral codes per-user (πάνω στα coupons) + attribution + διπλό reward.
- **GDPR:** χρήση των 28k legacy customers για marketing **μόνο με legal basis/consent**.

---

## Μέρος Δ — Το AI επίπεδο

- **Churn prediction:** ποιοι κινδυνεύουν να φύγουν → proactive win-back.
- **Next-best-product / personalized rewards:** «αγόρασε γάντια → διπλοί πόντοι» στοχευμένα.
- **AI segmentation:** auto-ομαδοποίηση πέρα από RFM (συμπεριφορικά clusters).
- **Replenishment timing:** AI εκτιμά τον κύκλο κάθε αναλώσιμου ανά πελάτη.
- Δένει με owner insights ([[08-ai-layer]]).

---

## Μέρος Ε — KPIs

| Metric | Τι δείχνει |
|---|---|
| **Repeat purchase rate** | το #1 retention signal |
| **LTV** | η συνολική αξία πελάτη |
| Churn rate | πόσοι χάνονται |
| Loyalty enrollment & active rate | υιοθέτηση προγράμματος |
| Redemption rate | αξία των πόντων |
| Referral conversion | απόδοση του «φέρε φίλο» |
| RFM distribution | υγεία της βάσης πελατών |

---

## Μέρος ΣΤ — Παγίδες

- **Loyalty που κοστίζει πιο πολύ απ' όσο φέρνει** → μέτρα incremental, όχι μόνο engagement.
- **Πολυπλοκότητα** → αν δεν καταλαβαίνει πώς κερδίζει πόντους, δεν συμμετέχει.
- **Discount addiction** → αν μάθουν να περιμένουν έκπτωση, χαλάς τα περιθώρια.
- **GDPR στα legacy 28k** → μην στείλεις marketing χωρίς νόμιμη βάση.
- **Vanity tiers** → τα προνόμια πρέπει να είναι πραγματικά επιθυμητά.

---

## Μέρος Ζ — Για το Motomarket: το πλάνο

**Τα δεδομένα σου:** φυσικά υψηλή επανάληψη (αναλώσιμα), ~28k legacy customers, 40 χρόνια
σχέσης, φυσικά καταστήματα (omni-channel ευκαιρία: πόντοι online + κατάστημα).

**Σειρά υλοποίησης:**
1. **Coupons** (foundation) — η βάση για κάθε redemption.
2. **Email lifecycle: replenishment + win-back** (→ [[02-email-messaging]]) — το πιο
   φυσικό retention για consumables, πριν καν το loyalty.
3. **Segmentation / RFM** — αξιοποίησε orders + (με consent) τα 28k legacy.
4. **Loyalty points + tiers** — switching cost.
5. **Referral** — φθηνό acquisition.
6. **VIP/community** — racing DNA, events, drops.

**⚠️ Προσοχή:** legacy customers → consent· loyalty redemption → coupons πρώτα.

**Φάσεις:** (Φ1) replenishment + win-back · (Φ2) segmentation · (Φ3) loyalty + tiers ·
(Φ4) referral + VIP/community.

---

## Ανοιχτά ερωτήματα / αποφάσεις
- **Loyalty:** earn rate; λήξη πόντων; tiers από την αρχή ή flat;
- **Omni-channel:** πόντοι & στο φυσικό κατάστημα; (θέλει Odoo/POS σύνδεση)
- **Legacy 28k:** υπάρχει marketing consent; (νομικό gate για win-back)
- **Referral reward:** € / πόντοι / δωρεάν μεταφορικά;
