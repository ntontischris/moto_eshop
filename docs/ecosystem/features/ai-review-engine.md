# Feature deep-dive — AI Review Engine

> Domains: [Reviews & social proof](../README.md) + [AI layer](../README.md) · Status: 🔵 ιδέα · Impact High / Effort Med
> Εξάρτηση: Claude API · Google Business Profile API access · coupons (foundations) · post-purchase email ([[02-email-messaging]])

**Δύο πράγματα μαζί:** (Α) έξυπνες, προσωπικές απαντήσεις στις κριτικές, και
(Β) μετατροπή των ανθρώπων που έχουν ήδη αφήσει κριτική σε πελάτες του eshop.

## Η παρατήρηση (24/05/2026)
- Το κατάστημα έχει **~3.172 κριτικές στο Google (4.9★)** + 75 στο Skroutz —
  τεράστιο asset.
- ΟΜΩΣ οι απαντήσεις είναι όλες **ίδιες/canned** («ευχαριστούμε πολύ, καλά
  χιλιόμετρα»). Χάνεται η ευκαιρία για σχέση + SEO + conversion.
- Οι **3.172 reviewers είναι ουσιαστικά warm leads** — μας ξέρουν, μας
  εμπιστεύονται, αλλά οι περισσότεροι ίσως δεν έχουν αγοράσει ποτέ online.

## Όραμα
Κάθε κριτική (νέα ή υπάρχουσα) → την **διαβάζει AI**, απαντάει **προσωπικά &
διαφορετικά**, και όπου ταιριάζει **προσκαλεί τον reviewer στο eshop με κίνητρο
(−10%)**. Έτσι η ουρά κριτικών γίνεται κανάλι retention + acquisition, αυτόματα.

---

## Μέρος Α — AI auto-response στις κριτικές

**Τι κάνει:** με το που έρχεται κριτική, το AI διαβάζει βαθμολογία + κείμενο +
προϊόν (+ context παραγγελίας αν υπάρχει) και γράφει **μοναδική** απάντηση στα
Ελληνικά, στο brand voice μας — αναφέρεται σε ό,τι είπε ο πελάτης, όχι template.

**Πώς (flow με Claude API):**
1. Trigger: νέα κριτική (webhook/poll) ή batch για τις υπάρχουσες.
2. Prompt: `{rating, body, product, lang, brandVoice, (orderContext?)}`
   → Claude → draft απάντησης (με variety, χωρίς ψεύτικες υποσχέσεις).
3. **Guardrail routing:**
   - 4–5★ → auto-post (ή 1-click approve) + προαιρετικά κίνητρο (Μέρος Β).
   - 1–3★ → ΠΟΤΕ auto. Empathetic draft + **escalation σε άνθρωπο** + flag για
     follow-up (πρόβλημα προϊόντος/αποστολής → ticket).
4. Όλα περνούν από ένα admin «approve/edit» μέχρι να εμπιστευτούμε το auto.

**Πού απαντάει (integrations):**
- **On-site reviews** (πίνακας `reviews`, τώρα άδειος) → πλήρης έλεγχος, εύκολο
  πρώτο βήμα όταν αρχίσει να γεμίζει.
- **Google** → Google Business Profile API (ο owner συνδέει το GBP· επιτρέπει
  read reviews + post replies). Εδώ είναι το μεγάλο asset (3.172).
- **Skroutz** → merchant tools (API περιορισμένο· ίσως semi-manual στην αρχή).

**Brand voice config:** ένα μικρό αρχείο/πίνακας με tone, υπογραφή, do/don'ts,
απαγορευμένες φράσεις — ώστε οι απαντήσεις να είναι συνεπείς αλλά όχι ρομποτικές.
(Κοινό με assistant/support copilot — δες κοινή υποδομή στο [AI layer](../04-ai-layer.md).)

---

## Μέρος Β — Reviewers → πελάτες (−10%)

**Στόχος:** οι 3.172 reviewers να γίνουν online πελάτες.

**Ο περιορισμός (σημαντικό, GDPR):** ΔΕΝ μπορούμε να πάρουμε τα emails των Google
reviewers — η Google δεν τα δίνει και το scraping/unsolicited email είναι
παράνομο. Άρα ξεχνάμε το «εξάγω λίστα και στέλνω email».

