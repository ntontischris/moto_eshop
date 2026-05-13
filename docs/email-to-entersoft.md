# Email προς Entersoft / Zubulakis

**Subject:** Αίτημα επέκτασης Public Queries για το νέο headless e-shop της Moto Market

**To:** zubulakis@motomarket.gr
**Cc:** (Entersoft account manager / consultant)

---

Καλησπέρα Χρήστο,

Το νέο API key που μου στείλατε στις 8/5 δουλεύει κανονικά και έχουμε ήδη
ολοκληρώσει την πρώτη φάση ενσωμάτωσης (3.166 ενεργά SKUs, stock ανά 4
αποθήκες, 28.050 πελάτες, 95.560 διευθύνσεις πελατών στο νέο σύστημα).

Για να προχωρήσουμε στην επόμενη φάση —το **headless e-commerce frontend**—
χρειαζόμαστε **επέκταση των υπαρχόντων Public Queries** ώστε να τραβάμε
απευθείας από το ERP όλα τα δεδομένα που σήμερα δεν εκτίθενται. Δεν θέλουμε
ούτε scraping του παλιού eshop, ούτε manual αντιγραφή. **Πηγή αλήθειας πρέπει
να είναι το ERP**, διαφορετικά καθε αλλαγή τιμολογίου / νέου είδους /
χαρακτηριστικού θα χρειάζεται διπλή δουλειά.

Παρακάτω η αναλυτική λίστα των αλλαγών που ζητάμε. Όλα ζητούνται ως **νέα
πεδία στο SELECT των υπαρχόντων PQ** (δεν χρειάζεται νέο endpoint),
εκτός όπου σημειώνεται.

---

## 1) Επέκταση του `ESPORTAL_CS_AppItems`

Αυτό είναι το βασικό PQ καταλόγου. Σήμερα επιστρέφει μόνο 16 πεδία
(`ItemGID`, `Code`, `RetailPrice`, `Price1`, `ItemFamily/Group`, `Brand`,
`WEB`, `MissingFields`, κλπ.). Χρειαζόμαστε επίσης:

### Στοιχεία ταυτότητας
- `Description` — η κανονική ονομασία είδους (από `ESFIItem.Description`)
- `Description2` ή `ShortDescription` — δευτερεύουσα/εμπορική ονομασία αν υπάρχει
- `LongDescription` ή `Comments` — εκτενής περιγραφή / χαρακτηριστικά
  (το πεδίο που εμφανίζεται στην καρτέλα στο Designer)
- `Specifications` ή τα structured πεδία τεχνικών χαρακτηριστικών αν υπάρχουν

### Λογιστικά / Operational
- `MeasurementUnitCode` (μονάδα μέτρησης — τεμάχιο/κιλό/μέτρο)
- `Weight` (βάρος, για υπολογισμό μεταφορικών)
- `Volume` (όγκος, αν είναι σχετικός)
- `fVATCategoryCode` ή `VATPercentage` (συντελεστής ΦΠΑ ανά είδος)

### Σχεσιακά
- `Manufacturer` / `Supplier` (κατασκευαστής, διαφορετικό από Brand)
- `OriginCountry` (χώρα προέλευσης για δηλώσεις/τελωνείο)
- `EANPrimary` (κύριο EAN, ξεχωριστά από το comma-separated `MultipleCode`)

### Δομικά
- Categories όχι μόνο σαν κωδικούς (`01.02`) αλλά **και με ονόματα**:
  - `ItemFamilyDescription`
  - `ItemGroupDescription`
  - `ItemCategoryDescription`
  - `ItemSubcategoryDescription`

> Εναλλακτικά: νέο PQ `ESPORTAL_CS_ItemCategories` με {Code, Description,
> ParentCode, Level} ώστε να φτιάξουμε το tree μία φορά και να κάνουμε join.

---

## 2) Νέο PQ ή expansion: **media (εικόνες)**

Είναι το πιο κρίσιμο που λείπει για e-shop. Δύο σενάρια:

**A. Αν οι εικόνες αποθηκεύονται στο Entersoft DocumentManagement / Attachments:**

Παρακαλώ νέο PQ:
```
ESPORTAL_CS_AppItemImages
```
που να επιστρέφει για κάθε SKU:
- `ItemGID`
- `Code`
- `ImageURL` (απευθείας public URL, ή signed URL)
- `Position` (1, 2, 3… για ordering)
- `IsMain` (boolean — η κύρια εικόνα)
- `MimeType`
- `LastModifiedDate`

**B. Αν οι εικόνες δεν τηρούνται στο ERP:**

Θα μας τις δώσετε με **bulk file transfer** (ZIP / FTP / S3) μαζί με
**index file** (CSV/JSON) που να συνδέει filename ↔ SKU. Στο μέλλον θα
συμφωνήσουμε διαδικασία updates (π.χ. webhook όταν προστίθεται νέα).

---

## 3) Επέκταση του `ESPORTAL_CS_AppStockStatus`

Σήμερα επιστρέφει stock ανά αποθήκη (Σίνδος, Καλλιθέα Βενιζέλου,
Αντιστάσεως, Beinoglou) και ανά `fStockDimCode`. Επιπλέον χρειαζόμαστε:

