# MotoMarket — Πλάνο Εκτέλεσης (Grill Output)

> **Προέλευση:** grill session 2026-06-20 πάνω στο `PROJECT_STATUS_GRILL.md`, με διασταύρωση στη **Σύμβαση** (Άρθρο 6) και στον **πραγματικό κώδικα** (`moto_eshop`, main `02f1601`).
> **Σκοπός:** ένα σημείο που λέει *τι μένει, με ποια σειρά, και τι περιμένει τρίτους* — ώστε κάθε γραμμή να γίνεται grill → PRD → to-issues → dev.
> **Rationale «γιατί»:** ζει στα ADRs του repo (links παρακάτω) — εδώ μόνο το «τι/σειρά». Ένα fact, ένα σπίτι (ADR 0003).

---

## 0. Το βασικό reframe του grill

Το grill **διέλυσε το «blocked» surface.** Πριν, το status doc έδειχνε payments/ERP/AI ως μπλοκαρισμένα στον πελάτη. Μετά τις αποφάσεις:

- **Payments → build-now.** Stripe test key (χωρίς KYC) καλύπτει όλα τα συμβατικά rails. Viva **demo** account χτίζει IRIS + φθηνές κάρτες. KYC χρειάζεται **μόνο** για το live-money flip. → [ADR 0010](adr/0010-payments-stripe-now-viva-at-launch.md)
- **ERP → build-now.** Οι 5 read methods είναι **ήδη γραμμένες** (το status doc έλεγε λάθος «0 live methods»). Με fixtures από το **Postman collection**, `createOrder` + sync + failsafe χτίζονται όλα τώρα. Live creds = μόνο smoke test. → [ADR 0011](adr/0011-storefront-serves-from-supabase-read-model.md), [ADR 0012](adr/0012-stock-freshness-tiering-and-erp-failsafe.md)
- **AI → free key.** Provider registry, default OpenAI στο chatbot. → [ADR 0013](adr/0013-ai-provider-registry.md)

**Αποτέλεσμα:** «τι μου μένει όταν έρθουν τα credentials» = **ελάχιστο** (ένα env flip + smoke test). Ο στόχος του grill επετεύχθη.

---

## 1. Αποφάσεις που κλειδώθηκαν

| # | Απόφαση | Σπίτι |
|---|---|---|
| 1 | **Acceptance bar κάθε blocked slice = «fixture-backed + flag»**: πλήρης κώδικας + tests ενάντια σε recorded responses + feature flag. Credential = env flip πάνω σε ήδη-tested κώδικα. (Drop σε live-sandbox όπου υπάρχει free demo: Stripe test, Viva demo, OpenAI/Anthropic key.) | *κανόνας εργασίας* |
| 2 | **Σειρά = foundation-first.** Πρώτα τα abstractions (PaymentProvider, AI registry, ERP read-model/sync), μετά fan-out independent tracers. | *κανόνας εργασίας* |
| 3 | **Payments:** Stripe build-now / Viva-at-launch (κάρτες+IRIS) / ένα `PaymentProvider` interface. | [ADR 0010](adr/0010-payments-stripe-now-viva-at-launch.md) |
| 4 | **ERP read-model:** storefront σερβίρει από Supabase· ERP το τροφοδοτεί· επιβιώνει το Entersoft→Odoo swap (poll→push αλλάζει μόνο ο worker). | [ADR 0011](adr/0011-storefront-serves-from-supabase-read-model.md) |
| 5 | **Stock tiering & failsafe:** catalog cached· stock live **μόνο στο commit** (anti-oversell)· ERP κάτω → **keep selling**· orders → async queue. | [ADR 0012](adr/0012-stock-freshness-tiering-and-erp-failsafe.md) |
| 6 | **AI provider registry:** chatbot pinned OpenAI (Άρθρο 6.2)· υπόλοιπα swappable. | [ADR 0013](adr/0013-ai-provider-registry.md) |
| 7 | **AI price negotiation = bounded discount engine:** το AI ποτέ δεν εφευρίσκει τιμή· διαλέγει πάνω από server-side **floor price**. | [ADR 0014](adr/0014-ai-price-negotiation-bounded-by-server-floor.md) |
| 8 | **Multi-currency = display-only** + currency-view analytics· FX-charge = parked change request, gated σε demand signal. | glossary: *Display currency* |

