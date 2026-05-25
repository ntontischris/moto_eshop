# _sources — URL inventory, μέθοδος & global GAPS

> Capture date: **2026-05-25** · Όλα τα παρακάτω κρολαρίστηκαν ζωντανά αυτή την ημερομηνία.

## Μέθοδος capture
| Site | Tech | Πώς διαβάστηκε |
|---|---|---|
| motomarket.gr | WordPress (SSR) | WebFetch + `curl` (κανονικό UA) |
| motomarket-shop.gr | Entersoft **SPA** | κανονικό UA → «System loading…» (750 bytes). **Λύση:** `curl -A "…Googlebot/2.1…"` → prerendered HTML (40–88 KB), extraction verbatim |

URL enumeration: `motomarket.gr/wp-sitemap.xml` (+ sub-sitemaps) · `motomarket-shop.gr/sitemap-index.xml.gz → sitemap-pages.xml.gz` (gunzip).

## motomarket.gr (εταιρικό)
**Pages:** `/` · `/the-company/` · `/store-locator/` · `/certificates/` · `/newsletter/` · `/cookie-policy/` · `/terms-of-use/` · `/nordcode2022-collection/` *(thin)* · `/pilot-2021-catalog/` *(thin)* · `/dokimi/` *(test — αγνοήθηκε)*
**Brands (`/brands/…`):** bell, hjc, acerbis, airoh, caberg, givi, mt-helmets, **pilot**, dane, five, forma, **fovos**, macna, **nordcode**, motorex, muc-off, ariete, akrapovic, booster, dna, sena, difi, rg-racing, tucano-urbano
**Categories (`/project_category/…`):** helmets, tech-wear, accessories, off-road, lubricants

## motomarket-shop.gr (eshop) — content pages
**Captured verbatim:** `/etaireia` · `/epikoinonia` · `/partners` · `/certificates`
`/eksyphrethsh-pelaton/` → `oroi-proypotheseis` (Όροι) · `apostoles-kai-epistrofes-proionton` (Αποστ./Επιστρ.) · `eggyhsh` (Εγγύηση) · `tropoi-plhromhs` (Πληρωμές) · `politikh-prostasias` (Privacy) · `kranos-kai-asfaleia` (Κράνος/ασφάλεια) · `synthrhsh-kranoys` · `synthrhsh-eksoplismoy`
**Thin / non-text:** `/brands` (JS grid, δεν prerender) · `odhgos-megethon` (μόνο **εικόνες** size charts) · `anazhthsh-apostolhs` (μόνο **φόρμα** tracking)
**EN mirror (υπάρχει, ΔΕΝ captured verbatim):** `/en/customer-service/*`, `/en/company`, `/en/contact`, `/en/partners`, `/en/brands` — διαθέσιμο αν χρειαστεί δίγλωσσο.
**Functional (όχι content):** `/basket` `/login` `/register` `/wishlist` `/adv-search` `/pay-online` `/b2blogin` `/black-friday` `/usermanual`

## GLOBAL GAPS — «τι ΔΕΝ γράφει» (συγκεντρωτικά)
1. **Editorial/blog:** ανύπαρκτο σε κανένα site (βλ. `news/index.md`).
2. **Size guide:** μόνο εικόνες, λίγα brands, χωρίς «πώς να μετρήσεις».
3. **Εταιρικά:** χωρίς ακριβές έτος ίδρυσης στο εταιρικό site (το eshop δίνει 1982), χωρίς ιδρυτή/νομική μορφή/ΑΦΜ/τζίρο (μόνο ΓΕΜΗ 058969304000).
4. **Καταστήματα:** χωρίς ωράρια & Google Maps.
5. **Όροι:** stale payment (Alpha/MasterPass) + προ-GDPR νομοθεσία (Ν.2472/97) + ΦΠΑ hardcoded.
6. **Consent:** Google Analytics cookies χωρίς σύγχρονο CMP/Consent Mode v2.
7. **Partner brands:** copy μόνο αγγλικά (αντιγραμμένο), 6 σελίδες κενές.
8. **Courier:** δεν κατονομάζεται.
9. **Brand name:** ασυνέπεια «Moto Market» / «MotoMarket».
10. **Thessaloniki email:** ασυμφωνία `karamanli@` vs `kalamaria@`.

## Σημείωση φρεσκάδας
Snapshot 2026-05-25. Τα live sites αλλάζουν — για επανέλεγχο, ξανατρέξε τα curls με Googlebot UA.