**Ο σωστός & νόμιμος τρόπος:**
1. **Δημόσια AI απάντηση με προσωπικό ευχαριστώ + μοναδικό κωδικό/link** στο
   eshop: π.χ. *«Ευχαριστούμε [όνομα]! Δες το eshop μας με −10%: MM-THANKS-7F3K
   → motomarket-shop.gr»*. Ο reviewer παίρνει notification → κλικ → traffic.
   Νόμιμο (δημόσια απάντηση, όχι spam), και **μετρήσιμο** (redemptions).
2. **Μοναδικοί one-time κωδικοί** ανά κριτική → tracking ποιοι εξαργυρώνουν →
   μετράμε reviewer→customer conversion.
3. **Forward-looking capture** (με συναίνεση): QR στο φυσικό κατάστημα / στην
   απόδειξη «άσε κριτική & πάρε −10%» → μαζεύει κριτικές ΚΑΙ opt-in emails για
   το μέλλον (νόμιμο CRM).
4. ❌ Όχι matching των reviewers με τους ~28k legacy `erp_customers` by name για
   outreach — αναξιόπιστο + GDPR ρίσκο.

---

## Πώς κουμπώνει με το μελλοντικό AI management
Όταν μπει AI πάνω στη διαχείριση του eshop (Odoo), το Review Engine είναι ένα
από τα πρώτα «agents»: παρακολουθεί κριτικές → απαντά/escalάρει → ταΐζει
insights (συχνά παράπονα, top προϊόντα, sentiment) στο dashboard.
Δες domains: AI ops agents (09 · Ops/Odoo) & Owner insights (08 · AI layer).

## Architecture sketch
```
[Google GBP API / Skroutz / on-site reviews]
        │  (webhook ή cron poll)
        ▼
  review-ingest  →  reviews store (Supabase)
        │
        ▼
  AI responder (Claude API)  ──►  draft + sentiment + route
        │                              │
   4–5★ auto/approve              1–3★ → human queue + ticket
        │
        ▼
  post reply (+ unique −10% code)  ──►  redemption tracking
```

## Δεδομένα & integrations που χρειάζονται
- Google Business Profile API access (σύνδεση του owner λογαριασμού).
- Πεδία στο `reviews`: `ai_reply_draft`, `reply_status`, `sentiment`,
  `discount_code`, `responded_at`.
- Discount-code generator + redemption tracking (δένει με checkout — coupons,
  domain 01 · Foundations).
- Brand-voice config.
- Claude API key + prompt-caching (φτηνότερο σε όγκο).

## GDPR / ethics (μη παραβλέψιμα)
- Μόνο **δημόσιες** απαντήσεις· κανένα unsolicited email.
- Email capture **μόνο με opt-in**.
- Καμία ψεύτικη υπόσχεση/στοιχείο. Νούμερα κριτικών → στρογγυλοποίηση **προς τα
  κάτω** (ίδια αρχή με το social-proof band).
- 1–3★ πάντα με ανθρώπινο μάτι πριν τη δημοσίευση.

## Φάσεις
1. **MVP:** AI responder στις **on-site** κριτικές + admin approve. (Χαμηλό
   ρίσκο, μαθαίνουμε το brand voice.)
2. **Google:** σύνδεση GBP API → batch προσωπικές απαντήσεις στις υπάρχουσες
   3.172 (4-5★) με −10% κωδικό → πρώτο acquisition κύμα.
3. **Tracking + auto:** redemption analytics· σταδιακά auto-post για 5★.
4. **In-store capture loop** (QR/απόδειξη) για opt-in CRM.

## Ανοιχτά ερωτήματα / αποφάσεις
- Έχει ο owner πρόσβαση/δικαιώματα στο Google Business Profile για API;
- Κίνητρο: −10% σε όλους, ή μόνο σε 5★, ή κλιμακωτό; Λήξη/όρος κωδικού;
- Auto-post από την αρχή ή πάντα human-approve στο ξεκίνημα;
- Skroutz: υπάρχει merchant API για replies ή μόνο χειροκίνητα;