---

## 2. Χάρτης κενών — Σύμβαση Άρθρο 6 vs κώδικας

| Άρθρο 6 παραδοτέο | Κατάσταση | Κενό → slice |
|---|---|---|
| 6.1 Custom platform / 10k / 6 γλώσσες | ✅ | catalog translation → **CAT-2** |
| 6.1 multi-currency | ❌ | **CAT-1** (display-only) |
| 6.1 PWA | ❌ | **PR-4** |
| 6.2 AI chatbot (OpenAI) | ⚠️ foundation | **AI-1** |
| 6.2 recommendations | ❌ | **AI-2** |
| 6.2 AI price negotiation | ❌ | **AI-3** (bounded) |
| 6.2 SEO content ×6 | ❌ | μέσα στο **CAT-2 / GIFT-1** |
| 6.3 20+ emails | ❌ | **EM-1 + EM-2…** |
| 6.4 ERP (προϊόντα/τιμές/stock/orders/πελάτες/τιμολόγια) + failsafe | ⚠️ reads έτοιμα | **F-3, ERP-1/2/3** |
| 6.5 landing builder / campaign | ✅ live | — |
| 6.5 lead magnets | ❌ | **ENG-3** |
| 6.5 referral & loyalty | ⚠️ DB only | **ENG-1/2** |
| 6.6 AR 20-30 SKU | ❌ | **PR-1** (assets) |
| 6.6 360°/video | ❌ | **PR-2** (assets) |
| 6.6 Garage συμβατότητα | ❌ | **GAR-1..4** |
| 6.6 voice search | ❌ | **PR-3** |
| 6.6 rider reviews | ✅ | — |
| 6.7 πληρωμές (όλες) + IRIS (νόμος Νοε-25) | ❌ | **PM-1/PM-2** |
| 6.8 AI SEO Upload App (δώρο) | ❌ | **GIFT-1** |
| 6.9 30d post-launch support | — | *process* |
| 6.10 source code + docs | ✅ ongoing | — |

---

## 3. Master bullet-tracer decomposition (foundation-first)

**Gate:** 🟢 build-now · 🔵 build-now, flip σε key μετά · 🔴 flip-only (περιμένει τρίτο)

### Layer 0 — Foundations
| id | slice | gate |
|---|---|---|
| **F-1** | `PaymentProvider` interface + 2-axis order state (`payment_status`+fulfillment `status`) + `checkout_sessions` (order created on confirmed webhook, COD immediate) + webhook verify/idempotency + hosted Stripe Checkout για **άμεσες** μέθοδοι (κάρτα/Apple/Google) = tracer. → [ADR 0010](adr/0010-payments-stripe-now-viva-at-launch.md), [ADR 0015](adr/0015-order-created-on-payment-confirmation.md) | 🟢 |
| **F-2** | `ai/models.ts` provider registry | 🟢 |
| **F-3** | ERP read-model + sync orchestrator — split: catalog sync (αργό) / stock sync (συχνό) | 🟢 |

### Layer 1 — Payments
| **PM-1** | Stripe **delayed-settlement** rails: SEPA + Klarna (νέα κατάσταση «εκκρεμεί», async_payment webhooks, μην-στείλεις-μέχρι-πληρωθεί) — fast-follow πάνω στο F-1. (Revolut + άμεσες κάρτες/wallets ήδη στο F-1 ως toggle.) | 🔵 test→live |
| **PM-2** | Viva adapter: GR κάρτες + IRIS (Smart Checkout demo) | 🔵 demo→KYC |

### Layer 2 — ERP completion (Postman fixtures)
| **ERP-1** | `createOrder` στο `IErpAdapter` + Entersoft `AppCreateOrder` | 🔵 |
| **ERP-2** | Live stock check στο commit (add-to-cart/checkout) | 🔵 |
| **ERP-3** | Order queue + failsafe «keep-selling» | 🟢 |