- `LastUpdated` (timestamp τελευταίας αλλαγής stock για incremental sync)
- `ReservedQty` ανά location (παραγγελίες σε εκκρεμότητα)
- `IncomingQty` ανά location (εκκρεμείς παραλαβές με ημερομηνία)
- Mapping `fStockDimCode` → ανθρώπινο label (π.χ. "00L" → "L", "030" → "Μέγεθος 30")

---

## 4) Επέκταση του `ESPORTAL_CS_Customers`

Είναι σχεδόν πλήρες. Προσθέστε:
- `Address` / `MainAddressID` (για να γνωρίζουμε ποια από τις πολλαπλές
  διευθύνσεις είναι η billing)
- `CustomerGroup` (Λιανική / Χονδρική / κλπ — για pricing policy)
- `PricelistCode` (αν έχει custom τιμοκατάλογο)
- `LastOrderDate`

---

## 5) Νέο PQ: **παραστατικά / ιστορικό παραγγελιών**

Θα χρειαστούμε στο μέλλον (μετά το launch) για το "Οι παραγγελίες μου" tab
στο profile του πελάτη:

```
ESPORTAL_CS_CustomerOrders
```
- `OrderGID`, `OrderCode`, `OrderDate`
- `CustomerGID`
- `Status` (παραδομένη / σε εκκρεμότητα / ακυρωμένη / κλπ)
- `Total`, `Currency`
- Line items (σαν nested array ή ξεχωριστό PQ)

---

## 6) Test environment (πολύ σημαντικό)

Πριν χτυπήσουμε production endpoints για POST operations
(`AppCreateOrder`, `ImportClients`, `ImportAddress`), παρακαλώ να μας
δώσετε:

- **Test API key** σε sandbox / dev instance, ή
- **Test trade account** που να μπορούμε να γράφουμε χωρίς να επηρεάζονται
  πραγματικά παραστατικά / λογιστικά

Είναι standard practice για κάθε ERP integration και θα μας προφυλάξει
από φασαρίες στο live.

---

## Χρονοδιάγραμμα

Έχουμε στόχο soft launch του νέου e-shop **εντός 6-8 εβδομάδων**.
Τα παραπάνω πεδία είναι **prerequisites** — δεν μπορούμε να προχωρήσουμε
σε content χωρίς αυτά. Από τη μεριά μας:

- Hosting / database: ✅ έτοιμο (Supabase + Vercel)
- ERP sync layer: ✅ έτοιμο για τα τρέχοντα 16 πεδία
- Frontend skeleton: ✅ έτοιμο (Next.js + storefront UI)
- Σύνδεση payments / shipping: 🔄 σε εξέλιξη

Αν χρειάζεται meeting με τον σύμβουλο Entersoft για να το συζητήσουμε
τεχνικά, είμαι διαθέσιμος όποτε σας βολεύει — και θα ετοιμάσω **technical
spec document** με όλα τα παραπάνω σε δομημένη μορφή αν χρειαστεί.

Καλή συνέχεια,
{όνομα}

---

## Παράρτημα Α — Δείγμα αναμενόμενης απάντησης από επέκταση `AppItems`

```jsonc
{
  "ItemGID": "d2d05d92-bbea-410f-8954-f75a5ce901d0",
  "Code": "ABUCABLOC01",
  // … υπάρχοντα πεδία …
  
  // ── ΝΕΑ πεδία που ζητάμε ──
  "Description": "Κλειδαριά ασφαλείας ABUS Cable Lock 01",
  "Description2": "Combiflex 2502/85",
  "LongDescription": "Ευέλικτη και ασφαλής κλειδαριά τύπου spiral για μοτοσικλέτα και ποδήλατο. Συρμάτινο σώμα μήκους 85cm, διάμετρος 8mm…",
  "MeasurementUnitCode": "TEM",
  "Weight": 0.42,
  "fVATCategoryCode": "ΦΠΑ24",
  "EANPrimary": "4003318339196",
  "Manufacturer": "ABUS August Bremicker Söhne KG",
  "OriginCountry": "DE",
  "ItemFamilyDescription": "Ασφάλεια & Κλειδαριές",
  "ItemGroupDescription": "Κλειδαριές μοτοσικλέτας"
}
```

## Παράρτημα Β — Παράδειγμα `AppItemImages` response

```json
{
  "Table": "ESItemImages",
  "Rows": [
    {
      "ItemGID": "d2d05d92-bbea-410f-8954-f75a5ce901d0",
      "Code": "ABUCABLOC01",
      "ImageURL": "https://media.entersoft.gr/customers/01100128469/items/ABUCABLOC01/main.jpg",
      "Position": 1,
      "IsMain": true,
      "MimeType": "image/jpeg",
      "LastModifiedDate": "2025-03-12T14:22:00"
    },
    {
      "ItemGID": "d2d05d92-bbea-410f-8954-f75a5ce901d0",
      "Code": "ABUCABLOC01",
      "ImageURL": "https://media.entersoft.gr/customers/01100128469/items/ABUCABLOC01/detail-1.jpg",
      "Position": 2,
      "IsMain": false,
      "MimeType": "image/jpeg",
      "LastModifiedDate": "2025-03-12T14:22:00"
    }
  ]
}
```
