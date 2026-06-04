# MotoMarket — ROADMAP

> Delivery sequence for the MotoMarket storefront. Each release is a demoable milestone; each slice (`S-X.Y`) is a shippable PR that touches DB → API → UI → test → telemetry. The vertical-slicing philosophy means every merged slice changes something visible end-to-end for the user — no «invisible plumbing» builds.

Single source for delivery sequence (ADR 0003). Status lives in STATUS.md. A PDF export is kept beside the contract.

---

## Risk Register

Drives slice ordering. High-risk items are scheduled early.

| # | Risk | Mitigation slice |
|---|---|---|
| R1 | Entersoft API δεν δουλεύει όπως υποθέτεις (PQ contracts, throttling, NULL fields, OAuth) | S-1.6 πρώτο — test με real credentials πριν χτιστεί οτιδήποτε άλλο πάνω του |
| R2 | Viva webhook signatures fail σε production (Greek tax law + retry semantics) | S-2.2 χτίζεται ΜΑΖΙ με S-2.1 |
| R3 | OAuth providers απαιτούν app review — Apple/Facebook 2-3 εβδομάδες lead time | S-0.4 ξεκινά review submission μέρα 1 |
| R4 | Catalog i18n translation κόστος token σε re-runs | Cache aggressively στη βάση |
| R5 | AR pipeline για 11k SKUs αδύνατο — σύμβαση λέει 20-30 premium SKUs | S-5.1 πιλοτικά πρώτα, scope cap |
| R6 | Odoo vs Entersoft confusion — σύμβαση λέει Entersoft | S-0.1 γραπτή απόφαση πριν οτιδήποτε άλλο |
| R7 | Πελάτης δεν στέλνει assets/credentials εγκαίρως | Weekly «blockers list» email |

---

## R0 — Foundation & Decisions

| Slice | Outcome |
|---|---|
| S-0.1 | ERP provider decision documented: Phase 1-4 = Entersoft; Odoo post-contract |
| S-0.2 | Vercel cron infrastructure με CRON_SECRET Bearer guard |
| S-0.3 | Resend account + DKIM — emails από noreply@motomarket-shop.gr περνάνε SPF/DKIM/DMARC |
| S-0.4 | Viva merchant account + Google/Facebook/Apple OAuth credentials ready |
| S-0.5 | Sentry error tracking — production errors εμφανίζονται σε <5 λεπτά |
| S-0.6 | PostHog install + first pageview event + GDPR consent gate |

---

## R1 — Identity & Live Catalog

| Slice | Outcome |
|---|---|
| S-1.1 | Email verification flow — νέος χρήστης λαμβάνει επιβεβαίωση |
| S-1.2 | Password reset flow — χρήστης κάνει reset μόνος |
| S-1.3 | OAuth Google — login σε 2 clicks |
| S-1.4 | OAuth Facebook — login, απαιτεί app review approval |
| S-1.5 | OAuth Apple — Sign in with Apple compliance |
| S-1.6 | Entersoft Products sync nightly — νέα προϊόντα εμφανίζονται εντός 24h |
| S-1.7 | Entersoft Prices sync nightly — τιμές ενημερώνονται εντός 24h |
| S-1.8 | Entersoft Stock sync ανά 15 λεπτά — stock real-time-ish |
| S-1.9 | Entersoft Customers reactivation — παλιός customer reactivates λογαριασμό |
| S-1.10 | ERP Failsafe — site λειτουργεί χωρίς crash αν πέσει Entersoft |

---

## R2 — Real Commerce (ξεκλειδώνει €4.800)

| Slice | Outcome |
|---|---|
| S-2.1 | Viva Smart Checkout — χρήστης πληρώνει με κάρτα |
| S-2.2 | Viva webhook + state transition — παραγγελία γίνεται `paid` |
| S-2.3 | IRIS payment method — νομικά υποχρεωτικό GR από 1/12/2025 |
| S-2.4 | Apple Pay — one-tap σε Safari iOS |
| S-2.5 | Google Pay — one-tap σε Chrome Android |
| S-2.6 | Klarna δόσεις 0% — επιλογή 3 δόσεων στο checkout |
| S-2.7 | Stock reservation — stock δεσμεύεται για 30 λεπτά στο add-to-cart |
| S-2.8 | Size variants με stock per size — PDP δείχνει διαθεσιμότητα ανά μέγεθος |
| S-2.9 | Reviews — verified buyer γράφει review, εμφανίζεται στο PDP |
| S-2.10 | Reviews admin moderation — admin εγκρίνει/απορρίπτει reviews |
| S-2.11 | Wishlist server-persisted — wishlist συγχρονισμένο σε όλες τις συσκευές |
| S-2.12 | Schema.org markup — Google rich snippets για reviews/τιμή/διαθεσιμότητα |
| S-2.13 | Catalog data i18n — τίτλοι/περιγραφές προϊόντων σε EN/BG/SR/RO/AL |
| S-2.14 | Multi-currency display — locale BG → τιμές σε BGN |
| S-2.15 | Skroutz feed — `/feed/skroutz.xml` με 0 errors στο validator |
| S-2.16 | GDPR cookie consent banner — tracking off πριν consent |

