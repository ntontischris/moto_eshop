# Domain 10 — Analytics & Measurement

> **Κεφάλαιο του βιβλίου · η μέτρηση που κάνει όλα τα υπόλοιπα βελτιστοποιήσιμα.**
> Status: ✅ χαρτογραφημένο | Stack: GA4 ή Plausible · CMP (consent) · server-side events · Supabase · Claude (insights)
> Cross-refs: προϋπόθεση για [[06-acquisition-ads-feeds]] · τροφοδοτεί [[03-reviews-social-proof]], [[04-search-discovery]], [[05-loyalty-retention]] · «ρώτα το eshop σου» → [[08-ai-layer]]

«Δεν βελτιστοποιείς αυτό που δεν μετράς.» Αυτό το κεφάλαιο είναι η **ραχοκοκαλιά
μέτρησης**: τι events, ποια KPIs, attribution, και πώς όλα γίνονται **νόμιμα** (GDPR
consent). Είναι η προϋπόθεση για κάθε paid κανάλι και κάθε data-driven απόφαση.

---

## Μέρος Α — Η οικονομία / γιατί αξίζει

- **Καις budget στα τυφλά** χωρίς tracking — δεν ξέρεις τι αποδίδει (→ [[06-acquisition-ads-feeds]]).
- **Κάθε απόφαση γίνεται γνώμη** χωρίς δεδομένα — με δεδομένα γίνεται στρατηγική.
- **Compounding:** όσο νωρίτερα μετράς, τόσο περισσότερο ιστορικό έχεις για να μάθεις.

**Η θεωρία:** μέτρα **το funnel, όχι vanity metrics**. Pageviews δεν πληρώνουν — conversion,
AOV, LTV, CAC το κάνουν. Κάθε domain έχει το KPI του· εδώ είναι η ενιαία εικόνα.

---

## Μέρος Β — Ο πλήρης χάρτης

### Τα core e-commerce events (το «αλφάβητο»)
`view_item` → `add_to_cart` → `begin_checkout` → `add_payment_info` → **`purchase`**
(+ `search`, `view_item_list`, `select_item`, `sign_up`, `view_cart`). Αυτά τροφοδοτούν
GA4, Google Ads, Meta — η κοινή γλώσσα μέτρησης & ad optimization.

### Τα επίπεδα μέτρησης
| Επίπεδο | Τι | Εργαλείο |
|---|---|---|
| **Web analytics** | funnels, πηγές, συμπεριφορά | GA4 ή Plausible |
| **Ad/conversion tracking** | ROAS ανά καμπάνια | GA4 + pixels + server-side |
| **Attribution** | ποιο κανάλι παίρνει εύσημα | last-click vs data-driven, UTM |
| **Product analytics** | search/no-results, rec CTR | Supabase events |
| **Business/BI** | LTV, CAC, RFM, margin | Supabase + dashboards |

### KPIs ανά domain (η ενιαία εικόνα)
- **Acquisition:** CAC, ROAS, channel mix · **Conversion:** rate, AOV, checkout abandonment
- **Retention:** repeat rate, LTV, churn · **Discovery:** search conversion, no-results
- **Reviews:** coverage, response rate · **Email:** revenue per email, flow performance

---

## Μέρος Γ — Η υποδομή: tracking + consent

- **Standardized event layer** στο storefront (μία φορά, τροφοδοτεί όλα τα εργαλεία).
- **Server-side tracking** (Meta CAPI / GA4 Measurement Protocol) — πιο ακριβές, cookie/adblock-proof.
- **GA4 vs Plausible:** GA4 = δωρεάν, ισχυρό, βαρύ, GDPR-σύνθετο · Plausible = privacy-first,
  απλό, ελαφρύ, χωρίς cookie banner. (Μπορούν & μαζί.)
- **Consent / GDPR (μη διαπραγματεύσιμο):** **CMP** (cookie banner) + **Google Consent Mode v2**
  — χωρίς συναίνεση, no marketing cookies. Επηρεάζει & τα ad pixels.
- **Data warehouse (μελλοντικά):** Supabase/BigQuery για BI πάνω σε orders + events + erp_customers.

---

## Μέρος Δ — Το AI επίπεδο

- **Owner insights — «ρώτα το eshop σου»:** φυσική γλώσσα → read-only queries → απάντηση +
  γραφήματα ([[08-ai-layer]]). Το «AI analyst».
- **Anomaly detection:** proactive alerts («οι επιστροφές στα γάντια X τριπλασιάστηκαν»).
- **Predictive:** churn, demand forecasting, LTV prediction.
- **Auto-insights:** εβδομαδιαία σύνοψη «τι άλλαξε & γιατί».

---

## Μέρος Ε — KPIs (τα meta-KPIs)
Tracking coverage (% events σωστά), consent rate, data freshness, attribution accuracy,
dashboard adoption (τα κοιτάς;).

## Μέρος ΣΤ — Παγίδες

- **Vanity metrics** (pageviews/likes) → μέτρα funnel & profit.
- **Tracking χωρίς consent** → πρόστιμα GDPR + λάθος data.
- **Over-tracking** → θόρυβος· μέτρα ό,τι οδηγεί απόφαση.
- **Analysis paralysis** → λίγα KPIs που δρας πάνω τους > 100 dashboards.
- **Client-only tracking** → χάνεις 20-40% λόγω adblock/cookies· βάλε server-side.
- **Καθυστέρηση** → κάθε μέρα χωρίς tracking = χαμένο ιστορικό.

## Μέρος Ζ — Για το Motomarket: το πλάνο

**Πού είσαι:** δεν υπάρχει formal analytics/consent ακόμα — **προϋπόθεση** για paid κανάλια.

**Σειρά υλοποίησης:**
1. **CMP + Consent Mode** — νομική βάση πρώτα.
2. **Event layer** (view→cart→checkout→purchase + search) → GA4/Plausible.
3. **Server-side conversion tracking** (Meta CAPI / GA4 MP) — ξεκλειδώνει σωστό paid.
4. **Product analytics** (search/no-results, rec CTR) → βελτιώνει discovery.
5. **Owner insights** («ρώτα το eshop σου») — read-only AI πάνω στα δεδομένα.
6. **BI/warehouse** (LTV/CAC/RFM dashboards) — όταν υπάρχει όγκος.

**Φάσεις:** (Φ1) consent + event layer · (Φ2) server-side + ad tracking · (Φ3) product
analytics + owner insights · (Φ4) BI/predictive.

## Ανοιχτά ερωτήματα / αποφάσεις
- **GA4 vs Plausible** (ή και τα δύο); privacy vs δυνατότητες;
- **CMP provider** (Cookiebot/Usercentrics/δικό μας);
- **Server-side:** από την αρχή ή Φ2;
- **Ποια KPIs** είναι τα «North Star» για σένα; (π.χ. repeat rate + LTV:CAC)
