# Domain 06 — Acquisition, Ads & Feeds

> **Κεφάλαιο του βιβλίου · στόχος: πλήρης γνώση του χώρου πριν χτίσεις.**
> Status: ✅ χαρτογραφημένο | Stack: Next.js route handlers (feeds) · GA4/Plausible + pixels (tracking) · Payload (SEO content) · Claude API (feed/SEO)
> Cross-refs: [[10-analytics-measurement]] (tracking/attribution) · [[01-foundations]] (SEO essentials) · [[03-reviews-social-proof]] (rich snippets) · [[09-ops-odoo]] (prices/stock για feeds)

Acquisition = **πώς έρχεται κόσμος** — και με τι κόστος. Στην Ελλάδα το παιχνίδι έχει
μια ιδιαιτερότητα που αλλάζει τα πάντα: το **Skroutz** κυριαρχεί στο comparison shopping.
Αυτό το κεφάλαιο χαρτογραφεί όλα τα κανάλια, την υποδομή που τα τροφοδοτεί (feeds +
tracking), και τη θεμελιώδη εξίσωση CAC vs LTV.

---

## Μέρος Α — Η οικονομία / γιατί αξίζει

**Η θεμελιώδης εξίσωση: CAC vs LTV.**
- **CAC** (Customer Acquisition Cost) = πόσο σου κοστίζει να αποκτήσεις έναν πελάτη.
- **LTV** (Lifetime Value) = πόσο σου αφήνει συνολικά στη «ζωή» του.
- **Κανόνας:** μπορείς να ξοδέψεις για acquisition μέχρι το `LTV × margin`. Υγιής στόχος
  **LTV:CAC ≥ 3:1**. Κάτω από 1:1 → χάνεις λεφτά σε κάθε πελάτη.

| Έννοια | Τι σημαίνει |
|---|---|
| **Paid = ενοικιαζόμενο κοινό** | σταματάς να πληρώνεις → σταματά το traffic |
| **Organic/owned = δικό σου** | compounds με τον χρόνο (SEO, brand, email list) |
| **ROAS** | Return On Ad Spend — τζίρος ανά € διαφήμισης |

**Η μεγάλη σύνδεση με το retention:** το **πρώτο** purchase είναι ακριβό (CAC). Το
οικοσύστημα (email/reviews/loyalty) κάνει το **δεύτερο φθηνό** → ανεβάζει το LTV → σου
επιτρέπει να ξοδέψεις περισσότερο σε acquisition από τον ανταγωνιστή. **Acquisition &
retention είναι οι δύο όψεις του ίδιου νομίσματος.**

---

## Μέρος Β — Ο πλήρης χάρτης: τα κανάλια acquisition

| Κανάλι | Τύπος | Πού στο funnel | ΕΛ σημείωση |
|---|---|---|---|
| **Organic search (SEO)** | owned/free | consideration→conversion | compounding· αργό· δωρεάν |
| **Comparison — Skroutz** | feed/paid-CPC | **bottom (ready to buy)** | **το #1 ΕΛ κανάλι· σχεδόν υποχρεωτικό** |
| Comparison — BestPrice/Shopflix | feed | bottom | δευτερεύοντα ΕΛ |
| **Google Shopping / Performance Max** | paid (feed) | bottom | το #1 paid για eshop |
| Google Search ads | paid (keyword) | mid→bottom | brand + generic terms |
| Google Display & remarketing | paid | awareness + recovery | retarget cart abandoners |
| **Meta ads (FB/Instagram)** | paid (catalog) | awareness→consideration | δυνατό για lifestyle/moto |
| Organic social | owned | awareness | community, racing DNA |
| Affiliate / influencer | performance | awareness→conversion | moto clubs/ambassadors |
| Referral | owned | conversion | → [[05-loyalty-retention]] |
| Direct / brand | owned | παντού | **40 χρόνια + φυσικά καταστήματα = brand search** |

**Η θεωρία της ισορροπίας:** μην βασίζεσαι σε ΕΝΑ κανάλι (π.χ. μόνο Skroutz = ρίσκο
εξάρτησης — αν αλλάξει όρους/τιμές, πονάς). Χτίσε **mix**: paid για άμεσο, organic+brand
για βιωσιμότητα, comparison για high-intent.

---

## Μέρος Γ — Η υποδομή από κάτω (το plumbing — αυτό χτίζεις)

Δύο πράγματα τροφοδοτούν σχεδόν όλα τα paid/comparison κανάλια:

### 1. Product feed — η «εξαγωγή» του καταλόγου
- **Τι:** δομημένο XML/feed που στέλνει τα προϊόντα σε κάθε πλατφόρμα.
- **Headless:** Next.js route handlers — `/feeds/skroutz.xml`, `/feeds/google.xml`,
  `/feeds/meta.xml`. Κάθε πλατφόρμα έχει **δικό της schema**.
- **Τι πρέπει να είναι σωστό:** τίτλος, **τιμή με ΦΠΑ**, **availability**, κατηγορία
  (mapping στη δική τους taxonomy), **GTIN/MPN/barcode**, εικόνες, μεταφορικά.
- **⚠️ Κρίσιμο:** λάθος τιμή/απόθεμα → **disapproval / suspension** του feed → χάνεις το
  κανάλι. Γι' αυτό το feed θέλει σωστά δεδομένα → μερικώς ⛔ μέχρι το inventory sync.