---

## R3 — Intelligence (ξεκλειδώνει €3.200)

| Slice | Outcome |
|---|---|
| S-3.1 | AI Chat foundation — streaming reply από GPT |
| S-3.2 | AI Chat tools (4) — αποτελέσματα από catalog σε real-time |
| S-3.3 | AI Chat thread persistence + RLS — ιστορικό conversations ανά user |
| S-3.4 | AI Chat rate limiting — protection από abuse/κόστος |
| S-3.5 | AI Chat multilingual auto-detect — απαντά στη γλώσσα του user |
| S-3.6 | AI Chat human handoff — email στο sales@ με thread transcript |
| S-3.7 | AI Chat UI launcher + panel — floating button → side panel / fullscreen mobile |
| S-3.8 | Product embeddings + pgvector — semantic embeddings για όλα τα προϊόντα |
| S-3.9 | «Frequently bought together» στο PDP — 3 σχετικά προϊόντα |
| S-3.10 | Email: Welcome — νέα εγγραφή |
| S-3.11 | Email: Order confirmation — παραγγελία |
| S-3.12 | Email: Shipping notification — αποστολή |
| S-3.13 | Email: Review request — 7 μέρες μετά delivery |
| S-3.14 | Email: Abandoned cart — cart σε 24h χωρίς conversion |
| S-3.15 | Email: Price drop alert — τιμή κάτω από wishlist τιμή |
| S-3.16 | Email: Back in stock — subscribed user, stock > 0 |
| S-3.17 | Email: Birthday discount — γενέθλια user |
| S-3.18 | Email: Win-back — χωρίς αγορά 90 ημέρες |
| S-3.19 | AI price negotiation — chat tool που εκδίδει single-use coupon |
| S-3.20 | Analytics checkout funnel — dashboard με conversion rate ανά βήμα |

---

## R4 — Retention

| Slice | Outcome |
|---|---|
| S-4.1 | Garage — user καταχωρεί τη μηχανή του |
| S-4.2 | Product fitment tagging — προϊόντα ξέρουν συμβατές μηχανές |
| S-4.3 | PLP filter «Ταιριάζει στη μηχανή μου» — ένα click filter για logged-in |
| S-4.4 | PDP «Compatible badge» — πράσινο badge αν ταιριάζει στη μηχανή |
| S-4.5 | Referral — unique invite code ανά user |
| S-4.6 | Referral reward — νέος user + referrer παίρνουν €10 credit |
| S-4.7 | Loyalty points — 1 point ανά €1 αγορά |
| S-4.8 | Loyalty redeem — points εξαργυρώνονται στο checkout |
| S-4.9 | AI Size Quiz — quiz → recommended size + email capture |
| S-4.10 | Rider Quiz — quiz → curated product bundle / landing page |
| S-4.11 | PDF guide download email-gated — lead magnet με email required |

---

## R5 — Polish & Launch (Phase 4, ξεκλειδώνει €3.200)

| Slice | Outcome |
|---|---|
| S-5.1 | AR view pilot — 1 SKU, iOS Safari → 3D μοντέλο σε δωμάτιο |
| S-5.2 | AR rollout — 20-30 premium SKUs με AR button live |
| S-5.3 | 360° + video στο PDP — premium products με 360 viewer + HLS video |
| S-5.4 | Voice search — mic button → speech to search |
| S-5.5 | Competitor price monitoring — daily alert αν είμαστε >X% πάνω |
| S-5.6 | PWA — manifest + offline fallback, Lighthouse PWA ≥90 |
| S-5.7 | Security audit — 0 highs/criticals, audit report PDF |
| S-5.8 | Performance audit — mobile Lighthouse ≥90, LCP <2.5s |
| S-5.9 | Monitoring + on-call — Sentry + UptimeRobot + runbook |
| S-5.10 | Go-live runbook + DNS cutover — domain live, first real order processed |

---

## R6 — Bonus: AI SEO Product Upload App

Ξεχωριστή Next.js εφαρμογή, δικό της repo.

| Slice | Outcome |
|---|---|
| S-6.1 | App scaffold + admin-only auth |
| S-6.2 | CSV/Excel upload + parse + preview table |
| S-6.3 | AI bulk SEO generation — title/description/meta/alt text ανά row |
| S-6.4 | Multilingual output — 6 locales ανά field |
| S-6.5 | Export CSV ή direct Entersoft push |