### Layer 3 — Catalog
| **CAT-1** | Multi-currency display + currency-view analytics | 🟢 |
| **CAT-2** | Catalog translation ×6 (pipeline τώρα) | 🔵 ANTHROPIC key+migration |
| **CAT-3** | Πλήρες Schema set (Breadcrumb/Organization) | 🟢 |
| **CAT-4** | Skroutz feed | 🟢 |

### Layer 4 — Garage / Fitment (Cycle 4)
| **GAR-1..4** | user_bikes · fitment tagging · PLP filter · PDP «Ταιριάζει» | 🟢 |

### Layer 5 — AI cluster
| **AI-1** | Chatbot live (OpenAI via F-2) + Upstash rate-limit + pgvector | 🔵 free key |
| **AI-2** | Recommendations (pgvector similarity / co-purchase) | 🟢 |
| **AI-3** | AI price negotiation = bounded discount (server floor) | 🟢 |

### Layer 6 — Engagement
| **ENG-1/2** | Referral + Loyalty logic/UI (DB έτοιμο) | 🟢 |
| **ENG-3** | Lead magnets / AI Size Quiz / Rider Quiz | 🟢 |

### Layer 7 — Emails (Resend DNS ~24h)
| **EM-1** | Email infra: Resend+DKIM + templating + trigger framework | 🔵 |
| **EM-2…** | 20+ automations (abandoned cart, welcome, price-drop, order updates, review request, win-back, birthday, seasonal…) — κάθε ένα λεπτό slice πάνω στο EM-1 | 🔵 |

### Layer 8 — Observability
| **OBS-1** | PostHog + GA4 + checkout funnel + GDPR consent | 🔵 free key |
| **OBS-2** | Sentry | 🔵 free key |

### Layer 9 — Auth
| **AUTH-1** | Google OAuth (δικό σου Cloud, no review) | 🔵 |
| **AUTH-2** | Facebook OAuth | 🔴 FB review 2-3εβδ |
| **AUTH-3** | Apple Sign-in | 🔴 Apple Dev 2-3εβδ |

### Layer 10 — Premium (Phase 4)
| **PR-1** | AR 20-30 SKU | 🔴 3D assets |
| **PR-2** | 360°/video | 🔴 assets |
| **PR-3** | Voice search | 🟢 |
| **PR-4** | PWA | 🟢 |

### Layer 11 — Launch
| **LX-1** | Security audit | 🟢 |
| **LX-2** | Performance <2.5s (ξεπαγώνει CWV) | 🟢 |
| **LX-3** | Monitoring | 🟢 |
| **LX-4** | Go-live (flip live Stripe→Viva, live Entersoft creds) | 🔴 |

### Parallel / δώρο
| **GIFT-1** | AI SEO Product Upload App (ξεχωριστή εφαρμογή, bulk CSV/Excel ×6) | 🟢 |

---

## 4. Τι **πραγματικά** περιμένει τρίτους (το μόνο 🔴)

| Credential | Ξεκλειδώνει | Σημείωση |
|---|---|---|
| Viva live KYC | PM-2 live flip + IRIS live | adapter ήδη χτισμένος/tested σε demo |
| Live Entersoft creds | ERP live flip | κώδικας έτοιμος → arrival = smoke test |
| Facebook app review | AUTH-2 | περιφερειακό |
| Apple Developer | AUTH-3 | περιφερειακό |
| 3D assets (USDZ/glb) | PR-1/PR-2 | Phase 4, μη-κρίσιμο |
| Resend DNS (~24h) | EM-* | owner-controlled, γρήγορο |
| ANTHROPIC key + migration | CAT-2 | owner free-key |

Όλα τα υπόλοιπα (🟢/🔵) **χτίζονται τώρα**. Κανένα 🔴 δεν μπλοκάρει κεντρικό μονοπάτι.

---

## 5. Επόμενο βήμα

Foundation-first → grill το **F-1** (`PaymentProvider` tracer) σε PRD → to-issues. Μετά F-2/F-3 παράλληλα, και fan-out τα feature layers.