### 2. Conversion tracking — η «μέτρηση»
- **Τι:** events (view_item, add_to_cart, begin_checkout, **purchase**) → GA4, Google Ads,
  **Meta Pixel + CAPI** (server-side, πιο ακριβές, cookie-proof).
- **Headless:** standardized event layer (→ [[10-analytics-measurement]]).
- **Γιατί:** χωρίς αυτό **καις budget στα τυφλά** — δεν ξέρεις τι αποδίδει.

### 3. Attribution & UTM
- Ποιο κανάλι παίρνει τα εύσημα (last-click vs data-driven). UTM tags σε κάθε campaign link.
- Χωρίς attribution, δεν ξέρεις πού να βάλεις το επόμενο €.

---

## Μέρος Δ — Το AI επίπεδο

- **AI category mapping:** ο κατάλογος 20k → taxonomy Google/Skroutz **αυτόματα**
  (τεράστια χειρωνακτική δουλειά που το AI λύνει).
- **AI feed optimization:** τίτλοι feed βελτιστοποιημένοι για search match («Κράνος Shoei
  NXR2 Full Face ECE 22.06» αντί «NXR2»).
- **AI SEO content engine:** buying guides σε κλίμακα (drafts → human edit) → organic traffic.
- **AI ad copy / creative** (αργότερα): παραλλαγές αγγελιών.
- **AI budget allocation** (αργότερα): ανακατανομή προς τα κανάλια που αποδίδουν.

---

## Μέρος Ε — KPIs

| Metric | Τι δείχνει |
|---|---|
| **CAC** | κόστος ανά νέο πελάτη (ανά κανάλι + blended) |
| **LTV:CAC** | η υγεία του μοντέλου (στόχος ≥3:1) |
| **ROAS** | τζίρος ανά € ad spend (ανά καμπάνια) |
| CTR | ελκυστικότητα αγγελίας/listing |
| Conversion rate ανά κανάλι | ποιότητα του traffic |
| Channel mix | ρίσκο εξάρτησης |
| Feed health (disapprovals) | υγεία της υποδομής |

**Ο κανόνας:** βελτιστοποίησε για **profit (LTV:CAC)**, όχι για όγκο traffic ή φθηνά κλικ.

---

## Μέρος ΣΤ — Παγίδες

- **Paid πριν το tracking →** καις budget στα τυφλά. **Πρώτα μέτρηση, μετά δαπάνη.**
- **Feed disapprovals →** λάθος availability/τιμή → suspension → χαμένο κανάλι.
- **Αγνόηση CAC:LTV →** αγοράζεις ασύμφορο traffic, «μεγαλώνεις» χάνοντας λεφτά.
- **Εξάρτηση από ένα κανάλι** (π.χ. μόνο Skroutz) → ρίσκο αν αλλάξει όρους.
- **Traffic σε site που δεν κάνει convert →** πρώτα φτιάξε conversion, μετά ρίξε traffic.
- **Omnibus / κανόνες τιμών** στα comparison engines (προηγούμενη χαμηλότερη τιμή).

---

## Μέρος Ζ — Για το Motomarket: το πλάνο

**Τα δεδομένα σου:** 20k κατάλογος, 40 χρόνια brand, φυσικά καταστήματα, 3.172★ — δυνατό
**brand + organic** θεμέλιο. Single developer → **μην** τρέξεις 6 κανάλια ταυτόχρονα.

**Σειρά λογικής (plumbing → κανάλια):**
1. **Conversion tracking** (events) — η προϋπόθεση για κάθε paid (→ [[10-analytics-measurement]]).
2. **Skroutz feed** — το #1 μονό lever στην ΕΛ αγορά.
3. **Google Merchant feed** → δωρεάν Shopping listings, μετά **Shopping/PMax** (paid).
4. **SEO content engine** (AI-assisted buying guides) — compounding, φθηνό μακροπρόθεσμα.
5. **Remarketing** (retarget cart abandoners) + **Meta catalog**.
6. Affiliate/influencer (moto community) + αξιολόγηση **Skroutz Marketplace**.

**⛔ Blocked / προσοχή:** τα feeds θέλουν **σωστές τιμές & απόθεμα** → ώσπου να μπει
inventory sync ([[09-ops-odoo]]), availability προσωρινά «κατόπιν παραγγελίας» ή με προσοχή.

**Φάσεις:** (Φ1) tracking + Skroutz + Google feed (organic) · (Φ2) Google Shopping/PMax
+ remarketing · (Φ3) SEO content engine + Meta · (Φ4) affiliate + Skroutz Marketplace.

---

## Ανοιχτά ερωτήματα / αποφάσεις
- **Skroutz:** μόνο feed (σύγκριση) ή **Marketplace** (πώληση μέσα στο Skroutz);
- **Ποιος τρέχει τις καμπάνιες** — εσύ ή agency; (το «run» κομμάτι, όχι κώδικας)
- **Budget** & αρχικός στόχος ROAS;
- **GTIN/barcodes** στον κατάλογο; (τα feeds τα θέλουν — αν λείπουν, πρόβλημα)
- **Merchant accounts** (Google Merchant Center, Skroutz Merchant) — υπάρχουν;
