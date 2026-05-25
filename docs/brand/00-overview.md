# 00 — Επισκόπηση: τι είναι το Motomarket

> Capture: 2026-05-25 · Πηγές: motomarket.gr + motomarket-shop.gr (live)

## Η εταιρεία με μία ματιά
**Moto Market** — ελληνική εταιρεία εξοπλισμού αναβάτη & μοτοσικλέτας, **ιδρύθηκε το 1982** στη
Θεσσαλονίκη (σήμερα στην **4η δεκαετία** λειτουργίας). Από μικρό κατάστημα στο κέντρο, μέχρι το
2000 μετακόμισε σε σύγχρονες εγκαταστάσεις στη **Βι.Πε. Σίνδου** (κεντρικά από το 1999).
Σήμερα: **~6.000 τ.μ.** αποθηκών/καταστημάτων, εκατοντάδες συνεργάτες σε **Ελλάδα & ΝΑ Ευρώπη**,
αντιπροσώπευση ευρωπαϊκών brands + **3 δικά της brands** (Pilot, Nordcode, Fovos).
Αρ. **ΓΕΜΗ 058969304000** · ISO 9001.

## Δύο domains, ένας οργανισμός — η σχέση
| | **motomarket.gr** | **motomarket-shop.gr** |
|---|---|---|
| Ρόλος | **Εταιρικό / brand site** | **E-shop (συναλλακτικό)** |
| Tech | WordPress (server-rendered) | Entersoft SPA (client-rendered· prerender για bots) |
| Περιεχόμενο | Η εταιρεία, brands, store-locator, certificates, news | Κατάλογος ~11–20k προϊόντων, policies, customer service, καλάθι/checkout |
| Γλώσσες | EL | EL + EN (`/en/...`) |
| Σχέση | «βιτρίνα» του ομίλου | το «κατάστημα» — **αυτό αντικαθιστά το παρόν project** |

➡️ Το **νέο headless eshop** αυτού του repo είναι ο διάδοχος του `motomarket-shop.gr`. Το
`motomarket.gr` παραμένει ως εταιρική παρουσία — αλλά το περιεχόμενό του (ιστορία, brands,
καταστήματα, voice) τροφοδοτεί τις brand/about σελίδες του νέου site.

## Τι περιέχει αυτή η knowledge base (`docs/brand/`)
| Αρχείο | Περιεχόμενο |
|---|---|
| `01-company-identity.md` | Ποιοι είναι, ιστορία, αξίες, certificates |
| `02-own-brands.md` | Pilot · Nordcode · Fovos (verbatim positioning) |
| `03-partner-brands.md` | 21 brands που αντιπροσωπεύουν + category map |
| `04-brand-voice.md` | Tone, φράσεις, value props για copy |
| `05-contact-and-stores.md` | Όλα τα σημεία, τηλέφωνα, emails, ΓΕΜΗ |
| `policies/` | Όροι, Αποστολές/Επιστροφές, Πληρωμές, Εγγύηση, Privacy, Cookies (**verbatim**) |
| `guides/` | Size guide, Κράνος & ασφάλεια, Συντήρηση κράνους/εξοπλισμού, Tracking |
| `news/index.md` | Editorial/νέα — εύρημα: ουσιαστικά ανύπαρκτο (ευκαιρία) |
| `_sources.md` | Πλήρες URL inventory + μέθοδος + global GAPS |

## Πώς μαζεύτηκε (μέθοδος)
- **motomarket.gr**: WordPress → WebFetch/curl απευθείας.
- **motomarket-shop.gr**: SPA που σερβίρει «System loading…» σε normal UA· **prerendered HTML
  μόνο σε Googlebot UA** → capture με `curl -A "…Googlebot…"`, extraction verbatim.
- URL enumeration από `wp-sitemap.xml` (εταιρικό) & `sitemap-pages.xml.gz` (eshop).

## Κρίσιμα facts για το νέο site (TL;DR)
- **Δωρεάν αποστολή >50€**, αλλιώς 2,00€ · αποστολή σε 24h/επόμενη εργάσιμη.
- **Επιστροφές 14 ημερολογιακές ημέρες** (υπαναχώρηση)· έξοδα επιστροφής στον πελάτη.
- **Εγγύηση 2 έτη** (ελαττώματα υλικών/κατασκευής).
- Πληρωμές (τρέχον): **Viva** (cards/IRIS/Apple/Google Pay/Klarna) + PayPal + κατάθεση + αντικαταβολή.
- **ΦΠΑ 24%** στις τιμές.
- Own brands καλύπτουν το κενό «φθηνό-κακό ↔ ποιοτικό-ακριβό» (τρίπτυχο **ασφάλεια–design–τιμή**).
