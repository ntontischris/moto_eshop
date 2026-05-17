"use client";

import Image from "next/image";
import { Big_Shoulders, Geist, JetBrains_Mono } from "next/font/google";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { NAV } from "@/lib/nav-data";
import type { NavRoot } from "@/lib/nav-data";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconCart,
  IconChevronDown,
  IconFacebook,
  IconHeart,
  IconInsta,
  IconSearch,
  IconUser,
  IconYouTube,
} from "./mm-icons";

/* ════════════════════════════════════════════════════════════════════
   MOTO MARKET — Landing implementation from Claude Design handoff.
   Editorial-adrenaline aesthetic: ink black + bone + signal red +
   hazard amber. Big Shoulders Display + Geist + JetBrains Mono.
   Bilingual EL/EN with live toggle.
   ════════════════════════════════════════════════════════════════════ */

const display = Big_Shoulders({
  subsets: ["latin"],
  weight: ["500", "700", "800", "900"],
  variable: "--mm-display",
  display: "swap",
});
const sans = Geist({
  subsets: ["latin"],
  variable: "--mm-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--mm-mono",
  display: "swap",
});

/* ─── Asset map — Higgsfield generated photos ───────────────────── */
const A = {
  helmet:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_221743_1484ba42-ca46-4960-8b77-9b2bbf96a170.png",
  apparel:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_221746_659359f4-a320-4ed7-be27-13541266b3f0.png",
  tyre: "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_221748_08b16e98-6249-4149-9195-a510bc9e7129.png",
  exhaust:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_221751_e6e8212c-73bb-4488-a00c-61082063cd88.png",
  editorial:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_221754_ef8b651f-c39f-45b2-9e8a-c0e1bc35c080.png",
  pHelmetFront:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_223028_00bb63be-af54-458c-9910-43afd9f17bef.png",
  pSportTyre:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_223031_c3aa8f4b-38aa-4e85-86a2-4cce480cb6c0.png",
  pExhaustMuffler:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_223033_1b248479-5474-4959-b3b6-cb4dc533e3e7.png",
  pTourTyre:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_223037_b2654ea1-fbd5-4641-9dcc-83a9e8fe9cf4.png",
  pTopCase:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_223040_3d63efb5-4105-49a4-b438-c43277b8a5f9.png",
  pBrakePads:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_224053_41911fce-98d7-431a-8474-fea571765036.png",
  gChain:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_223042_7b67658a-f12d-4866-8fdd-651a09c5562e.png",
  gTyresGuide:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_223044_dcb97530-f48e-4e35-9448-9da716a8f23c.png",
  gBrakeInstall:
    "https://d8j0ntlcm91z4.cloudfront.net/user_34y7dNWX6no0cgRVdzxt5wPZ7a9/hf_20260514_223047_1510d6b7-83d3-4e87-a3fe-374be51b815d.png",
};

/* ─── i18n (subset, ported from design handoff) ────────────────── */
type Lang = "el" | "en";
const I18N = {
  el: {
    helpline: "Online εξυπηρέτηση",
    free_ship: "Δωρεάν αποστολή > 50€",
    same_day: "Αυθημερόν αποστολή",
    warranty: "Εγγύηση επίσημης αντιπροσωπείας",
    track_order: "Παρακολούθηση παραγγελίας",
    nav_rider: "ΑΝΑΒΑΤΗΣ",
    nav_moto: "ΜΟΤΟΣΙΚΛΕΤΑ",
    nav_off: "OFF-ROAD",
    nav_brands: "BRANDS",
    nav_mybike: "MY BIKE",
    nav_sale: "ΠΡΟΣΦΟΡΕΣ",
    hero_chip: "Νέα συλλογή · Άνοιξη / Καλοκαίρι 26",
    hero_kicker: "Μηχανικός εξοπλισμός · Από το 1982",
    hero_punch_a: "Γυρνάς",
    hero_punch_b: "πίσω.",
    hero_provoke_sub:
      "Δεν πουλάμε όνειρα. Πουλάμε εξοπλισμό που δοκιμάστηκε σε ταξίδια που τέλειωσαν με το τίμημα της επιστροφής. 44 χρόνια. 2 καταστήματα. Μία υπόσχεση.",
    hero_cta_shop: "Δες όλη τη συλλογή",
    hero_cta_find: "Βρες ό,τι ταιριάζει στη μηχανή σου",
    hero_meta_loc: "Αθήνα · Θεσσαλονίκη",
    hero_meta_since: "Από το 1982",
    stat_brands: "Brands",
    stat_brands_v: "180+",
    stat_products: "Προϊόντα",
    stat_products_v: "12k+",
    stat_years: "Χρόνια",
    stat_years_v: "44",
    stat_ship: "Αποστολή",
    stat_ship_v: "24h",
    stats_orders: "Παραγγελίες",
    stats_returns: "Επιστροφές",
    stats_rating: "Skroutz rating",
    stats_riders: "Αναβάτες",
    promise1_t: "Επίσημη Αντιπροσωπεία",
    promise1_d: "Όλα τα προϊόντα με εγγύηση κατασκευαστή.",
    promise2_t: "Δωρεάν Αποστολή",
    promise2_d: "Για όλες τις παραγγελίες πάνω από 50€.",
    promise3_t: "Αυθημερόν Αποστολή",
    promise3_d: "Αν παραγγείλεις πριν τις 14:00 εργάσιμη μέρα.",
    promise4_t: "Δύο Καταστήματα",
    promise4_d: "Αθήνα και Θεσσαλονίκη — έλα να τα δοκιμάσεις.",
    sec_cats_eyebrow: "Κατηγορίες",
    sec_cats_h: "Διάλεξε από πού θα ξεκινήσεις",
    sec_cats_meta: "8 κύριες κατηγορίες · 12.000+ προϊόντα",
    sec_cats_all: "Όλες οι κατηγορίες",
    items_label: "ΕΙΔΗ",
    sec_new_eyebrow: "Νέες παραλαβές",
    sec_new_h: "Μόλις ήρθαν",
    sec_new_meta: "Παραλαβές Μαΐου",
    sec_new_all: "Όλες οι νέες παραλαβές",
    sec_house_eyebrow: "Δικά μας brands",
    sec_house_h: "Φτιαγμένα στην",
    sec_house_h2: "Ελλάδα",
    sec_house_p:
      "Τρία in-house brands που σχεδιάζουμε και υποστηρίζουμε εμείς. Επειδή ο εξοπλισμός που δουλεύει στο Καλαμπάκι δεν είναι ίδιος με αυτόν που δουλεύει στις Άλπεις.",
    sec_find_eyebrow: "Βρες την εφαρμογή",
    sec_find_h: "Δείξε μας τη",
    sec_find_h2: "μηχανή σου.",
    sec_find_p:
      "Πες μας τι έχεις και θα φιλτράρουμε όλα τα προϊόντα ώστε να βλέπεις μόνο αυτά που ταιριάζουν — βαλίτσες, βάσεις GPS, εξατμίσεις, screens.",
    find_year: "Έτος",
    find_make: "Μάρκα",
    find_model: "Μοντέλο",
    find_engine: "Κυβικά",
    find_cta: "Δες τα προϊόντα",
    find_clear: "Καθαρισμός",
    find_or: "ή διάλεξε γρήγορα",
    sec_best_eyebrow: "Bestsellers",
    sec_best_h: "Αυτά πετάνε από τα ράφια",
    sec_best_meta: "Τελευταίες 30 ημέρες",
    sec_best_all: "Όλα τα bestsellers",
    sec_heritage_eyebrow: "Από το 1982",
    sec_heritage_h_pre: "Σαράντα τέσσερα",
    sec_heritage_h_year: "χρόνια",
    sec_heritage_h_post: "στο πλευρό σου",
    sec_heritage_p:
      "Ξεκινήσαμε ως ένα μικρό κατάστημα στην Καλλιθέα. Σήμερα είμαστε δύο φυσικά καταστήματα, ένα warehouse και ένα eshop που στέλνει σε όλη την Ελλάδα. Το ίδιο πάθος, μόνο που τώρα μπορούμε να το στείλουμε στην πόρτα σου σε 24 ώρες.",
    sec_heritage_tag: "ΕΣΤ. 1982",
    sec_heritage_bottom_l: "Αθήνα · Θεσσαλονίκη",
    sec_heritage_bottom_r: "Φωτογραφία αρχείου",
    sec_brands_title: "Συνεργαζόμαστε με τα κορυφαία brands του κόσμου",
    nl_eyebrow: "Newsletter",
    nl_h: "Μείνε μπροστά από το κύμα",
    nl_p: "Νέες παραλαβές, drops, και προσφορές μόνο για εγγεγραμμένους — όχι spam.",
    nl_placeholder: "Το email σου",
    nl_cta: "Εγγραφή",
    nl_perk1: "10% off πρώτη παραγγελία",
    nl_perk2: "Πρώτος στις προσφορές",
    nl_perk3: "Άκυρο όποτε θες",
    foot_blurb:
      "Από το 1982 παρέχουμε στους αναβάτες τον εξοπλισμό που χρειάζονται. Δύο καταστήματα στην Ελλάδα, ένα eshop που στέλνει παντού.",
    foot_shop: "Shop",
    foot_help: "Εξυπηρέτηση",
    foot_about: "Εταιρεία",
    foot_contact: "Επικοινωνία",
    stock_in: "Διαθέσιμο",
    stock_low: "Τελευταία τεμάχια",
    sold_units: "πούλησαν αυτή τη βδομάδα",
    viewing_now: "βλέπουν τώρα",
    add_to_cart: "Προσθήκη στο καλάθι",
    house_shop_all: "Δες όλα τα ",
  },
  en: {
    helpline: "Online support",
    free_ship: "Free shipping > €50",
    same_day: "Same-day dispatch",
    warranty: "Official warranty",
    track_order: "Track order",
    nav_rider: "RIDER",
    nav_moto: "BIKE",
    nav_off: "OFF-ROAD",
    nav_brands: "BRANDS",
    nav_mybike: "MY BIKE",
    nav_sale: "SALE",
    hero_chip: "New collection · Spring / Summer 26",
    hero_kicker: "Motorcycle gear · Since 1982",
    hero_punch_a: "You",
    hero_punch_b: "return.",
    hero_provoke_sub:
      "We don't sell dreams. We sell gear that's been tested on rides that ended with the price of getting home. 44 years. 2 stores. One promise.",
    hero_cta_shop: "Shop the collection",
    hero_cta_find: "Find what fits your bike",
    hero_meta_loc: "Athens · Thessaloniki",
    hero_meta_since: "Since 1982",
    stat_brands: "Brands",
    stat_brands_v: "180+",
    stat_products: "Products",
    stat_products_v: "12k+",
    stat_years: "Years",
    stat_years_v: "44",
    stat_ship: "Shipping",
    stat_ship_v: "24h",
    stats_orders: "Orders shipped",
    stats_returns: "Returns",
    stats_rating: "Skroutz rating",
    stats_riders: "Riders",
    promise1_t: "Official Warranty",
    promise1_d: "Every item ships with full manufacturer cover.",
    promise2_t: "Free Shipping",
    promise2_d: "On every order over €50, anywhere in Greece.",
    promise3_t: "Same-Day Dispatch",
    promise3_d: "Order before 2pm on a weekday — it leaves today.",
    promise4_t: "Two Stores",
    promise4_d: "Athens and Thessaloniki — come try it on.",
    sec_cats_eyebrow: "Categories",
    sec_cats_h: "Pick where you start",
    sec_cats_meta: "8 main categories · 12,000+ products",
    sec_cats_all: "All categories",
    items_label: "ITEMS",
    sec_new_eyebrow: "New arrivals",
    sec_new_h: "Just landed",
    sec_new_meta: "May drops",
    sec_new_all: "All new arrivals",
    sec_house_eyebrow: "House brands",
    sec_house_h: "Made in",
    sec_house_h2: "Greece",
    sec_house_p:
      "Three in-house brands we design and stand behind. Because the gear that survives Kalambaki isn't the same as the gear that survives the Alps.",
    sec_find_eyebrow: "Find what fits",
    sec_find_h: "Tell us your",
    sec_find_h2: "bike.",
    sec_find_p:
      "Plug in what you ride and we'll filter the catalogue so you only see what mounts on your machine — cases, GPS, exhausts, screens.",
    find_year: "Year",
    find_make: "Make",
    find_model: "Model",
    find_engine: "Engine",
    find_cta: "Show me what fits",
    find_clear: "Clear",
    find_or: "or pick fast",
    sec_best_eyebrow: "Bestsellers",
    sec_best_h: "Flying off the shelves",
    sec_best_meta: "Last 30 days",
    sec_best_all: "All bestsellers",
    sec_heritage_eyebrow: "Since 1982",
    sec_heritage_h_pre: "Forty-four",
    sec_heritage_h_year: "years",
    sec_heritage_h_post: "by your side",
    sec_heritage_p:
      "We started as one shop in Kallithea. Today we're two physical stores, a warehouse and an eshop that ships to every corner of Greece. Same obsession — only now we can have it at your door in 24 hours.",
    sec_heritage_tag: "EST. 1982",
    sec_heritage_bottom_l: "Athens · Thessaloniki",
    sec_heritage_bottom_r: "Archive photo",
    sec_brands_title: "We carry the world's best motorcycle brands",
    nl_eyebrow: "Newsletter",
    nl_h: "Get ahead of the drop",
    nl_p: "New arrivals, drops, and subscriber-only deals — no spam, ever.",
    nl_placeholder: "Your email",
    nl_cta: "Subscribe",
    nl_perk1: "10% off your first order",
    nl_perk2: "First in line for sales",
    nl_perk3: "Unsubscribe anytime",
    foot_blurb:
      "Kitting out riders since 1982. Two stores in Greece, one eshop that ships everywhere.",
    foot_shop: "Shop",
    foot_help: "Help",
    foot_about: "Company",
    foot_contact: "Contact",
    stock_in: "In stock",
    stock_low: "Last pieces",
    sold_units: "sold this week",
    viewing_now: "viewing now",
    add_to_cart: "Add to cart",
    house_shop_all: "Shop all ",
  },
} satisfies Record<Lang, Record<string, string>>;

/* ─── Categories with photo mapping ─────────────────────────────── */
const CATEGORIES = [
  {
    id: "eksoplismos-anabath",
    num: "01",
    el: {
      sub: "ΚΡΑΝΗ · ΕΝΔΥΣΗ · ΜΠΟΤΕΣ · ΓΑΝΤΙΑ",
      title: "Εξοπλισμός αναβάτη",
    },
    en: { sub: "Helmets · Apparel · Boots · Gloves", title: "Rider Gear" },
    count: 2226,
    size: "lg",
    img: A.apparel,
  },
  {
    id: "eksoplismos-motosikletas",
    num: "02",
    el: {
      sub: "ΒΑΛΙΤΣΕΣ · ΕΞΑΤΜΙΣΕΙΣ · ΖΕΛΑΤΙΝΕΣ",
      title: "Εξοπλισμός μοτοσικλέτας",
    },
    en: { sub: "Luggage · Exhausts · Screens", title: "Bike Equipment" },
    count: 3761,
    size: "md",
    img: A.pTopCase,
  },
  {
    id: "off-road",
    num: "03",
    el: { sub: "MX · ENDURO · ΧΩΜΑ", title: "Off-Road" },
    en: { sub: "MX · Enduro · Dirt", title: "Off-Road" },
    count: 870,
    size: "md",
    img: A.gChain,
  },
  {
    id: "prosfores",
    num: "04",
    el: { sub: "ΕΚΠΤΩΣΕΙΣ · OUTLET", title: "Προσφορές" },
    en: { sub: "Sale · Outlet", title: "Offers" },
    count: 929,
    size: "sm",
    img: A.editorial,
  },
  {
    id: "lipantika",
    num: "05",
    el: { sub: "2T · 4T · CHAIN LUBES", title: "Λιπαντικά" },
    en: { sub: "2T · 4T · Chain Lubes", title: "Lubricants" },
    count: 126,
    size: "sm",
    img: A.exhaust,
  },
  {
    id: "aksesoyar",
    num: "06",
    el: { sub: "ΣΑΚΙΔΙΑ · ΓΥΑΛΙΑ · ΘΗΚΕΣ", title: "Αξεσουάρ" },
    en: { sub: "Bags · Goggles · Mounts", title: "Accessories" },
    count: 20,
    size: "sm",
    img: A.pBrakePads,
  },
  {
    id: "podhlatika",
    num: "07",
    el: { sub: "ΠΟΔΗΛΑΤΑ · E-BIKES", title: "Ποδηλατικά" },
    en: { sub: "Bicycles · e-Bikes", title: "Cycling" },
    count: 103,
    size: "sm",
    img: A.gTyresGuide,
  },
  {
    id: "my-bike",
    num: "08",
    el: { sub: "ΕΠΕΛΕΞΕ ΤΗ ΜΟΤΟ ΣΟΥ", title: "My Bike" },
    en: { sub: "Pick Your Bike", title: "My Bike" },
    count: 1,
    size: "sm",
    img: A.helmet,
  },
] as const;

/* ─── Featured products ─────────────────────────────────────────── */
type Product = {
  id: string;
  brand: string;
  el: { name: string; cat: string };
  en: { name: string; cat: string };
  price: number;
  oldPrice?: number;
  isSale?: boolean;
  isNew?: boolean;
  isHouse?: boolean;
  img: string;
  swatches?: string[];
};

const FEATURED: Product[] = [
  {
    id: "p-trip",
    brand: "CABERG",
    el: { name: "Trip Flip-Up — Ασημί ματ", cat: "Flip-up Κράνος" },
    en: { name: "Trip Flip-Up — Silver Matte", cat: "Flip-up Helmet" },
    price: 269.99,
    oldPrice: 299.99,
    isNew: true,
    isSale: true,
    img: A.pHelmetFront,
    swatches: ["#9a9d9f", "#0c0c0c", "#3a3a3a"],
  },
  {
    id: "p-ventu",
    brand: "RUKKA",
    el: { name: "Μπουφάν Ventu-R Adventure", cat: "Adventure Μπουφάν" },
    en: { name: "Ventu-R Adventure Jacket", cat: "Adventure Jacket" },
    price: 769.9,
    oldPrice: 849,
    isSale: true,
    img: A.apparel,
    swatches: ["#7a7a78", "#0c0c0c"],
  },
  {
    id: "p-nord-summer",
    brand: "NORDCODE",
    el: { name: "Μποτάκι Summer Mesh WP", cat: "Urban Sneaker" },
    en: { name: "Summer Mesh WP Boot", cat: "Urban Sneaker" },
    price: 99.9,
    isNew: true,
    isHouse: true,
    img: A.gBrakeInstall,
    swatches: ["#0c0c0c", "#5a5a5a"],
  },
  {
    id: "p-pilot-wing",
    brand: "PILOT",
    el: { name: "Wing RS Carbon Snake", cat: "Full-Face Carbon" },
    en: { name: "Wing RS Carbon Snake", cat: "Full-Face Carbon" },
    price: 289.9,
    oldPrice: 319.9,
    isSale: true,
    isHouse: true,
    img: A.helmet,
    swatches: ["#0c0c0c", "#1a1a1a"],
  },
];

const BESTSELLERS: Product[] = [
  {
    id: "p-pilot-fly",
    brand: "PILOT",
    el: { name: "Κράνος Fly SV — Άσπρο gloss", cat: "Jet Κράνος" },
    en: { name: "Fly SV — White Gloss", cat: "Jet Helmet" },
    price: 59.9,
    oldPrice: 69.9,
    isSale: true,
    isHouse: true,
    img: A.pHelmetFront,
  },
  {
    id: "p-givi",
    brand: "GIVI",
    el: { name: "Βαλίτσα ALP44A Alpina 44L", cat: "Κεντρική Βαλίτσα" },
    en: { name: "ALP44A Alpina Top Case 44L", cat: "Top Case" },
    price: 159.9,
    oldPrice: 179.9,
    isSale: true,
    img: A.pTopCase,
  },
  {
    id: "p-nord-citizen",
    brand: "NORDCODE",
    el: { name: "Μπουφάν Citizen Pro Μπλε", cat: "Χειμερινό Μπουφάν" },
    en: { name: "Citizen Pro Jacket Blue", cat: "Winter Jacket" },
    price: 139.9,
    oldPrice: 159.9,
    isSale: true,
    isHouse: true,
    img: A.apparel,
  },
  {
    id: "p-pirelli",
    brand: "PIRELLI",
    el: { name: "Diablo Rosso IV 120/70", cat: "Sport Ελαστικό" },
    en: { name: "Diablo Rosso IV 120/70", cat: "Sport Tyre" },
    price: 189.9,
    img: A.pSportTyre,
  },
  {
    id: "p-akrapovic",
    brand: "AKRAPOVIC",
    el: { name: "Slip-On Titanium", cat: "Εξάτμιση" },
    en: { name: "Slip-On Titanium", cat: "Exhaust" },
    price: 338.99,
    oldPrice: 399,
    isSale: true,
    img: A.pExhaustMuffler,
  },
  {
    id: "p-michelin",
    brand: "MICHELIN",
    el: { name: "Road 6 GT 180/55", cat: "Touring Ελαστικό" },
    en: { name: "Road 6 GT 180/55", cat: "Touring Tyre" },
    price: 176,
    img: A.pTourTyre,
  },
];

const HOUSE_BRANDS = [
  {
    id: "nordcode",
    name: "NORDCODE",
    el: {
      tag: "Apparel · 4-seasons",
      desc: "Σχεδιασμένο στη Θεσσαλονίκη, δοκιμασμένο στις Άλπεις. Adventure & touring.",
    },
    en: {
      tag: "Apparel · 4-seasons",
      desc: "Designed in Thessaloniki, tested in the Alps. Adventure & touring.",
    },
    img: A.apparel,
    featured: true,
  },
  {
    id: "pilot",
    name: "PILOT",
    el: {
      tag: "Κράνη · Race-bred",
      desc: "Από το paddock στον δρόμο. Carbon shells, ECE 22.06, ελληνική στήριξη.",
    },
    en: {
      tag: "Helmets · Race-bred",
      desc: "From paddock to street. Carbon shells, ECE 22.06, Greek support.",
    },
    img: A.helmet,
    featured: false,
  },
  {
    id: "fovos",
    name: "FOVOS",
    el: {
      tag: "Off-Road · Enduro",
      desc: "Για όσους ξέρουν πού πάνε όταν τελειώνει η άσφαλτος.",
    },
    en: { tag: "Off-Road · Enduro", desc: "For when the asphalt runs out." },
    img: A.exhaust,
    featured: false,
  },
];

const STORES = [
  {
    city: { el: "Αθήνα", en: "Athens" },
    addr: {
      el: "Καλλιθέα\nΛεωφ. Θησέως 210",
      en: "Kallithea\nThiseos Ave. 210",
    },
    phone: "210 95 17 150",
  },
  {
    city: { el: "Θεσσαλονίκη", en: "Thessaloniki" },
    addr: {
      el: "Σίνδος\n6ο χλμ Θεσ/νίκης — Έδεσσας",
      en: "Sindos\n6km Thessaloniki — Edessa",
    },
    phone: "2310 79 11 80",
  },
];

const BIKE_BRANDS = [
  "Yamaha",
  "Honda",
  "BMW",
  "KTM",
  "Ducati",
  "Triumph",
  "Suzuki",
  "Kawasaki",
  "Aprilia",
  "Husqvarna",
  "MV Agusta",
  "Royal Enfield",
  "Indian",
  "Harley",
  "Vespa",
  "Piaggio",
];
const MODELS_BY: Record<string, string[]> = {
  Yamaha: ["MT-07", "MT-09", "Tracer 9 GT", "Tenere 700", "R1", "R7", "XSR700"],
  Honda: ["Africa Twin 1100", "CBR650R", "CBR1000RR-R", "NC750X", "X-ADV"],
  BMW: ["R 1300 GS", "F 900 XR", "S 1000 RR", "R nineT", "G 310 GS"],
  KTM: ["390 Duke", "890 Adventure R", "1290 Super Duke R", "EXC-F 350"],
  Ducati: ["Multistrada V4", "Panigale V4", "Monster 937", "DesertX"],
  Triumph: ["Tiger 900", "Speed Triple 1200 RS", "Trident 660"],
};

const CARRIED_BRANDS = [
  "SHOEI",
  "ARAI",
  "AGV",
  "SCHUBERTH",
  "HJC",
  "CABERG",
  "AIROH",
  "MT",
  "ALPINESTARS",
  "DAINESE",
  "REV'IT!",
  "RUKKA",
  "KLIM",
  "GIVI",
  "KAPPA",
  "SHAD",
  "BERIK",
  "FORMA",
  "GAERNE",
  "TCX",
  "SIDI",
  "BREMBO",
  "PIRELLI",
  "MICHELIN",
  "AKRAPOVIC",
  "DOMINO",
  "QUAD LOCK",
  "GARMIN",
  "CARDO",
  "SENA",
];

/* ─── Four Seasons ─────────────────────────────── */
const SEASONS = [
  {
    id: "spring",
    temp: "12-22°C",
    el: {
      label: "Άνοιξη",
      months: "Μάρ — Μάι",
      h: "Mesh + αδιάβροχο σε ένα",
      p: "Μεταβλητός καιρός. Αερισμός με υπόσχεση ότι αν χτυπήσει σύννεφο, μένεις στεγνός.",
      kit: [
        "Mesh μπουφάν με WP liner",
        "Touring γάντια ¾",
        "Adventure WP μπότα",
        "Modular κράνος",
      ],
    },
    en: {
      label: "Spring",
      months: "Mar — May",
      h: "Mesh + waterproof in one",
      p: "Variable weather. Ventilation with the promise that when the cloud hits, you stay dry.",
      kit: [
        "Mesh jacket with WP liner",
        "Touring 3/4 gloves",
        "WP adventure boot",
        "Modular helmet",
      ],
    },
    color: "#5ec47b",
  },
  {
    id: "summer",
    temp: "28-40°C",
    el: {
      label: "Καλοκαίρι",
      months: "Ιούν — Αύγ",
      h: "Αερισμός χωρίς συμβιβασμό",
      p: "40°C στην άσφαλτο. Mesh παντού, αλλά CE Level 2 — γιατί η ζέστη δεν είναι δικαιολογία.",
      kit: [
        "Full-mesh racing μπουφάν",
        "Perforated γάντια",
        "Vented sport boots",
        "Open-face + γυαλιά",
      ],
    },
    en: {
      label: "Summer",
      months: "Jun — Aug",
      h: "Ventilation, no compromise",
      p: "40°C asphalt. Mesh everywhere, but still CE Level 2 — heat isn't an excuse.",
      kit: [
        "Full-mesh racing jacket",
        "Perforated gloves",
        "Vented sport boots",
        "Open-face + goggles",
      ],
    },
    color: "#f5b324",
  },
  {
    id: "autumn",
    temp: "8-22°C",
    el: {
      label: "Φθινόπωρο",
      months: "Σεπ — Νοέ",
      h: "Layering. Πάντα layering.",
      p: "Πρωί 8°C, μεσημέρι 22°C, βράδυ βροχή. Ένα ντύσιμο για όλα.",
      kit: [
        "3-layer adventure",
        "Heated grips kit",
        "Touring WP boots",
        "Full-face + Pinlock",
      ],
    },
    en: {
      label: "Autumn",
      months: "Sep — Nov",
      h: "Layering. Always.",
      p: "Morning 8°C, noon 22°C, evening rain. One kit for everything.",
      kit: [
        "3-layer adventure",
        "Heated grips kit",
        "Touring WP boots",
        "Full-face + Pinlock",
      ],
    },
    color: "#e8412a",
  },
  {
    id: "winter",
    temp: "0-12°C",
    el: {
      label: "Χειμώνας",
      months: "Δεκ — Φεβ",
      h: "Χιόνι Καλάβρυτα · βροχή Πλάκα",
      p: "Όχι αστείο. Heated grips, thermal liners, electric vest για Άλπεις.",
      kit: [
        "Thermal touring suit",
        "Heated gloves Cardo",
        "Gore-Tex μπότες",
        "Modular + balaclava",
      ],
    },
    en: {
      label: "Winter",
      months: "Dec — Feb",
      h: "Snow at Kalavryta",
      p: "Not joking. Heated grips, thermal liners, electric vest for the Alps.",
      kit: [
        "Thermal touring suit",
        "Heated gloves (Cardo)",
        "Gore-Tex boots",
        "Modular + balaclava",
      ],
    },
    color: "#7aa0e8",
  },
];

/* ─── Kit Builder ─────────────────────────────── */
type KitItem = {
  id: string;
  brand: string;
  el: string;
  en: string;
  price: number;
  oldPrice?: number;
  img: string;
};
const KIT: Record<string, KitItem[]> = {
  helmet: [
    {
      id: "k-pilot-wing",
      brand: "PILOT",
      el: "Wing RS Carbon",
      en: "Wing RS Carbon",
      price: 289.9,
      oldPrice: 319.9,
      img: A.helmet,
    },
    {
      id: "k-shoei",
      brand: "SHOEI",
      el: "NXR2 Plain Black",
      en: "NXR2 Plain Black",
      price: 489,
      img: A.pHelmetFront,
    },
    {
      id: "k-caberg",
      brand: "CABERG",
      el: "Trip Flip-up Silver",
      en: "Trip Flip-up Silver",
      price: 269.99,
      oldPrice: 299.99,
      img: A.pHelmetFront,
    },
  ],
  jacket: [
    {
      id: "k-rukka-ventu",
      brand: "RUKKA",
      el: "Ventu-R Adventure",
      en: "Ventu-R Adventure",
      price: 769.9,
      oldPrice: 849,
      img: A.apparel,
    },
    {
      id: "k-nordcode-cit",
      brand: "NORDCODE",
      el: "Citizen Pro Blue",
      en: "Citizen Pro Blue",
      price: 139.9,
      oldPrice: 159.9,
      img: A.apparel,
    },
    {
      id: "k-revit-tornado",
      brand: "REV'IT!",
      el: "Tornado 4 H2O",
      en: "Tornado 4 H2O",
      price: 329,
      img: A.apparel,
    },
  ],
  pants: [
    {
      id: "k-revit-ignition",
      brand: "REV'IT!",
      el: "Ignition 4",
      en: "Ignition 4",
      price: 449,
      img: A.apparel,
    },
    {
      id: "k-nordcode-tour",
      brand: "NORDCODE",
      el: "Touring WP",
      en: "Touring WP",
      price: 199.9,
      img: A.apparel,
    },
    {
      id: "k-klim-induction",
      brand: "KLIM",
      el: "Induction",
      en: "Induction",
      price: 379,
      img: A.apparel,
    },
  ],
  gloves: [
    {
      id: "k-alp-sp8",
      brand: "ALPINESTARS",
      el: "SP-8 v3",
      en: "SP-8 v3",
      price: 129,
      img: A.editorial,
    },
    {
      id: "k-dainese",
      brand: "DAINESE",
      el: "Carbon 4 Long",
      en: "Carbon 4 Long",
      price: 269,
      img: A.editorial,
    },
    {
      id: "k-revit-fly",
      brand: "REV'IT!",
      el: "Fly 4",
      en: "Fly 4",
      price: 89.9,
      img: A.editorial,
    },
  ],
  boots: [
    {
      id: "k-forma-adv",
      brand: "FORMA",
      el: "Adventure Low WP",
      en: "Adventure Low WP",
      price: 279,
      img: A.editorial,
    },
    {
      id: "k-gaerne",
      brand: "GAERNE",
      el: "SG-22 Racing",
      en: "SG-22 Racing",
      price: 449,
      img: A.editorial,
    },
    {
      id: "k-tcx",
      brand: "TCX",
      el: "Street Ace WP",
      en: "Street Ace WP",
      price: 189,
      img: A.editorial,
    },
  ],
};
const KIT_STEPS = ["helmet", "jacket", "pants", "gloves", "boots"] as const;
type KitStep = (typeof KIT_STEPS)[number];

/* ─── Heritage Timeline ─────────────────────────────── */
const TIMELINE = [
  {
    year: "1982",
    el: {
      h: "Καλλιθέα — Το πρώτο μαγαζί",
      p: "Δύο αδέρφια, ένα κελί 40m², και μια εμμονή με τον σωστό εξοπλισμό.",
    },
    en: {
      h: "Kallithea — The first shop",
      p: "Two brothers, a 40m² unit, and an obsession with the right gear.",
    },
  },
  {
    year: "1995",
    el: {
      h: "Άνοιγμα στη Θεσσαλονίκη",
      p: "Σίνδος, 6ο χλμ. Ένα ακόμα μαγαζί. Βορράς και νότος.",
    },
    en: {
      h: "Opening in Thessaloniki",
      p: "Sindos, 6km. Another store. North and south.",
    },
  },
  {
    year: "2008",
    el: {
      h: "Το eshop ξεκινάει",
      p: "Πρώτη online αγορά. Αποστολή σε όλη την Ελλάδα από το πρώτο 24ωρο.",
    },
    en: {
      h: "The eshop launches",
      p: "First online order. Shipping nationwide from day one.",
    },
  },
  {
    year: "2014",
    el: {
      h: "Γεννιέται το NORDCODE",
      p: "Πρώτο in-house brand. Σχεδιασμένο εδώ, για τους ρυθμούς εδώ.",
    },
    en: {
      h: "NORDCODE is born",
      p: "First in-house brand. Designed here, for the rhythms here.",
    },
  },
  {
    year: "2026",
    el: {
      h: "44 χρόνια, ίδια εμμονή",
      p: "240k+ παραγγελίες. 44k αναβάτες. Δύο φυσικά καταστήματα. Ίδιο πάθος.",
    },
    en: {
      h: "44 years, same obsession",
      p: "240k+ orders. 44k riders. Two physical stores. Same passion.",
    },
  },
];

/* ─── Journal & Community ─────────────────────────────── */
const JOURNAL = [
  {
    id: "j-helmet",
    el: {
      tag: "BUYER GUIDE",
      h: "Πώς διαλέγω κράνος Adventure",
      excerpt:
        "Modular vs full-face, αερισμός, Pinlock. Όλα όσα χρειάζεσαι πριν δώσεις 400€.",
    },
    en: {
      tag: "BUYER GUIDE",
      h: "Choosing an Adventure helmet",
      excerpt:
        "Modular vs full-face, ventilation, Pinlock. Everything before dropping €400.",
    },
    author: { el: "Νίκος Π.", en: "Nikos P." },
    read: 10,
    img: A.helmet,
  },
  {
    id: "j-tenere",
    el: {
      tag: "FIELD TEST",
      h: "1000 χλμ με Tenere 700",
      excerpt: "Από Αθήνα στα Ζαγοροχώρια. Τι λειτούργησε, τι θα άλλαζα.",
    },
    en: {
      tag: "FIELD TEST",
      h: "1000 km on a Tenere 700",
      excerpt: "Athens to Zagori. What worked, what I'd change.",
    },
    author: { el: "Δημήτρης Α.", en: "Dimitris A." },
    read: 14,
    img: A.editorial,
  },
  {
    id: "j-givi",
    el: {
      tag: "COMPARISON",
      h: "Givi vs Kappa — Top cases",
      excerpt:
        "Δύο κορυφαία ονόματα. Βαλβίδες, χωρητικότητα, τιμή. Ποιο κερδίζει;",
    },
    en: {
      tag: "COMPARISON",
      h: "Givi vs Kappa — Top cases",
      excerpt: "Two top names. Latches, capacity, price. Who wins?",
    },
    author: { el: "Ελένη Κ.", en: "Eleni K." },
    read: 8,
    img: A.pTopCase,
  },
  {
    id: "j-tyre",
    el: {
      tag: "FIELD NOTES",
      h: "Sport vs Sport-Touring ελαστικά",
      excerpt:
        "Σύγκριση από βροχή, ζέστη, 800 χλμ συνολικά. Που κερδίζει το ένα, που το άλλο.",
    },
    en: {
      tag: "FIELD NOTES",
      h: "Sport vs Sport-Touring tyres",
      excerpt: "Comparison through rain, heat, 800 km. Where each one wins.",
    },
    author: { el: "Γιώργος Μ.", en: "Giorgos M." },
    read: 12,
    img: A.pSportTyre,
  },
];

const COMMUNITY = [
  { id: "c1", wide: true, handle: "@nikos.rides", img: A.editorial },
  { id: "c2", wide: false, handle: "@maria_athens", img: A.apparel },
  { id: "c3", wide: false, handle: "@thessmoto", img: A.helmet },
  { id: "c4", wide: false, handle: "@kte_adventure", img: A.gChain },
  { id: "c5", wide: false, handle: "@iliad.rider", img: A.pSportTyre },
  { id: "c6", wide: true, handle: "@meteora_loop", img: A.editorial },
  { id: "c7", wide: false, handle: "@gpr_garage", img: A.pBrakePads },
  { id: "c8", wide: false, handle: "@andros_rides", img: A.exhaust },
];

/* Per-root hero image for the mega-menu "browse all" card. */
const ROOT_IMG: Record<string, string> = {
  "eksoplismos-anabath": A.apparel,
  "eksoplismos-motosikletas": A.pTopCase,
  "off-road": A.gChain,
  podhlatika: A.gTyresGuide,
  lipantika: A.exhaust,
  "my-bike": A.helmet,
  prosfores: A.editorial,
};

/* ════════════════════════════════════════════════════════════════════
   PAGE
   ════════════════════════════════════════════════════════════════════ */
type CartLine = Product & { qty: number };

/* ════════════════════════════════════════════════════════════════════
   MMContext — shared state for all pages that use <MMShell>
   ════════════════════════════════════════════════════════════════════ */
type MMContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  mode: "dark" | "light";
  setMode: (m: "dark" | "light") => void;
  t: T;
  cart: CartLine[];
  addToCart: (p: Product) => void;
  addBundle: (items: Product[], discount: number) => void;
  updateCart: (id: string, qty: number) => void;
  removeCart: (id: string) => void;
  wishlist: string[];
  toggleWish: (id: string) => void;
  compare: Product[];
  toggleCompare: (p: Product) => void;
  quickView: Product | null;
  setQuickView: (p: Product | null) => void;
  openCart: () => void;
  openSearch: () => void;
  openWish: () => void;
  showToast: (msg: string) => void;
};

const MMContext = createContext<MMContextValue | null>(null);

export function useMM(): MMContextValue {
  const ctx = useContext(MMContext);
  if (!ctx) throw new Error("useMM must be used inside <MMShell>");
  return ctx;
}

/* Re-exports for pages that need types/data */
export type { Lang, T, Product, CartLine };
export {
  I18N,
  CATEGORIES,
  BIKE_BRANDS,
  MODELS_BY,
  CARRIED_BRANDS,
  STORES,
  A as ASSETS,
};

export default function MMShell({
  mode: initialMode = "dark",
  children,
}: {
  mode?: "dark" | "light";
  children?: React.ReactNode;
}) {
  const [lang, setLang] = useState<Lang>("el");
  const [mode, setMode] = useState<"dark" | "light">(initialMode);
  const t = I18N[lang];

  /* Restore mode preference from localStorage on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("mm-mode");
      if (saved === "dark" || saved === "light") setMode(saved);
    } catch {
      /* localStorage unavailable */
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("mm-mode", mode);
    } catch {
      /* noop */
    }
  }, [mode]);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compare, setCompare] = useState<Product[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({
    show: false,
    msg: "",
  });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    setToast({ show: true, msg });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(
      () => setToast((s) => ({ ...s, show: false })),
      2200,
    );
  };

  const addToCart = (p: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((it) => it.id === p.id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { ...p, qty: 1 }];
    });
    showToast((lang === "el" ? "Προστέθηκε · " : "Added · ") + p.brand);
  };
  const addBundle = (items: Product[], discount: number) => {
    setCart((prev) => {
      const next = [...prev];
      items.forEach((it) => {
        const ix = next.findIndex((x) => x.id === it.id);
        if (ix >= 0) next[ix] = { ...next[ix], qty: next[ix].qty + 1 };
        else next.push({ ...it, qty: 1 });
      });
      return next;
    });
    showToast(
      (lang === "el" ? "Kit στο καλάθι · −€" : "Kit added · −€") +
        discount.toFixed(0),
    );
    setCartOpen(true);
  };
  const updateCart = (id: string, qty: number) =>
    setCart((prev) => prev.map((x) => (x.id === id ? { ...x, qty } : x)));
  const removeCart = (id: string) =>
    setCart((prev) => prev.filter((x) => x.id !== id));
  const toggleWish = (id: string) => {
    setWishlist((prev) => {
      if (prev.includes(id)) {
        showToast(
          lang === "el" ? "Αφαιρέθηκε από αγαπημένα" : "Removed from wishlist",
        );
        return prev.filter((x) => x !== id);
      }
      showToast(lang === "el" ? "Στα αγαπημένα" : "Added to wishlist");
      return [...prev, id];
    });
  };
  const toggleCompare = (p: Product) => {
    setCompare((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      if (exists) return prev.filter((x) => x.id !== p.id);
      if (prev.length >= 3) {
        showToast(lang === "el" ? "Έως 3 προϊόντα" : "Up to 3 items");
        return prev;
      }
      showToast(lang === "el" ? "Στη σύγκριση" : "Added to compare");
      return [...prev, p];
    });
  };

  /* Lock body scroll when overlay open */
  useEffect(() => {
    const lock = cartOpen || searchOpen || !!quickView;
    document.body.style.overflow = lock ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [cartOpen, searchOpen, quickView]);

  const cartCount = cart.reduce((n, it) => n + it.qty, 0);
  const handlers = {
    onQuickView: setQuickView,
    onAdd: addToCart,
    wishlist,
    onWish: toggleWish,
    compare,
    onCompare: toggleCompare,
  };

  return (
    <div
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
      data-mode={mode}
      data-palette="red"
    >
      <Styles />
      <TopBar
        t={t}
        lang={lang}
        setLang={setLang}
        mode={mode}
        setMode={setMode}
      />
      <MainNav
        t={t}
        lang={lang}
        cartCount={cartCount}
        wishCount={wishlist.length}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenCart={() => setCartOpen(true)}
        onOpenWish={() =>
          showToast(
            `${wishlist.length} ${lang === "el" ? "στα αγαπημένα" : "in wishlist"}`,
          )
        }
      />
      <MMContext.Provider
        value={{
          lang,
          setLang,
          mode,
          setMode,
          t,
          cart,
          addToCart,
          addBundle,
          updateCart,
          removeCart,
          wishlist,
          toggleWish,
          compare,
          toggleCompare,
          quickView,
          setQuickView,
          openCart: () => setCartOpen(true),
          openSearch: () => setSearchOpen(true),
          openWish: () =>
            showToast(
              `${wishlist.length} ${lang === "el" ? "στα αγαπημένα" : "in wishlist"}`,
            ),
          showToast,
        }}
      >
        <div className="mm-root mm-shellbody">{children}</div>
      </MMContext.Provider>
      <Footer t={t} lang={lang} />
      <MobileBottomNav
        lang={lang}
        cartCount={cartCount}
        wishCount={wishlist.length}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenCart={() => setCartOpen(true)}
        onOpenWish={() =>
          showToast(
            `${wishlist.length} ${lang === "el" ? "στα αγαπημένα" : "in wishlist"}`,
          )
        }
      />

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        lang={lang}
        onUpdate={updateCart}
        onRemove={removeCart}
      />
      <QuickView
        product={quickView}
        onClose={() => setQuickView(null)}
        lang={lang}
        onAdd={(p) => {
          addToCart(p);
          setQuickView(null);
        }}
        wishlist={wishlist}
        onWish={toggleWish}
      />
      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        lang={lang}
        onPickProduct={(p) => setQuickView(p)}
      />
      <Toast msg={toast.msg} show={toast.show} />
      <CompareBar
        items={compare}
        lang={lang}
        onRemove={(id) => setCompare((prev) => prev.filter((x) => x.id !== id))}
        onClear={() => setCompare([])}
      />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   GLOBAL STYLES (CSS injected for the preview route)
   ════════════════════════════════════════════════════════════════════ */
function Styles() {
  return (
    <style>{`
      :root {
        --ink: #0a0908;
        --ink-2: #14110f;
        --ink-3: #1d1916;
        --hair: rgba(241, 237, 228, 0.10);
        --hair-strong: rgba(241, 237, 228, 0.22);
        --bone: #f1ede4;
        --bone-2: #e6e1d4;
        --muted: #8a857a;
        --muted-2: #5a564f;
        --accent: #e8412a;
        --accent-ink: #ffffff;
        --amber: #f5b324;
        --green: #5ec47b;
        --display: var(--mm-display), "Anton", "Arial Narrow", system-ui;
        --sans: var(--mm-sans), system-ui, sans-serif;
        --mono: var(--mm-mono), ui-monospace, monospace;
        --ease: cubic-bezier(.2,.7,.2,1);
        --gutter: clamp(20px, 3.5vw, 56px);
      }

      /* ───────── LIGHT MODE — open warm canvas ───────── */
      [data-mode="light"] {
        --ink: #f5f1e8;          /* warm bone bg */
        --ink-2: #ebe6da;        /* surface */
        --ink-3: #ddd6c5;        /* elevated */
        --hair: rgba(10, 9, 8, 0.10);
        --hair-strong: rgba(10, 9, 8, 0.22);
        --bone: #14110f;         /* near-black ink for text */
        --bone-2: #2a2520;
        --muted: #6a655c;
        --muted-2: #8a857a;
        --accent: #c8341f;       /* slightly deeper red for white-bg readability */
        --amber: #c98a18;        /* warmer hazard for light bg */
      }
      /* Specific overlays that hard-coded dark rgba values — flip on light mode */
      [data-mode="light"] .mm-nav { background: rgba(245,241,232,0.92); }
      [data-mode="light"] .mm-hero__bg img { filter: contrast(1.05) brightness(0.85); opacity: 0.7; }
      [data-mode="light"] .mm-hero__chip { background: rgba(245,241,232,0.7); }
      [data-mode="light"] .mm-hero__vignette { background: radial-gradient(ellipse at center, transparent 30%, rgba(245,241,232,0.85) 100%); }
      [data-mode="light"] .mm-grain { mix-blend-mode: multiply; opacity: 0.18; }
      [data-mode="light"] .mm-scanlines { opacity: 0.06; background: repeating-linear-gradient(to bottom, transparent 0, transparent 2px, rgba(10,9,8,0.18) 2px, rgba(10,9,8,0.18) 3px); }
      [data-mode="light"] .mm-cat__overlay { background: linear-gradient(180deg, rgba(245,241,232,0.15) 0%, rgba(245,241,232,0.65) 100%); }
      [data-mode="light"] .mm-cat__img img { filter: brightness(0.92) contrast(1.05); }
      [data-mode="light"] .mm-product__sold { background: rgba(245,241,232,0.85); color: var(--bone); }
      [data-mode="light"] .mm-product__wish, [data-mode="light"] .mm-product__cmp { background: rgba(245,241,232,0.7); color: var(--bone); }
      [data-mode="light"] .mm-product__wish:hover, [data-mode="light"] .mm-product__wish.is-on, [data-mode="light"] .mm-product__cmp:hover, [data-mode="light"] .mm-product__cmp.is-on { background: var(--accent); color: #fff; }
      [data-mode="light"] .mm-product__quick { background: var(--bone); color: var(--ink); }
      [data-mode="light"] .mm-badge--new { background: var(--bone); color: var(--ink); }
      [data-mode="light"] .mm-iconbtn__badge { color: #fff; }
      [data-mode="light"] .mm-brand-card__bg img { filter: contrast(1.05) brightness(0.85); }
      [data-mode="light"] .mm-brand-card__bg { opacity: 0.42; }
      [data-mode="light"] .mm-mobnav { background: rgba(245,241,232,0.96); }
      [data-mode="light"] .mm-toast { background: var(--bone); color: var(--ink-2); }
      [data-mode="light"] .mm-toast .dot { color: var(--accent); }
      [data-mode="light"] .mm-brand__logo { color: #fff; }
      [data-mode="light"] .mm-promise { background: var(--ink); }
      [data-mode="light"] .mm-seasons__lab { background: rgba(245,241,232,0.85); color: var(--bone); }
      [data-mode="light"] .mm-kit__step.is-active { background: var(--ink-3); border-color: var(--accent); }
      [data-mode="light"] .mm-kit__step:hover { background: var(--ink-3); }
      [data-mode="light"] .mm-kit__opt-media .dot { background: rgba(245,241,232,0.85); color: var(--bone); }
      [data-mode="light"] .mm-timeline__yr.is-on::before { box-shadow: 0 0 0 3px rgba(200,52,31,0.18); }
      [data-mode="light"] .mm-journal__tag { background: var(--accent); color: #fff; }
      [data-mode="light"] .mm-community__tile img { filter: brightness(1) contrast(1.05); }
      [data-mode="light"] .mm-community__tile:hover img { filter: brightness(0.9); }
      [data-mode="light"] .mm-scrim { background: rgba(10,9,8,0.4); }
      [data-mode="light"] .mm-search { background: rgba(245,241,232,0.96); }
      [data-mode="light"] .mm-modal__close, [data-mode="light"] .mm-drawer__close { color: var(--bone); }
      [data-mode="light"] .mm-modal__close:hover, [data-mode="light"] .mm-drawer__close:hover { background: var(--ink-3); }
      [data-mode="light"] .mm-cmpbar__slot .x:hover { color: #fff; }
      [data-mode="light"] .mm-iconbtn:hover { background: var(--ink-3); }
      [data-mode="light"] .mm-findbike__brands button:hover { color: #fff; }

      .mm-root { font-family: var(--sans); background: var(--ink); color: var(--bone); font-size: 15px; line-height: 1.45; -webkit-font-smoothing: antialiased; }
      .mm-root *, .mm-root *::before, .mm-root *::after { box-sizing: border-box; }
      .mm-root a { color: inherit; text-decoration: none; }
      .mm-root button { font: inherit; color: inherit; background: none; border: 0; padding: 0; cursor: pointer; }
      .mm-root ::selection { background: var(--accent); color: var(--accent-ink); }
      .mm-display { font-family: var(--display); font-weight: 800; letter-spacing: -0.01em; line-height: 0.86; text-transform: uppercase; }
      .mm-mono { font-family: var(--mono); }
      .mm-container { width: 100%; max-width: 1680px; padding-inline: var(--gutter); margin-inline: auto; }
      .mm-eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); display: inline-flex; align-items: center; gap: 8px; }
      .mm-eyebrow::before { content: ""; width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
      .mm-btn { display: inline-flex; align-items: center; gap: 10px; padding: 14px 22px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; border-radius: 4px; transition: all 180ms var(--ease); cursor: pointer; }
      .mm-btn--primary { background: var(--accent); color: var(--accent-ink); }
      .mm-btn--primary:hover { background: #ff5538; transform: translateY(-1px); }
      .mm-btn--ghost { color: var(--bone); border: 1px solid var(--hair-strong); }
      .mm-btn--ghost:hover { background: var(--ink-3); border-color: var(--bone); }
      .mm-hairline { border-top: 1px solid var(--hair); }

      /* ───────── TOPBAR ───────── */
      .mm-topbar { background: var(--ink-2); border-bottom: 1px solid var(--hair); font-family: var(--mono); font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--muted); }
      .mm-topbar__row { display: flex; align-items: center; justify-content: space-between; gap: 24px; height: 36px; }
      .mm-topbar__left, .mm-topbar__right { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
      .mm-topbar__phone { color: var(--bone); display: inline-flex; align-items: center; gap: 8px; }
      .mm-topbar__phone-dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; box-shadow: 0 0 0 3px rgba(94,196,123,0.18); animation: mm-pulse 2s ease-in-out infinite; }
      @keyframes mm-pulse { 0%,100% { box-shadow: 0 0 0 3px rgba(94,196,123,0.18); } 50% { box-shadow: 0 0 0 6px rgba(94,196,123,0.06); } }
      .mm-sep { opacity: 0.5; }
      .mm-lang { display: inline-flex; border: 1px solid var(--hair-strong); border-radius: 999px; padding: 2px; }
      .mm-lang button { padding: 2px 10px; border-radius: 999px; color: var(--muted); font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; transition: all 180ms var(--ease); }
      .mm-lang button[aria-pressed="true"] { background: var(--bone); color: var(--ink); }
      .mm-mode { display: inline-flex; border: 1px solid var(--hair-strong); border-radius: 999px; padding: 2px; gap: 0; }
      .mm-mode button { padding: 2px 10px; border-radius: 999px; color: var(--muted); font-size: 12px; line-height: 14px; transition: all 180ms var(--ease); }
      .mm-mode button[aria-pressed="true"] { background: var(--accent); color: #fff; }

      /* ───────── MAIN NAV ───────── */
      .mm-nav { position: sticky; top: 0; z-index: 50; background: rgba(10,9,8,0.85); backdrop-filter: blur(12px); border-bottom: 1px solid var(--hair); }
      .mm-nav__row { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 32px; height: 72px; }
      .mm-brand { display: flex; align-items: center; gap: 12px; }
      .mm-brand__logo { width: 38px; height: 38px; display: grid; place-items: center; background: var(--accent); color: white; font-family: var(--display); font-weight: 900; font-size: 22px; border-radius: 6px; }
      .mm-brand__name { font-family: var(--display); font-weight: 800; font-size: 22px; line-height: 1; letter-spacing: 0.02em; }
      .mm-brand__sub { font-family: var(--mono); font-size: 9px; letter-spacing: 0.18em; color: var(--muted); text-transform: uppercase; margin-top: 2px; }
      .mm-links { display: flex; align-items: center; gap: 4px; justify-self: center; }
      .mm-links button, .mm-links > a { position: relative; padding: 8px 14px; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600; border-radius: 4px; display: inline-flex; align-items: center; gap: 6px; transition: color 180ms var(--ease); cursor: pointer; color: var(--bone); text-decoration: none; background: transparent; border: 0; }
      .mm-links button::after, .mm-links > a::after { content: ""; position: absolute; left: 14px; right: 14px; bottom: 4px; height: 2px; background: var(--accent); transform: scaleX(0); transform-origin: left; transition: transform 320ms var(--ease); }
      .mm-links button:hover::after, .mm-links > a:hover::after { transform: scaleX(1); }
      .mm-links button[data-sale="1"], .mm-links > a[data-sale="1"] { color: var(--accent); }
      .mm-links button.is-on, .mm-links > a.is-on { color: var(--accent); }
      .mm-actions { display: flex; align-items: center; gap: 6px; }
      .mm-iconbtn { position: relative; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 6px; transition: background 180ms var(--ease); }
      .mm-iconbtn:hover { background: var(--ink-3); }
      .mm-iconbtn__badge { position: absolute; top: 6px; right: 6px; min-width: 16px; height: 16px; padding: 0 4px; background: var(--accent); color: white; font-family: var(--mono); font-size: 9px; font-weight: 700; border-radius: 8px; display: grid; place-items: center; }

      /* ───────── MEGA MENU ───────── */
      .mm-mega { position: absolute; left: 0; right: 0; top: 100%; background: var(--ink); border-top: 1px solid var(--hair); border-bottom: 1px solid var(--hair); z-index: 40; animation: mm-megain 280ms var(--ease); box-shadow: 0 24px 60px rgba(0,0,0,0.45); }
      [data-mode="light"] .mm-mega { box-shadow: 0 24px 60px rgba(10,9,8,0.12); }
      @keyframes mm-megain { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      .mm-mega__inner { display: grid; grid-template-columns: repeat(4, 1fr) 1.2fr; gap: 40px; padding: 36px var(--gutter); align-items: start; }
      @media (max-width: 1100px) { .mm-mega__inner { grid-template-columns: repeat(2, 1fr); } .mm-mega__feature { grid-column: span 2; } }
      @media (max-width: 700px) { .mm-mega { display: none; } /* hidden on small screens — uses mobile bottom nav */ }
      .mm-mega__col h4 { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin: 0 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--hair); }
      .mm-mega__col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
      .mm-mega__col ul a { font-size: 14px; color: var(--bone); transition: color 180ms var(--ease); display: inline-block; position: relative; }
      .mm-mega__col ul a:hover { color: var(--accent); transform: translateX(4px); }
      .mm-mega__feature { position: relative; background: var(--ink-2); border: 1px solid var(--hair); padding: 18px; min-height: 240px; display: flex; flex-direction: column; justify-content: flex-end; gap: 8px; overflow: hidden; transition: border-color 180ms var(--ease); }
      .mm-mega__feature:hover { border-color: var(--accent); }
      .mm-mega__feature-img { position: absolute; inset: 0; opacity: 0.35; }
      .mm-mega__feature-img img { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.05) brightness(0.85); }
      .mm-mega__feature .tag { position: relative; font-family: var(--mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
      .mm-mega__feature h3 { position: relative; font-family: var(--display); font-weight: 800; font-size: 20px; line-height: 1.05; letter-spacing: -0.01em; text-transform: uppercase; margin: 0; color: var(--bone); }
      .mm-mega__feature .link { position: relative; font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--bone); display: inline-flex; align-items: center; gap: 6px; margin-top: 4px; }
      .mm-mega__inner--flat { grid-template-columns: 3fr 1.1fr; gap: 40px; padding: 36px var(--gutter); }
      @media (max-width: 1100px) { .mm-mega__inner--flat { grid-template-columns: 1fr; } }
      .mm-mega__list { columns: 4; column-gap: 32px; column-rule: 1px solid var(--hair); }
      @media (max-width: 1100px) { .mm-mega__list { columns: 2; } }
      .mm-mega__list a { display: block; padding: 8px 0; font-size: 14px; color: var(--bone); line-height: 1.35; transition: color 180ms var(--ease), transform 180ms var(--ease); break-inside: avoid; text-decoration: none; }
      .mm-mega__list a:hover { color: var(--accent); transform: translateX(4px); }
      .mm-mega__seeall { position: relative; background: var(--ink-2); border: 1px solid var(--hair); padding: 24px; min-height: 220px; display: flex; flex-direction: column; justify-content: flex-end; gap: 10px; transition: border-color 180ms var(--ease); text-decoration: none; }
      .mm-mega__seeall:hover { border-color: var(--accent); }
      .mm-mega__seeall .tag { font-family: var(--mono); font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); font-weight: 700; }
      .mm-mega__seeall h3 { font-family: var(--display); font-weight: 800; font-size: 22px; line-height: 1.05; letter-spacing: -0.01em; text-transform: uppercase; margin: 0; color: var(--bone); }
      .mm-mega__seeall .link { position: relative; z-index: 1; font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--bone); display: inline-flex; align-items: center; gap: 6px; margin-top: 4px; }
      .mm-mega__seeall .tag, .mm-mega__seeall h3 { position: relative; z-index: 1; }
      .mm-mega__seeall-img { position: absolute; inset: 0; opacity: 0.32; z-index: 0; }
      .mm-mega__seeall-img img { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.05) brightness(0.8); }
      .mm-mega__cols { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 24px 28px; align-content: start; max-height: 62vh; overflow-y: auto; }
      .mm-mega__cols .mm-mega__col h4 { margin: 0 0 12px; }
      .mm-mega__cols .mm-mega__col h4 a { font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); text-decoration: none; transition: color 180ms var(--ease); }
      .mm-mega__cols .mm-mega__col h4 a:hover { color: var(--accent); }
      .mm-mega__cols .mm-mega__col ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
      .mm-mega__cols .mm-mega__col ul a { font-size: 13.5px; color: var(--bone); text-decoration: none; transition: color 180ms var(--ease), transform 180ms var(--ease); display: inline-block; }
      .mm-mega__cols .mm-mega__col ul a:hover { color: var(--accent); transform: translateX(3px); }
      .mm-mega__more { color: var(--muted) !important; font-family: var(--mono); font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; }
      .mm-mega__more:hover { color: var(--accent) !important; }
      .mm-mega__loading { color: var(--muted); font-family: var(--mono); font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; padding: 24px 0; display: inline-block; }
      @media (max-width: 1200px) { .mm-links button, .mm-links > a { padding: 8px 9px; font-size: 11px; } }
      @media (max-width: 1024px) { .mm-nav__row { gap: 16px; } .mm-links { gap: 0; } .mm-links button, .mm-links > a { padding: 8px 7px; font-size: 10.5px; letter-spacing: 0.03em; } .mm-brand__sub { display: none; } }
      @media (max-width: 860px) { .mm-links { display: none; } }

      /* ───────── HERO ───────── */
      .mm-hero { position: relative; min-height: clamp(620px, 100svh, 920px); overflow: hidden; background: var(--ink); }
      .mm-hero__bg { position: absolute; inset: 0; }
      .mm-hero__bg img { width: 100%; height: 100%; object-fit: cover; opacity: 0.55; transform: translate3d(var(--mx,0), var(--my,0), 0) scale(1.08); transition: transform 600ms var(--ease); filter: contrast(1.1) brightness(0.7); }
      .mm-grain { position: absolute; inset: -10%; pointer-events: none; mix-blend-mode: overlay; opacity: 0.35;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/></svg>");
      }
      .mm-scanlines { position: absolute; inset: 0; pointer-events: none; opacity: 0.12; background: repeating-linear-gradient(to bottom, transparent 0, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 3px); }
      .mm-hero__vignette { position: absolute; inset: 0; pointer-events: none; background: radial-gradient(ellipse at center, transparent 30%, rgba(10,9,8,0.85) 100%); }
      .mm-hero__grid { position: relative; z-index: 2; min-height: clamp(620px, 100svh, 920px); display: flex; flex-direction: column; }
      .mm-hero__content { display: grid; grid-template-rows: auto 1fr auto; gap: 32px; padding-top: 32px; padding-bottom: 32px; flex: 1; }
      .mm-hero__top { display: flex; justify-content: space-between; align-items: start; gap: 24px; }
      .mm-hero__chip { display: inline-flex; align-items: center; gap: 10px; padding: 8px 14px; background: rgba(10,9,8,0.55); border: 1px solid var(--hair-strong); border-radius: 999px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; backdrop-filter: blur(6px); }
      .mm-live { width: 6px; height: 6px; background: var(--accent); border-radius: 50%; box-shadow: 0 0 0 0 rgba(232,65,42,0.5); animation: mm-live 1.6s ease-in-out infinite; }
      @keyframes mm-live { 0%,100% { box-shadow: 0 0 0 0 rgba(232,65,42,0.6); } 50% { box-shadow: 0 0 0 6px rgba(232,65,42,0); } }
      .mm-hero__top-right { font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); text-align: right; line-height: 1.6; }
      .mm-hero__top-right strong { color: var(--bone); font-weight: 500; }
      .mm-hero__vert { font-family: var(--mono); font-size: 9px; letter-spacing: 0.32em; color: var(--muted); writing-mode: vertical-rl; transform: rotate(180deg); position: absolute; left: var(--gutter); top: 50%; translate: 0 -50%; }
      .mm-hero__center { transform: translate3d(calc(var(--mx,0) * -1), calc(var(--my,0) * -1), 0); }
      .mm-hero__kicker { font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
      .mm-hero__h1 { font-family: var(--display); font-weight: 900; font-size: clamp(4.5rem, 16vw, 14rem); line-height: 0.82; letter-spacing: -0.02em; text-transform: uppercase; margin: 18px 0 0; }
      .mm-hero__h1 .accent { color: var(--accent); }
      .mm-ch { display: inline-block; opacity: 0; transform: translateY(40px) scale(1.1); animation: mm-charin 700ms cubic-bezier(.22,1,.36,1) both; }
      @keyframes mm-charin { to { opacity: 1; transform: translateY(0) scale(1); } }
      .mm-hero__sub { display: grid; grid-template-columns: 1fr auto; align-items: end; gap: 32px; margin-top: 28px; max-width: 1200px; }
      .mm-hero__sub p { max-width: 520px; font-size: 15px; color: var(--bone-2); line-height: 1.55; }
      .mm-hero__cta { display: flex; flex-wrap: wrap; gap: 10px; }
      .mm-hero__bottom { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; border-top: 1px solid var(--hair); padding-top: 24px; }
      .mm-hero__cell { display: flex; flex-direction: column; gap: 4px; padding-right: 24px; border-right: 1px solid var(--hair); }
      .mm-hero__cell:last-child { border-right: 0; }
      .mm-hero__cell .label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
      .mm-hero__cell .value { font-family: var(--display); font-weight: 800; font-size: 36px; line-height: 1; }

      @media (max-width: 900px) {
        .mm-hero__vert { display: none; }
        .mm-hero__h1 { font-size: clamp(3.5rem, 20vw, 8rem); }
        .mm-hero__bottom { grid-template-columns: repeat(2, 1fr); gap: 16px; }
        .mm-hero__cell { padding-right: 12px; }
        .mm-hero__cell:nth-child(2) { border-right: 0; }
        .mm-hero__sub { grid-template-columns: 1fr; }
      }

      /* ───────── STATS STRIP ───────── */
      .mm-stats { padding: 48px 0; border-block: 1px solid var(--hair); background: var(--ink-2); }
      .mm-stats__row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
      .mm-stats__cell { display: flex; flex-direction: column; gap: 8px; }
      .mm-stats__num { font-family: var(--display); font-weight: 900; font-size: clamp(2.5rem, 4vw, 3.5rem); line-height: 1; color: var(--bone); display: flex; align-items: baseline; gap: 6px; }
      .mm-stats__num .unit { font-size: 0.6em; color: var(--accent); }
      .mm-stats__lbl { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
      @media (max-width: 700px) { .mm-stats__row { grid-template-columns: repeat(2, 1fr); gap: 24px; } }

      /* ───────── PROMISES ───────── */
      .mm-promises { padding: 64px 0; }
      .mm-promises__grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--hair); border: 1px solid var(--hair); }
      .mm-promise { background: var(--ink); padding: 28px; display: flex; gap: 18px; align-items: start; }
      .mm-promise__num { font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; color: var(--accent); }
      .mm-promise__title { font-family: var(--display); font-weight: 800; font-size: 17px; text-transform: uppercase; letter-spacing: 0.02em; margin: 0 0 6px; }
      .mm-promise__desc { color: var(--muted); font-size: 13px; }
      @media (max-width: 900px) { .mm-promises__grid { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 540px) { .mm-promises__grid { grid-template-columns: 1fr; } }

      /* ───────── SECTION HEADER ───────── */
      .mm-section { padding: 80px 0; }
      .mm-sh { display: flex; justify-content: space-between; align-items: end; gap: 32px; margin-bottom: 48px; flex-wrap: wrap; }
      .mm-sh h2 { font-family: var(--display); font-weight: 800; font-size: clamp(2.5rem, 5vw, 4rem); line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; margin: 12px 0 0; max-width: 14ch; }
      .mm-sh .accent { color: var(--accent); font-style: italic; }
      .mm-sh__right { display: flex; align-items: center; gap: 24px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }

      /* ───────── CATEGORIES ───────── */
      .mm-cats { display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 320px; gap: 12px; }
      .mm-cat { position: relative; overflow: hidden; background: var(--ink-2); border: 1px solid var(--hair); transition: border-color 320ms var(--ease); cursor: pointer; }
      .mm-cat:hover { border-color: var(--accent); }
      .mm-cat--lg { grid-column: span 2; grid-row: span 2; }
      .mm-cat--md { grid-column: span 2; }
      .mm-cat__img { position: absolute; inset: 0; }
      .mm-cat__img img { width: 100%; height: 100%; object-fit: cover; transition: transform 800ms var(--ease); filter: brightness(0.55) contrast(1.1); }
      .mm-cat:hover .mm-cat__img img { transform: scale(1.07); filter: brightness(0.7) contrast(1.05); }
      .mm-cat__overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(10,9,8,0.2) 0%, rgba(10,9,8,0.85) 100%); pointer-events: none; }
      .mm-cat__top { position: absolute; top: 18px; left: 18px; right: 18px; display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; color: var(--muted); }
      .mm-cat__bottom { position: absolute; left: 22px; right: 22px; bottom: 22px; }
      .mm-cat__sub { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; color: var(--accent); display: block; margin-bottom: 8px; }
      .mm-cat__title { font-family: var(--display); font-weight: 800; font-size: clamp(1.6rem, 3vw, 2.4rem); line-height: 1; letter-spacing: -0.01em; text-transform: uppercase; margin: 0; }
      .mm-cat--lg .mm-cat__title { font-size: clamp(2.4rem, 5vw, 4rem); }
      .mm-cat__arrow { position: absolute; top: 22px; right: 22px; opacity: 0; transition: all 320ms var(--ease); color: var(--accent); }
      .mm-cat:hover .mm-cat__arrow { opacity: 1; transform: translate(0, -4px); }
      @media (max-width: 1100px) { .mm-cats { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 260px; } .mm-cat--lg, .mm-cat--md { grid-column: span 1; grid-row: span 1; } .mm-cat--lg { grid-column: span 2; grid-row: span 2; } }
      @media (max-width: 600px) { .mm-cats { grid-template-columns: 1fr; grid-auto-rows: 220px; } .mm-cat--lg, .mm-cat--md { grid-column: span 1; grid-row: span 1; } }

      /* ───────── PRODUCT CARDS ───────── */
      .mm-products { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
      @media (max-width: 1100px) { .mm-products { grid-template-columns: repeat(3, 1fr); } }
      @media (max-width: 800px) { .mm-products { grid-template-columns: repeat(2, 1fr); gap: 16px; } }
      @media (max-width: 480px) { .mm-products { grid-template-columns: 1fr; } }
      .mm-product { display: flex; flex-direction: column; gap: 10px; cursor: pointer; }
      .mm-product__media { position: relative; aspect-ratio: 4/5; background: var(--ink-2); overflow: hidden; border: 1px solid var(--hair); }
      .mm-product__media img { width: 100%; height: 100%; object-fit: cover; transition: transform 600ms var(--ease); }
      .mm-product:hover .mm-product__media img { transform: scale(1.05); }
      .mm-product__badges { position: absolute; top: 12px; left: 12px; display: flex; flex-direction: column; gap: 4px; }
      .mm-badge { font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em; padding: 4px 8px; border-radius: 2px; font-weight: 700; }
      .mm-badge--sale { background: var(--accent); color: white; }
      .mm-badge--new { background: var(--bone); color: var(--ink); }
      .mm-badge--house { background: var(--amber); color: var(--ink); }
      .mm-product__wish { position: absolute; top: 12px; right: 12px; width: 32px; height: 32px; display: grid; place-items: center; background: rgba(10,9,8,0.6); border-radius: 50%; color: var(--bone); backdrop-filter: blur(4px); transition: all 180ms var(--ease); }
      .mm-product__wish:hover { background: var(--accent); }
      .mm-product__sold { position: absolute; bottom: 12px; left: 12px; right: 12px; display: flex; align-items: center; gap: 6px; padding: 6px 10px; background: rgba(10,9,8,0.78); border-radius: 999px; font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; color: var(--bone); backdrop-filter: blur(4px); }
      .mm-product__sold .dot { width: 6px; height: 6px; background: var(--green); border-radius: 50%; animation: mm-pulse 2s ease-in-out infinite; }
      .mm-product__brand { font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); }
      .mm-product__name { font-family: var(--display); font-weight: 700; font-size: 15px; line-height: 1.2; letter-spacing: 0.01em; margin: 0; text-transform: uppercase; }
      .mm-product__price { display: flex; align-items: baseline; gap: 10px; }
      .mm-product__price .now { font-family: var(--display); font-weight: 800; font-size: 22px; color: var(--bone); }
      .mm-product__price .old { font-family: var(--mono); font-size: 12px; color: var(--muted); text-decoration: line-through; }
      .mm-product__price .pct { font-family: var(--mono); font-size: 10px; color: var(--accent); font-weight: 700; }
      .mm-product__stock { display: inline-flex; align-items: center; gap: 6px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
      .mm-product__stock .ind { width: 6px; height: 6px; background: var(--green); border-radius: 50%; }
      .mm-product__stock.low .ind { background: var(--amber); }
      .mm-product__stock .viewers { color: var(--muted-2); }
      .mm-product__stock .viewers strong { color: var(--bone); font-weight: 600; }
      .mm-product__swatches { display: flex; gap: 6px; margin-top: 4px; }
      .mm-product__swatch { width: 14px; height: 14px; border-radius: 50%; border: 1px solid var(--hair-strong); }

      /* ───────── HOUSE BRANDS ───────── */
      .mm-house { padding: 96px 0; background: var(--ink-2); }
      .mm-house__intro { max-width: 720px; margin-bottom: 56px; }
      .mm-house__intro h2 { font-family: var(--display); font-weight: 800; font-size: clamp(2.8rem, 6vw, 5rem); line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; margin: 24px 0 0; }
      .mm-house__intro h2 em { color: var(--accent); font-style: italic; }
      .mm-house__intro p { color: var(--muted); font-size: 17px; line-height: 1.55; margin: 18px 0 0; max-width: 580px; }
      .mm-house__grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; min-height: 420px; }
      @media (max-width: 900px) { .mm-house__grid { grid-template-columns: 1fr; gap: 12px; min-height: 0; } }
      .mm-brand-card { position: relative; overflow: hidden; background: var(--ink); border: 1px solid var(--hair); padding: 32px; display: flex; flex-direction: column; justify-content: space-between; min-height: 380px; transition: border-color 320ms var(--ease); cursor: pointer; }
      .mm-brand-card:hover { border-color: var(--accent); }
      .mm-brand-card__bg { position: absolute; inset: 0; opacity: 0.3; }
      .mm-brand-card__bg img { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) brightness(0.6); transition: transform 800ms var(--ease); }
      .mm-brand-card:hover .mm-brand-card__bg img { transform: scale(1.05); }
      .mm-brand-card__wordmark { font-family: var(--display); font-weight: 900; font-size: clamp(2.2rem, 4vw, 3.4rem); letter-spacing: -0.02em; text-transform: uppercase; margin: 0; position: relative; }
      .mm-brand-card__tag { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent); position: relative; }
      .mm-brand-card__desc { color: var(--bone-2); font-size: 14px; line-height: 1.5; position: relative; margin: 0 0 18px; }
      .mm-brand-card__cta { font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--bone); display: inline-flex; align-items: center; gap: 6px; position: relative; }
      .mm-brand-card__cta:hover { color: var(--accent); }

      /* ───────── FIND BIKE ───────── */
      .mm-findbike { position: relative; padding: 96px 0; background: var(--ink); overflow: hidden; }
      .mm-findbike__hazard { position: absolute; inset: 0; pointer-events: none; opacity: 0.05;
        background: repeating-linear-gradient(135deg, var(--amber) 0, var(--amber) 24px, transparent 24px, transparent 48px); }
      .mm-findbike__inner { display: grid; grid-template-columns: 5fr 7fr; gap: 56px; align-items: start; position: relative; }
      @media (max-width: 1000px) { .mm-findbike__inner { grid-template-columns: 1fr; gap: 32px; } }
      .mm-findbike__left h2 { font-family: var(--display); font-weight: 800; font-size: clamp(2.4rem, 5vw, 4rem); line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; margin: 18px 0 0; }
      .mm-findbike__left h2 em { color: var(--accent); font-style: italic; }
      .mm-findbike__left p { color: var(--muted); font-size: 15px; line-height: 1.55; margin: 18px 0 0; max-width: 460px; }
      .mm-findbike__panel { background: var(--ink-2); border: 1px solid var(--hair); padding: 32px; }
      .mm-findbike__panel-label { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
      .mm-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 18px; }
      .mm-field { display: flex; flex-direction: column; gap: 6px; }
      .mm-field__lbl { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
      .mm-field__select { background: var(--ink); border: 1px solid var(--hair-strong); border-radius: 4px; color: var(--bone); padding: 14px 16px; font-family: var(--mono); font-size: 12px; letter-spacing: 0.08em; transition: border-color 180ms var(--ease); appearance: none; cursor: pointer; }
      .mm-field__select:focus { outline: none; border-color: var(--accent); }
      .mm-findbike__cta { display: flex; gap: 10px; margin-top: 24px; flex-wrap: wrap; }
      .mm-findbike__brands { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
      .mm-findbike__brands button { padding: 8px 14px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--bone); border: 1px solid var(--hair-strong); border-radius: 999px; transition: all 180ms var(--ease); }
      .mm-findbike__brands button:hover { background: var(--accent); color: white; border-color: var(--accent); }

      /* ───────── HERITAGE ───────── */
      .mm-heritage { padding: 120px 0; }
      .mm-heritage__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center; }
      @media (max-width: 1000px) { .mm-heritage__grid { grid-template-columns: 1fr; gap: 40px; } }
      .mm-heritage__left h2 { font-family: var(--display); font-weight: 900; font-size: clamp(3rem, 7vw, 6.5rem); line-height: 0.85; letter-spacing: -0.02em; text-transform: uppercase; margin: 20px 0 0; }
      .mm-heritage__left h2 .year { color: var(--accent); font-style: italic; display: block; margin: 4px 0; }
      .mm-heritage__left p { color: var(--bone-2); font-size: 16px; line-height: 1.6; margin: 24px 0 0; max-width: 540px; }
      .mm-heritage__stores { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; margin-top: 40px; }
      .mm-store { border-top: 1px solid var(--hair); padding-top: 18px; }
      .mm-store__city { font-family: var(--display); font-weight: 800; font-size: 22px; text-transform: uppercase; letter-spacing: 0.02em; margin: 0; }
      .mm-store__addr { color: var(--muted); font-size: 13px; line-height: 1.6; margin: 8px 0 12px; white-space: pre-line; }
      .mm-store__phone { font-family: var(--mono); font-size: 12px; letter-spacing: 0.08em; color: var(--accent); }
      .mm-heritage__right { position: relative; aspect-ratio: 4/5; background: var(--ink-2); border: 1px solid var(--hair); overflow: hidden; }
      .mm-heritage__right img { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) saturate(0.8); }
      .mm-heritage__tag { position: absolute; top: 24px; left: 24px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.18em; padding: 6px 10px; background: var(--accent); color: white; }
      .mm-heritage__right-bottom { position: absolute; bottom: 20px; left: 24px; right: 24px; display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--bone); }

      /* ───────── BRAND CAROUSEL ───────── */
      .mm-brandscarousel { padding: 80px 0 64px; border-top: 1px solid var(--hair); }
      .mm-brandscarousel__title { font-family: var(--display); font-weight: 700; font-size: clamp(1.2rem, 2vw, 1.5rem); text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); margin-bottom: 32px; }
      .mm-brandscarousel__track { display: flex; gap: 56px; overflow: hidden; width: 100%; white-space: nowrap; mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent); }
      .mm-brandscarousel__track > div { display: inline-flex; gap: 56px; animation: mm-marquee 60s linear infinite; flex-shrink: 0; }
      .mm-brandscarousel__track:hover > div { animation-play-state: paused; }
      .mm-brand-logo { font-family: var(--display); font-weight: 700; font-size: clamp(1.8rem, 3vw, 2.4rem); color: var(--muted); letter-spacing: 0.02em; text-transform: uppercase; transition: color 180ms var(--ease); }
      .mm-brand-logo:hover { color: var(--bone); }
      @keyframes mm-marquee { to { transform: translateX(-50%); } }

      /* ───────── NEWSLETTER ───────── */
      .mm-nl { padding: 96px 0; background: var(--ink-2); }
      .mm-nl__inner { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: center; }
      @media (max-width: 900px) { .mm-nl__inner { grid-template-columns: 1fr; gap: 32px; } }
      .mm-nl h2 { font-family: var(--display); font-weight: 800; font-size: clamp(2.2rem, 4vw, 3.4rem); line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; margin: 14px 0 0; }
      .mm-nl p { color: var(--muted); font-size: 15px; line-height: 1.55; margin: 14px 0 0; max-width: 460px; }
      .mm-nl__form { display: flex; border: 1px solid var(--hair-strong); border-radius: 4px; overflow: hidden; }
      .mm-nl__form input { flex: 1; background: var(--ink); padding: 18px 20px; border: 0; color: var(--bone); font-size: 14px; outline: none; }
      .mm-nl__form input::placeholder { color: var(--muted-2); }
      .mm-nl__form button { background: var(--accent); color: white; padding: 18px 28px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; display: inline-flex; align-items: center; gap: 10px; }
      .mm-nl__form button:hover { background: #ff5538; }
      .mm-nl__perks { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 16px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }

      /* ───────── FOOTER ───────── */
      .mm-footer { padding: 96px 0 40px; border-top: 1px solid var(--hair); }
      .mm-footer__grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 56px; }
      @media (max-width: 1000px) { .mm-footer__grid { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 600px) { .mm-footer__grid { grid-template-columns: 1fr; } }
      .mm-footer p { color: var(--muted); font-size: 14px; line-height: 1.6; margin: 20px 0 0; max-width: 360px; }
      .mm-footer__socials { display: flex; gap: 10px; margin-top: 24px; }
      .mm-footer__socials a { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid var(--hair-strong); border-radius: 50%; color: var(--muted); transition: all 180ms var(--ease); }
      .mm-footer__socials a:hover { background: var(--accent); color: white; border-color: var(--accent); }
      .mm-footer h5 { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--bone); margin: 0 0 18px; }
      .mm-footer ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
      .mm-footer ul a { color: var(--muted); font-size: 13px; }
      .mm-footer ul a:hover { color: var(--bone); }
      .mm-footer__bottom { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 56px; padding-top: 24px; border-top: 1px solid var(--hair); font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted-2); flex-wrap: wrap; }

      /* ───────── FOUR SEASONS ───────── */
      .mm-seasons { background: var(--ink-2); border-top: 1px solid var(--hair); }
      .mm-seasons__wrap { position: relative; height: 280vh; }
      .mm-seasons__sticky { position: sticky; top: 0; height: 100vh; display: flex; align-items: center; overflow: hidden; }
      .mm-seasons__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; width: 100%; }
      @media (max-width: 1000px) { .mm-seasons__grid { grid-template-columns: 1fr; gap: 24px; } .mm-seasons__wrap { height: 320vh; } }
      .mm-seasons__left { position: relative; aspect-ratio: 4/3; }
      .mm-seasons__blob { position: absolute; inset: -10%; transition: background 800ms var(--ease); pointer-events: none; }
      .mm-seasons__svg { position: relative; width: 100%; height: 100%; }
      .mm-seasons__lab { position: absolute; font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; padding: 4px 10px; background: rgba(10,9,8,0.7); border: 1px solid var(--hair-strong); border-radius: 999px; color: var(--bone); white-space: nowrap; }
      .mm-seasons__lab--tr { top: 10%; right: 5%; }
      .mm-seasons__lab--tl { top: 30%; left: 5%; }
      .mm-seasons__lab--br { top: 55%; right: 5%; }
      .mm-seasons__lab--bl { top: 75%; left: 5%; }
      .mm-seasons__right { display: flex; flex-direction: column; gap: 20px; }
      .mm-seasons__h { font-family: var(--display); font-weight: 800; font-size: clamp(2.5rem, 5vw, 4.5rem); line-height: 0.92; letter-spacing: -0.02em; text-transform: uppercase; margin: 0; }
      .mm-seasons__h .accent { color: var(--accent); font-style: italic; }
      .mm-seasons__nav { display: flex; flex-wrap: wrap; gap: 6px; }
      .mm-seasons__nav button { padding: 10px 14px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); border: 1px solid var(--hair-strong); border-radius: 4px; display: inline-flex; align-items: center; gap: 8px; transition: all 180ms var(--ease); }
      .mm-seasons__nav button .num { color: var(--muted-2); }
      .mm-seasons__nav button.is-on { color: var(--ink); background: var(--c, var(--bone)); border-color: transparent; }
      .mm-seasons__nav button.is-on .num { color: var(--ink); }
      .mm-seasons__panel { background: var(--ink); border: 1px solid var(--hair); padding: 24px; }
      .mm-seasons__panel .temp { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); }
      .mm-seasons__panel h3 { font-family: var(--display); font-weight: 800; font-size: 28px; line-height: 1; letter-spacing: -0.01em; text-transform: uppercase; margin: 14px 0 10px; }
      .mm-seasons__panel p { color: var(--bone-2); font-size: 14px; line-height: 1.55; margin: 0 0 18px; }
      .mm-seasons__kit { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px 18px; }
      .mm-seasons__kit li { display: flex; gap: 10px; font-size: 13px; color: var(--bone-2); }
      .mm-seasons__kit li .n { font-family: var(--mono); font-size: 10px; color: var(--accent); }
      .mm-seasons__bar { position: relative; height: 2px; background: var(--hair); margin-top: 8px; overflow: hidden; }
      .mm-seasons__bar::after { content: ""; position: absolute; left: 0; top: 0; height: 100%; width: var(--p); background: var(--accent); transition: width 200ms linear; }

      /* ───────── KIT BUILDER ───────── */
      .mm-kit { padding: 96px 0; background: var(--ink-2); }
      .mm-kit__intro { max-width: 720px; margin-bottom: 48px; }
      .mm-kit__h { font-family: var(--display); font-weight: 800; font-size: clamp(2.6rem, 5vw, 4.5rem); line-height: 0.95; letter-spacing: -0.02em; text-transform: uppercase; margin: 18px 0 14px; }
      .mm-kit__h em { color: var(--accent); font-style: italic; }
      .mm-kit__p { color: var(--muted); font-size: 16px; line-height: 1.55; max-width: 540px; }
      .mm-kit__layout { display: grid; grid-template-columns: 320px 1fr; gap: 32px; align-items: start; }
      @media (max-width: 1000px) { .mm-kit__layout { grid-template-columns: 1fr; } }
      .mm-kit__steps { display: flex; flex-direction: column; gap: 6px; }
      .mm-kit__step { display: flex; gap: 14px; align-items: center; padding: 16px 18px; background: var(--ink); border: 1px solid var(--hair); border-radius: 4px; text-align: left; transition: all 180ms var(--ease); }
      .mm-kit__step.is-active { background: var(--ink-3); border-color: var(--accent); }
      .mm-kit__step:hover { background: var(--ink-3); }
      .mm-kit__step .num { font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; color: var(--muted); min-width: 24px; }
      .mm-kit__step .lbl { display: block; font-family: var(--display); font-weight: 700; font-size: 16px; text-transform: uppercase; letter-spacing: 0.02em; color: var(--bone); }
      .mm-kit__step .sub { display: block; font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; color: var(--muted); margin-top: 4px; }
      .mm-kit__step .ok { margin-left: auto; color: var(--green); font-weight: 700; font-family: var(--mono); }
      .mm-kit__main { background: var(--ink); border: 1px solid var(--hair); padding: 28px; display: flex; flex-direction: column; gap: 24px; }
      .mm-kit__progress { display: flex; align-items: center; gap: 14px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
      .mm-kit__progress .bar { flex: 1; height: 4px; background: var(--hair); overflow: hidden; }
      .mm-kit__progress .bar > div { height: 100%; background: var(--accent); transition: width 380ms var(--ease); }
      .mm-kit__opts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      @media (max-width: 700px) { .mm-kit__opts { grid-template-columns: 1fr; } }
      .mm-kit__opt { background: var(--ink-2); border: 1px solid var(--hair); padding: 16px; cursor: pointer; transition: all 180ms var(--ease); }
      .mm-kit__opt:hover, .mm-kit__opt.is-picked { border-color: var(--accent); }
      .mm-kit__opt-media { position: relative; aspect-ratio: 4/3; background: var(--ink); overflow: hidden; margin-bottom: 12px; }
      .mm-kit__opt-media img { width: 100%; height: 100%; object-fit: cover; }
      .mm-kit__opt-media .dot { position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; display: grid; place-items: center; background: rgba(10,9,8,0.8); border-radius: 50%; color: var(--bone); font-weight: 700; }
      .mm-kit__opt.is-picked .mm-kit__opt-media .dot { background: var(--accent); color: white; }
      .mm-kit__opt .brand { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; color: var(--muted); text-transform: uppercase; }
      .mm-kit__opt h4 { font-family: var(--display); font-weight: 700; font-size: 14px; margin: 6px 0; text-transform: uppercase; }
      .mm-kit__opt .price { font-family: var(--display); font-weight: 800; font-size: 18px; color: var(--bone); }
      .mm-kit__opt .price .old { font-family: var(--mono); font-size: 11px; color: var(--muted); text-decoration: line-through; margin-left: 8px; font-weight: 400; }
      .mm-kit__totals { display: grid; grid-template-columns: repeat(3, 1fr) auto; gap: 16px; align-items: end; padding-top: 20px; border-top: 1px solid var(--hair); }
      @media (max-width: 800px) { .mm-kit__totals { grid-template-columns: 1fr 1fr; } }
      .mm-kit__totals .lbl { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); display: block; margin-bottom: 4px; }
      .mm-kit__totals .val { font-family: var(--display); font-weight: 800; font-size: 24px; color: var(--bone); }
      .mm-kit__totals .val.savings { color: var(--green); }
      .mm-kit__totals .val.amber { color: var(--amber); }

      /* ───────── HERITAGE TIMELINE ───────── */
      .mm-heritage { padding: 96px 0; }
      .mm-heritage__counters { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; padding: 40px 0 64px; border-bottom: 1px solid var(--hair); margin-bottom: 64px; }
      @media (max-width: 800px) { .mm-heritage__counters { grid-template-columns: 1fr; gap: 24px; } }
      .mm-heritage__counters .v { font-family: var(--display); font-weight: 900; font-size: clamp(4rem, 8vw, 7rem); line-height: 1; color: var(--bone); display: inline-flex; align-items: baseline; }
      .mm-heritage__counters .pl { color: var(--accent); font-size: 0.6em; }
      .mm-heritage__counters .l { font-family: var(--mono); font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); margin-top: 8px; }
      .mm-heritage__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start; }
      @media (max-width: 1000px) { .mm-heritage__grid { grid-template-columns: 1fr; } }
      .mm-heritage__left h2 { font-family: var(--display); font-weight: 900; font-size: clamp(3rem, 7vw, 6rem); line-height: 0.85; letter-spacing: -0.02em; text-transform: uppercase; margin: 20px 0; }
      .mm-heritage__left h2 .year { color: var(--accent); font-style: italic; }
      .mm-heritage__left p { color: var(--bone-2); font-size: 16px; line-height: 1.6; max-width: 540px; }
      .mm-heritage__stores { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 40px; }
      @media (max-width: 500px) { .mm-heritage__stores { grid-template-columns: 1fr; } }
      .mm-store { border-top: 1px solid var(--hair); padding-top: 18px; }
      .mm-store__city { font-family: var(--display); font-weight: 800; font-size: 22px; text-transform: uppercase; margin: 0; }
      .mm-store__addr { color: var(--muted); font-size: 13px; line-height: 1.6; margin: 8px 0 12px; white-space: pre-line; }
      .mm-store__phone { font-family: var(--mono); font-size: 12px; color: var(--accent); letter-spacing: 0.08em; }
      .mm-timeline { display: grid; grid-template-columns: 100px 1fr; gap: 32px; }
      @media (max-width: 600px) { .mm-timeline { grid-template-columns: 80px 1fr; gap: 16px; } }
      .mm-timeline__rail { display: flex; flex-direction: column; gap: 8px; border-left: 1px solid var(--hair); padding-left: 24px; }
      .mm-timeline__yr { font-family: var(--display); font-weight: 800; font-size: 20px; color: var(--muted-2); text-align: left; padding: 8px 0; position: relative; transition: color 180ms var(--ease); }
      .mm-timeline__yr::before { content: ""; position: absolute; left: -28px; top: 50%; width: 8px; height: 8px; border: 1px solid var(--muted-2); border-radius: 50%; background: var(--ink); translate: 0 -50%; transition: all 180ms var(--ease); }
      .mm-timeline__yr.is-on { color: var(--bone); }
      .mm-timeline__yr.is-on::before { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 0 3px rgba(232,65,42,0.2); }
      .mm-timeline__panel h3 { font-family: var(--display); font-weight: 800; font-size: clamp(1.6rem, 3vw, 2.4rem); line-height: 1; text-transform: uppercase; letter-spacing: -0.01em; margin: 0 0 14px; }
      .mm-timeline__panel p { color: var(--bone-2); font-size: 15px; line-height: 1.55; max-width: 480px; margin: 0 0 20px; }
      .mm-timeline__photo { position: relative; aspect-ratio: 16/9; background: var(--ink-2); border: 1px solid var(--hair); overflow: hidden; }
      .mm-timeline__photo img { width: 100%; height: 100%; object-fit: cover; filter: contrast(1.1) saturate(0.8); }

      /* ───────── JOURNAL ───────── */
      .mm-journal { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
      @media (max-width: 1100px) { .mm-journal { grid-template-columns: repeat(2, 1fr); } }
      @media (max-width: 600px) { .mm-journal { grid-template-columns: 1fr; } }
      .mm-journal__card { display: flex; flex-direction: column; gap: 12px; cursor: pointer; }
      .mm-journal__media { position: relative; aspect-ratio: 4/3; overflow: hidden; background: var(--ink-2); border: 1px solid var(--hair); }
      .mm-journal__media img { width: 100%; height: 100%; object-fit: cover; transition: transform 600ms var(--ease); }
      .mm-journal__card:hover .mm-journal__media img { transform: scale(1.05); }
      .mm-journal__tag { position: absolute; top: 12px; left: 12px; font-family: var(--mono); font-size: 9px; letter-spacing: 0.16em; padding: 5px 9px; background: var(--accent); color: white; font-weight: 700; }
      .mm-journal__card h3 { font-family: var(--display); font-weight: 800; font-size: 18px; line-height: 1.1; letter-spacing: -0.01em; text-transform: uppercase; margin: 4px 0 0; }
      .mm-journal__card p { color: var(--muted); font-size: 13px; line-height: 1.55; margin: 0; }
      .mm-journal__foot { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; color: var(--muted-2); margin-top: auto; padding-top: 8px; border-top: 1px solid var(--hair); text-transform: uppercase; }

      /* ───────── COMMUNITY ───────── */
      .mm-community { padding: 96px 0; background: var(--ink-2); }
      .mm-community__intro { display: grid; grid-template-columns: 2fr 1fr; gap: 32px; align-items: end; margin-bottom: 32px; }
      @media (max-width: 800px) { .mm-community__intro { grid-template-columns: 1fr; } }
      .mm-community__intro h2 { font-family: var(--display); font-weight: 900; font-size: clamp(3rem, 7vw, 6rem); line-height: 0.9; letter-spacing: -0.02em; text-transform: uppercase; margin: 0; }
      .mm-community__intro h2 .big { color: var(--accent); }
      .mm-community__intro p { color: var(--muted); font-size: 14px; line-height: 1.55; margin: 12px 0 0; }
      .mm-community__grid { display: grid; grid-template-columns: repeat(4, 1fr); grid-auto-rows: 240px; gap: 8px; }
      @media (max-width: 800px) { .mm-community__grid { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 180px; } }
      .mm-community__tile { position: relative; overflow: hidden; background: var(--ink); border: 1px solid var(--hair); }
      .mm-community__tile.is-wide { grid-column: span 2; }
      .mm-community__tile img { width: 100%; height: 100%; object-fit: cover; transition: transform 600ms var(--ease); filter: brightness(0.85); }
      .mm-community__tile:hover img { transform: scale(1.05); filter: brightness(1); }
      .mm-community__tile .handle { position: absolute; bottom: 10px; left: 12px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; color: var(--bone); opacity: 0; transform: translateY(8px); transition: all 320ms var(--ease); }
      .mm-community__tile:hover .handle { opacity: 1; transform: translateY(0); }
      .mm-community__cta { display: flex; justify-content: center; margin-top: 32px; }

      /* ───────── MOBILE BOTTOM NAV ───────── */
      .mm-mobnav { position: fixed; bottom: 0; left: 0; right: 0; z-index: 60; display: none; background: rgba(10,9,8,0.95); backdrop-filter: blur(12px); border-top: 1px solid var(--hair); padding: 8px 4px env(safe-area-inset-bottom); }
      .mm-mobnav button { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 4px; color: var(--muted); font-family: var(--mono); font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; position: relative; transition: color 180ms var(--ease); }
      .mm-mobnav button.is-on { color: var(--accent); }
      .mm-mobnav button:hover { color: var(--bone); }
      .mm-mobnav button .badge { position: absolute; top: 4px; right: calc(50% - 22px); min-width: 14px; height: 14px; padding: 0 4px; background: var(--accent); color: white; border-radius: 7px; font-size: 8px; display: grid; place-items: center; font-weight: 700; }
      @media (max-width: 800px) { .mm-mobnav { display: flex; } body { padding-bottom: 64px; } }

      /* ───────── PRODUCT CARD EXTRAS ───────── */
      .mm-product__cmp { position: absolute; top: 12px; right: 50px; width: 32px; height: 32px; display: grid; place-items: center; background: rgba(10,9,8,0.6); border-radius: 50%; color: var(--bone); font-size: 14px; backdrop-filter: blur(4px); transition: all 180ms var(--ease); }
      .mm-product__cmp:hover, .mm-product__cmp.is-on { background: var(--accent); color: white; }
      .mm-product__wish.is-on { background: var(--accent); color: white; }
      .mm-product__quick { position: absolute; bottom: 50px; left: 12px; right: 12px; padding: 10px 14px; background: var(--bone); color: var(--ink); font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; border-radius: 4px; opacity: 0; transform: translateY(8px); transition: all 240ms var(--ease); }
      .mm-product:hover .mm-product__quick { opacity: 1; transform: translateY(0); }

      /* ───────── SCRIM / DRAWER / MODAL ───────── */
      .mm-scrim { position: fixed; inset: 0; background: rgba(10,9,8,0.7); backdrop-filter: blur(4px); z-index: 90; opacity: 0; pointer-events: none; transition: opacity 240ms var(--ease); }
      .mm-scrim.is-open { opacity: 1; pointer-events: auto; }

      .mm-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(440px, 100vw); background: var(--ink); border-left: 1px solid var(--hair); z-index: 100; display: flex; flex-direction: column; transform: translateX(100%); transition: transform 320ms var(--ease); }
      .mm-drawer.is-open { transform: translateX(0); }
      .mm-drawer__head { display: flex; justify-content: space-between; align-items: center; padding: 22px 24px; border-bottom: 1px solid var(--hair); }
      .mm-drawer__head h3 { font-family: var(--display); font-weight: 800; font-size: 22px; text-transform: uppercase; margin: 0; }
      .mm-drawer__head .count { font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; color: var(--muted); }
      .mm-drawer__close { width: 36px; height: 36px; display: grid; place-items: center; color: var(--bone); border-radius: 50%; font-size: 18px; }
      .mm-drawer__close:hover { background: var(--ink-3); }
      .mm-drawer__body { flex: 1; overflow-y: auto; padding: 16px 24px; display: flex; flex-direction: column; gap: 16px; }
      .mm-drawer__empty { padding: 40px 0; text-align: left; }
      .mm-drawer__empty .mm-display { font-size: 56px; color: var(--accent); }
      .mm-drawer__empty p { color: var(--muted); font-size: 14px; margin: 10px 0 0; }
      .mm-cart-item { display: grid; grid-template-columns: 80px 1fr auto; gap: 12px; align-items: start; padding-bottom: 16px; border-bottom: 1px solid var(--hair); }
      .mm-cart-item__media { position: relative; width: 80px; height: 80px; background: var(--ink-2); border: 1px solid var(--hair); }
      .mm-cart-item__media img { width: 100%; height: 100%; object-fit: cover; }
      .mm-cart-item__body .brand { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; color: var(--muted); text-transform: uppercase; }
      .mm-cart-item__body h5 { font-family: var(--display); font-weight: 700; font-size: 14px; text-transform: uppercase; margin: 4px 0 8px; line-height: 1.2; }
      .mm-cart-item__body .qty { display: inline-flex; align-items: center; gap: 0; border: 1px solid var(--hair-strong); border-radius: 4px; }
      .mm-cart-item__body .qty button { width: 28px; height: 28px; color: var(--bone); }
      .mm-cart-item__body .qty span { padding: 0 8px; font-family: var(--mono); font-size: 12px; }
      .mm-cart-item__price { text-align: right; }
      .mm-cart-item__price .amt { font-family: var(--display); font-weight: 800; font-size: 17px; }
      .mm-cart-item__price .rm { display: block; margin-top: 6px; font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
      .mm-cart-item__price .rm:hover { color: var(--accent); }
      .mm-drawer__foot { padding: 18px 24px; border-top: 1px solid var(--hair); display: flex; flex-direction: column; gap: 10px; background: var(--ink-2); }
      .mm-drawer__meter { display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px; }
      .mm-drawer__meter .lab { display: flex; justify-content: space-between; font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); }
      .mm-drawer__meter .bar { height: 4px; background: var(--hair); overflow: hidden; }
      .mm-drawer__meter .bar > div { height: 100%; background: var(--accent); transition: width 320ms var(--ease); }
      .mm-drawer__row { display: flex; justify-content: space-between; font-size: 14px; color: var(--muted); }
      .mm-drawer__total { display: flex; justify-content: space-between; align-items: baseline; padding-top: 10px; border-top: 1px solid var(--hair); font-family: var(--display); font-weight: 800; font-size: 18px; text-transform: uppercase; }
      .mm-drawer__total .amt { font-size: 24px; }
      .mm-drawer__cta { width: 100%; justify-content: center; }

      /* ───────── MODAL (Quick view) ───────── */
      .mm-modal { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 32px; pointer-events: none; opacity: 0; transition: opacity 240ms var(--ease); }
      .mm-modal.is-open { opacity: 1; pointer-events: auto; }
      .mm-modal__panel { background: var(--ink); border: 1px solid var(--hair); width: min(960px, 100%); max-height: 90vh; overflow: hidden; display: grid; grid-template-columns: 1fr 1fr; }
      @media (max-width: 800px) { .mm-modal__panel { grid-template-columns: 1fr; overflow-y: auto; } }
      .mm-modal__media { position: relative; aspect-ratio: 1; background: var(--ink-2); }
      .mm-modal__media img { width: 100%; height: 100%; object-fit: cover; }
      .mm-modal__body { padding: 32px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; position: relative; }
      .mm-modal__close { position: absolute; top: 16px; right: 16px; width: 32px; height: 32px; display: grid; place-items: center; color: var(--bone); border-radius: 50%; font-size: 16px; }
      .mm-modal__close:hover { background: var(--ink-3); }
      .mm-modal__body .brand { font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); }
      .mm-modal__body h2 { font-family: var(--display); font-weight: 800; font-size: 28px; text-transform: uppercase; line-height: 1.05; letter-spacing: -0.01em; margin: 0; }
      .mm-modal__body .price { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; }
      .mm-modal__body .price .now { font-family: var(--display); font-weight: 800; font-size: 32px; }
      .mm-modal__body .price .old { font-family: var(--mono); font-size: 14px; color: var(--muted); text-decoration: line-through; }
      .mm-modal__body .price .save { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; color: var(--accent); font-weight: 700; background: rgba(232,65,42,0.12); padding: 4px 8px; }
      .mm-modal__row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
      .mm-modal__row .lab { font-family: var(--mono); font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); width: 72px; }
      .mm-modal__row .swatches, .mm-modal__row .sizes { display: flex; gap: 6px; flex: 1; }
      .mm-modal__row .swatches button { width: 32px; height: 32px; border-radius: 50%; border: 1px solid var(--hair-strong); }
      .mm-modal__row .swatches button.is-active { border-color: var(--bone); border-width: 2px; }
      .mm-modal__row .sizes button { min-width: 44px; height: 36px; padding: 0 10px; border: 1px solid var(--hair-strong); color: var(--bone); font-family: var(--mono); font-size: 12px; letter-spacing: 0.08em; }
      .mm-modal__row .sizes button.is-active { background: var(--bone); color: var(--ink); border-color: var(--bone); }
      .mm-modal__cta { display: flex; gap: 8px; margin-top: 8px; }

      /* ───────── SEARCH OVERLAY ───────── */
      .mm-search { position: fixed; inset: 0; z-index: 100; background: rgba(10,9,8,0.96); backdrop-filter: blur(8px); opacity: 0; pointer-events: none; transition: opacity 240ms var(--ease); padding: 80px 24px 32px; overflow-y: auto; }
      .mm-search.is-open { opacity: 1; pointer-events: auto; }
      .mm-search__inner { max-width: 1200px; margin: 0 auto; }
      .mm-search__form { display: grid; grid-template-columns: auto 1fr auto; gap: 16px; align-items: center; padding-bottom: 18px; border-bottom: 1px solid var(--hair); color: var(--muted); }
      .mm-search__form input { background: transparent; border: 0; outline: none; font-family: var(--display); font-weight: 700; font-size: clamp(28px, 5vw, 56px); letter-spacing: -0.01em; color: var(--bone); width: 100%; text-transform: uppercase; }
      .mm-search__form input::placeholder { color: var(--muted-2); }
      .mm-search__close { font-family: var(--mono); font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); padding: 8px 14px; border: 1px solid var(--hair-strong); border-radius: 4px; }
      .mm-search__cols { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 32px; margin-top: 40px; }
      @media (max-width: 800px) { .mm-search__cols { grid-template-columns: 1fr; gap: 24px; } }
      .mm-search h6 { font-family: var(--mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted-2); margin: 0 0 16px; }
      .mm-search ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
      .mm-search ul a, .mm-search ul button { color: var(--bone); font-size: 15px; }
      .mm-search ul a:hover, .mm-search ul button:hover { color: var(--accent); }
      .mm-search__results { display: flex; flex-direction: column; gap: 8px; }
      .mm-search__result { display: grid; grid-template-columns: 60px 1fr auto; gap: 12px; align-items: center; padding: 10px; border: 1px solid var(--hair); cursor: pointer; transition: border-color 180ms var(--ease); }
      .mm-search__result:hover { border-color: var(--accent); }
      .mm-search__result .img { position: relative; width: 60px; height: 60px; background: var(--ink-2); }
      .mm-search__result .img img { width: 100%; height: 100%; object-fit: cover; }
      .mm-search__result .b { font-family: var(--mono); font-size: 10px; letter-spacing: 0.12em; color: var(--muted); text-transform: uppercase; }
      .mm-search__result .n { font-family: var(--display); font-weight: 700; font-size: 14px; text-transform: uppercase; color: var(--bone); }
      .mm-search__result .pr { font-family: var(--display); font-weight: 800; font-size: 16px; }

      /* ───────── COMPARE BAR ───────── */
      .mm-cmpbar { position: fixed; bottom: 0; left: 0; right: 0; z-index: 70; background: var(--ink); border-top: 1px solid var(--hair-strong); transform: translateY(110%); transition: transform 320ms var(--ease); }
      .mm-cmpbar.is-open { transform: translateY(0); }
      @media (max-width: 800px) { .mm-cmpbar.is-open { transform: translateY(0) translateY(-64px); } }
      .mm-cmpbar__inner { display: grid; grid-template-columns: auto 1fr auto; gap: 24px; align-items: center; padding: 14px 0; }
      @media (max-width: 1000px) { .mm-cmpbar__inner { grid-template-columns: 1fr; padding: 14px 0; } }
      .mm-cmpbar__h { font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; display: flex; flex-direction: column; gap: 4px; color: var(--bone); }
      .mm-cmpbar__h strong { color: var(--muted); font-weight: 400; font-size: 10px; }
      .mm-cmpbar__slots { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
      .mm-cmpbar__slot { display: grid; grid-template-columns: 48px 1fr auto; gap: 10px; align-items: center; padding: 8px; background: var(--ink-2); border: 1px solid var(--hair); min-height: 64px; }
      .mm-cmpbar__slot .img { position: relative; width: 48px; height: 48px; background: var(--ink); }
      .mm-cmpbar__slot .img img { width: 100%; height: 100%; object-fit: cover; }
      .mm-cmpbar__slot .info { min-width: 0; }
      .mm-cmpbar__slot .b { font-family: var(--mono); font-size: 9px; letter-spacing: 0.12em; color: var(--muted); text-transform: uppercase; }
      .mm-cmpbar__slot .n { font-family: var(--display); font-weight: 700; font-size: 12px; text-transform: uppercase; color: var(--bone); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .mm-cmpbar__slot .x { width: 24px; height: 24px; display: grid; place-items: center; color: var(--muted); border-radius: 50%; }
      .mm-cmpbar__slot .x:hover { background: var(--accent); color: white; }
      .mm-cmpbar__slot .ph { font-family: var(--mono); font-size: 11px; letter-spacing: 0.14em; color: var(--muted-2); text-transform: uppercase; grid-column: 1 / -1; text-align: center; }
      .mm-cmpbar__actions { display: flex; gap: 8px; align-items: center; }

      /* ───────── TOAST ───────── */
      .mm-toast { position: fixed; bottom: 32px; left: 50%; z-index: 110; display: inline-flex; align-items: center; gap: 10px; padding: 12px 22px; background: var(--bone); color: var(--ink); border-radius: 999px; font-family: var(--mono); font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; transform: translate(-50%, 120%); transition: transform 320ms var(--ease); white-space: nowrap; box-shadow: 0 8px 28px rgba(0,0,0,0.5); }
      .mm-toast.is-show { transform: translate(-50%, 0); }
      .mm-toast .dot { color: var(--accent); }
      @media (max-width: 800px) { .mm-toast { bottom: 80px; } }

      /* ───────── RESPONSIVE HARDENING ───────── */
      .mm-root { overflow-x: clip; }
      .mm-shellbody { min-height: 70vh; background: var(--ink); }
      .mm-root img, .mm-root svg, .mm-root video { max-width: 100%; }
      .mm-root h1, .mm-root h2, .mm-root h3, .mm-root .mm-display { overflow-wrap: break-word; word-break: break-word; }
      @media (max-width: 760px) {
        .mm-hero__h1 { font-size: clamp(2.6rem, 14vw, 5rem); }
        .mm-section { padding: 56px 0; }
        .mm-sh h2 { font-size: clamp(2rem, 8vw, 3rem); max-width: 100%; }
        .mm-footer__grid { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 520px) {
        :root { --gutter: 16px; }
        .mm-hero__h1 { font-size: clamp(2.1rem, 13vw, 3.2rem); }
        .mm-stats__num { font-size: clamp(1.9rem, 9vw, 2.4rem); }
        .mm-footer__grid { grid-template-columns: 1fr; }
        .mm-section { padding: 44px 0; }
        .mm-sh h2,
        .mm-house__intro h2, .mm-heritage__left h2, .mm-community__intro h2,
        .mm-kit__h, .mm-seasons__h, .mm-findbike__left h2, .mm-nl h2 { font-size: clamp(1.8rem, 8.5vw, 2.6rem); }
        .mm-heritage__counters .v { font-size: clamp(2.4rem, 13vw, 3.6rem); }
        .mm-cat__title, .mm-cat--lg .mm-cat__title { font-size: clamp(1.4rem, 7vw, 2rem); }
        .mm-btn { padding: 12px 16px; font-size: 10px; }
      }
    `}</style>
  );
}

/* ────────────────────────────────────────────────────────────────────
   COMPONENTS
   ──────────────────────────────────────────────────────────────────── */

type T = (typeof I18N)[Lang];

function TopBar({
  t,
  lang,
  setLang,
  mode,
  setMode,
}: {
  t: T;
  lang: Lang;
  setLang: (l: Lang) => void;
  mode: "dark" | "light";
  setMode: (m: "dark" | "light") => void;
}) {
  return (
    <div className="mm-root mm-topbar">
      <div className="mm-container">
        <div className="mm-topbar__row">
          <div className="mm-topbar__left">
            <span className="mm-topbar__phone">
              <span className="mm-topbar__phone-dot" />
              {t.helpline}: 210 95 17 150
            </span>
            <span className="mm-sep">·</span>
            <span>{t.free_ship}</span>
            <span className="mm-sep">·</span>
            <span>{t.same_day}</span>
          </div>
          <div className="mm-topbar__right">
            <a href="#">{t.warranty}</a>
            <span className="mm-sep">·</span>
            <a href="#">{t.track_order}</a>
            <div className="mm-mode" role="group" aria-label="Theme">
              <button
                aria-pressed={mode === "dark"}
                onClick={() => setMode("dark")}
                aria-label="Dark mode"
              >
                ◐
              </button>
              <button
                aria-pressed={mode === "light"}
                onClick={() => setMode("light")}
                aria-label="Light mode"
              >
                ☀
              </button>
            </div>
            <div className="mm-lang">
              <button
                aria-pressed={lang === "el"}
                onClick={() => setLang("el")}
              >
                EL
              </button>
              <button
                aria-pressed={lang === "en"}
                onClick={() => setLang("en")}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MainNav({
  t,
  lang,
  cartCount,
  wishCount,
  onOpenSearch,
  onOpenCart,
  onOpenWish,
}: {
  t: T;
  lang: Lang;
  cartCount: number;
  wishCount: number;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenWish: () => void;
}) {
  const [openMega, setOpenMega] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const enter = (k: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMega(k);
  };
  const leave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenMega(null), 160);
  };
  const keepOpen = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const activeRoot = NAV.find((r) => r.slug === openMega) ?? null;

  return (
    <div className="mm-root mm-nav" onMouseLeave={leave}>
      <div className="mm-container">
        <div className="mm-nav__row">
          <a href="/" className="mm-brand">
            <div className="mm-brand__logo">M</div>
            <div>
              <div className="mm-brand__name">MOTO MARKET</div>
              <div className="mm-brand__sub">
                EST. 1982 · ATHENS · THESSALONIKI
              </div>
            </div>
          </a>
          <nav className="mm-links">
            {NAV.map((r) => (
              <a
                key={r.slug}
                href={`/category/${r.slug}`}
                className={openMega === r.slug ? "is-on" : ""}
                data-sale={r.sale ? "1" : undefined}
                onMouseEnter={() => enter(r.slug)}
                onFocus={() => enter(r.slug)}
              >
                {lang === "en" ? r.en : r.el}
                <IconChevronDown />
              </a>
            ))}
          </nav>
          <div className="mm-actions">
            <button
              className="mm-iconbtn"
              onClick={onOpenSearch}
              aria-label="Search"
            >
              <IconSearch />
            </button>
            <button className="mm-iconbtn" aria-label="Account">
              <IconUser />
            </button>
            <button
              className="mm-iconbtn"
              onClick={onOpenWish}
              aria-label="Wishlist"
            >
              <IconHeart />
              {wishCount > 0 && (
                <span className="mm-iconbtn__badge">{wishCount}</span>
              )}
            </button>
            <button
              className="mm-iconbtn"
              onClick={onOpenCart}
              aria-label="Cart"
            >
              <IconCart />
              {cartCount > 0 && (
                <span className="mm-iconbtn__badge">{cartCount}</span>
              )}
            </button>
          </div>
        </div>
      </div>
      {activeRoot && (
        <MegaMenuPanel
          root={activeRoot}
          lang={lang}
          onMouseEnter={keepOpen}
          onMouseLeave={leave}
        />
      )}
    </div>
  );
}

function MegaMenuPanel({
  root,
  lang,
  onMouseEnter,
  onMouseLeave,
}: {
  root: NavRoot;
  lang: Lang;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const l2 = root.children;
  const flat = l2.length > 12 || l2.every((c) => c.children.length === 0);
  return (
    <div
      className="mm-mega"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="mm-container mm-mega__inner mm-mega__inner--flat">
        {flat ? (
          <div className="mm-mega__list">
            {l2.map((c) => (
              <a key={c.slug} href={`/category/${c.slug}`}>
                {c.el}
              </a>
            ))}
          </div>
        ) : (
          <div className="mm-mega__cols">
            {l2.map((col) => (
              <div className="mm-mega__col" key={col.slug}>
                <h4>
                  <a href={`/category/${col.slug}`}>{col.el}</a>
                </h4>
                <ul>
                  {col.children.slice(0, 7).map((it) => (
                    <li key={it.slug}>
                      <a href={`/category/${it.slug}`}>{it.el}</a>
                    </li>
                  ))}
                  {col.children.length > 7 && (
                    <li>
                      <a
                        href={`/category/${col.slug}`}
                        className="mm-mega__more"
                      >
                        {lang === "el"
                          ? `+${col.children.length - 7} ακόμη`
                          : `+${col.children.length - 7} more`}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}
        <a href={`/category/${root.slug}`} className="mm-mega__seeall">
          {ROOT_IMG[root.slug] && (
            <div className="mm-mega__seeall-img">
              <Image
                src={ROOT_IMG[root.slug]}
                alt={root.el}
                fill
                sizes="280px"
              />
            </div>
          )}
          <span className="tag">
            {lang === "el" ? "Όλη η κατηγορία" : "Browse all"}
          </span>
          <h3>{lang === "en" ? root.en : root.el}</h3>
          <span className="link">
            {lang === "el" ? "Δες όλα τα προϊόντα" : "View all products"}{" "}
            <IconArrowUpRight />
          </span>
        </a>
      </div>
    </div>
  );
}

/* Hero with mouse parallax + animated character reveal */
function Hero({ t, lang }: { t: T; lang: Lang }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--mx", (dx * 16).toFixed(2) + "px");
        el.style.setProperty("--my", (dy * 16).toFixed(2) + "px");
      });
    };
    const onLeave = () => {
      el.style.setProperty("--mx", "0px");
      el.style.setProperty("--my", "0px");
    };
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <section ref={ref} className="mm-root mm-hero">
      <div className="mm-hero__bg">
        <Image src={A.editorial} alt="" fill priority sizes="100vw" />
      </div>
      <div className="mm-grain" />
      <div className="mm-scanlines" />
      <div className="mm-hero__vignette" />
      <div className="mm-hero__vert">
        M·M · {lang === "el" ? "ΤΕΥΧΟΣ ΝΟ. 44" : "ISSUE NO. 44"} · 2026
      </div>

      <div className="mm-hero__grid">
        <div className="mm-container mm-hero__content">
          <div className="mm-hero__top">
            <div className="mm-hero__chip">
              <span className="mm-live" />
              {t.hero_chip}
            </div>
            <div className="mm-hero__top-right">
              <strong>{t.hero_meta_loc}</strong>
              <br />
              {t.hero_meta_since}
            </div>
          </div>

          <div className="mm-hero__center">
            <span className="mm-hero__kicker">{t.hero_kicker}</span>
            <h1 className="mm-hero__h1" key={lang}>
              <AnimatedText text={t.hero_punch_a} delayBase={0.1} />
              <br />
              <span className="accent">
                <AnimatedText text={t.hero_punch_b} delayBase={0.5} />
              </span>
            </h1>
            <div className="mm-hero__sub">
              <p>{t.hero_provoke_sub}</p>
              <div className="mm-hero__cta">
                <button className="mm-btn mm-btn--primary">
                  {t.hero_cta_shop} <IconArrowRight />
                </button>
                <button className="mm-btn mm-btn--ghost">
                  {t.hero_cta_find}
                </button>
              </div>
            </div>
          </div>

          <div className="mm-hero__bottom">
            <div className="mm-hero__cell">
              <span className="label">{t.stat_brands}</span>
              <span className="value">{t.stat_brands_v}</span>
            </div>
            <div className="mm-hero__cell">
              <span className="label">{t.stat_products}</span>
              <span className="value">{t.stat_products_v}</span>
            </div>
            <div className="mm-hero__cell">
              <span className="label">{t.stat_years}</span>
              <span className="value">{t.stat_years_v}</span>
            </div>
            <div className="mm-hero__cell">
              <span className="label">{t.stat_ship}</span>
              <span className="value">{t.stat_ship_v}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function AnimatedText({
  text,
  delayBase = 0,
}: {
  text: string;
  delayBase?: number;
}) {
  const chars = String(text).split("");
  return (
    <span>
      {chars.map((c, i) => (
        <span
          key={i}
          className="mm-ch"
          style={{ animationDelay: delayBase + i * 0.04 + "s" }}
        >
          {c === " " ? " " : c}
        </span>
      ))}
    </span>
  );
}

/* CountUp on view */
function useCountUp(target: number, duration = 1600) {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const fired = useRef(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (ents) => {
        ents.forEach((e) => {
          if (e.isIntersecting && !fired.current) {
            fired.current = true;
            const start = performance.now();
            const ease = (x: number) => 1 - Math.pow(1 - x, 3);
            const tick = (now: number) => {
              const p = Math.min(1, (now - start) / duration);
              setV(target * ease(p));
              if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.4 },
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [target, duration]);
  return [v, ref] as const;
}

function CountUp({
  to,
  format,
}: {
  to: number;
  format?: (v: number) => string;
}) {
  const [v, ref] = useCountUp(to);
  return <span ref={ref}>{format ? format(v) : Math.round(v).toString()}</span>;
}

function StatsStrip({ t }: { t: T }) {
  return (
    <section className="mm-root mm-stats">
      <div className="mm-container">
        <div className="mm-stats__row">
          <div className="mm-stats__cell">
            <span className="mm-stats__num">
              <CountUp to={240} />
              <span className="unit">k+</span>
            </span>
            <span className="mm-stats__lbl">{t.stats_orders}</span>
          </div>
          <div className="mm-stats__cell">
            <span className="mm-stats__num">
              <CountUp
                to={1.2}
                format={(v) => "<" + v.toFixed(1).replace(".", ",")}
              />
              <span className="unit">%</span>
            </span>
            <span className="mm-stats__lbl">{t.stats_returns}</span>
          </div>
          <div className="mm-stats__cell">
            <span className="mm-stats__num">
              <CountUp
                to={4.8}
                format={(v) => v.toFixed(1).replace(".", ",")}
              />
              <span className="unit">★</span>
            </span>
            <span className="mm-stats__lbl">{t.stats_rating}</span>
          </div>
          <div className="mm-stats__cell">
            <span className="mm-stats__num">
              <CountUp to={44} />
              <span className="unit">k</span>
            </span>
            <span className="mm-stats__lbl">{t.stats_riders}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function PromiseBar({ t }: { t: T }) {
  const items = [
    { n: "01", title: t.promise1_t, desc: t.promise1_d },
    { n: "02", title: t.promise2_t, desc: t.promise2_d },
    { n: "03", title: t.promise3_t, desc: t.promise3_d },
    { n: "04", title: t.promise4_t, desc: t.promise4_d },
  ];
  return (
    <section className="mm-root mm-promises">
      <div className="mm-container">
        <div className="mm-promises__grid">
          {items.map((p) => (
            <div className="mm-promise" key={p.n}>
              <span className="mm-promise__num">{p.n}</span>
              <div>
                <h4 className="mm-promise__title">{p.title}</h4>
                <p className="mm-promise__desc">{p.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  h,
  h2,
  meta,
  cta,
}: {
  eyebrow: string;
  h: string;
  h2?: string;
  meta?: string;
  cta?: string;
}) {
  return (
    <div className="mm-sh">
      <div>
        <span className="mm-eyebrow">{eyebrow}</span>
        <h2 className="mm-display">
          {h} {h2 && <span className="accent">{h2}</span>}
        </h2>
      </div>
      {(meta || cta) && (
        <div className="mm-sh__right">
          {meta && <span>{meta}</span>}
          {cta && (
            <button className="mm-btn mm-btn--ghost">
              {cta} <IconArrowRight />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Categories({ t, lang }: { t: T; lang: Lang }) {
  return (
    <section className="mm-root mm-section">
      <div className="mm-container">
        <SectionHeader
          eyebrow={t.sec_cats_eyebrow}
          h={t.sec_cats_h}
          meta={t.sec_cats_meta}
          cta={t.sec_cats_all}
        />
        <div className="mm-cats">
          {CATEGORIES.map((c) => {
            const cls =
              c.size === "lg"
                ? "mm-cat--lg"
                : c.size === "md"
                  ? "mm-cat--md"
                  : "";
            return (
              <a
                key={c.id}
                href={`/category/${c.id}`}
                className={`mm-cat ${cls}`}
              >
                <div className="mm-cat__img">
                  <Image
                    src={c.img}
                    alt={c[lang].title}
                    fill
                    sizes="(max-width: 1100px) 100vw, 50vw"
                  />
                </div>
                <div className="mm-cat__overlay" />
                <div className="mm-cat__top">
                  <span>{c.num} / 08</span>
                  <span>
                    {c.count.toLocaleString("el-GR")} {t.items_label}
                  </span>
                </div>
                <div className="mm-cat__arrow">
                  <IconArrowUpRight />
                </div>
                <div className="mm-cat__bottom">
                  <span className="mm-cat__sub">{c[lang].sub}</span>
                  <h3 className="mm-cat__title">{c[lang].title}</h3>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function productSignals(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
  const stock = Math.abs(h) % 100;
  return {
    lowStock: stock < 22,
    soldWeek: (Math.abs(h >> 7) % 28) + 6,
    viewing: (Math.abs(h >> 11) % 24) + 3,
  };
}

type CardHandlers = {
  onQuickView?: (p: Product) => void;
  onAdd?: (p: Product) => void;
  wishlist?: string[];
  onWish?: (id: string) => void;
  compare?: Product[];
  onCompare?: (p: Product) => void;
};

export function ProductCard({
  p,
  t,
  lang,
  onQuickView,
  onAdd,
  wishlist,
  onWish,
  compare,
  onCompare,
}: { p: Product; t: T; lang: Lang } & CardHandlers) {
  const discount = p.oldPrice
    ? Math.round((1 - p.price / p.oldPrice) * 100)
    : 0;
  const s = productSignals(p.id);
  const isWished = wishlist?.includes(p.id) ?? false;
  const isCompared = compare?.some((x) => x.id === p.id) ?? false;
  return (
    <div className="mm-product" onClick={() => onQuickView?.(p)}>
      <div className="mm-product__media">
        <Image
          src={p.img}
          alt={p[lang].name}
          fill
          sizes="(max-width: 1100px) 50vw, 25vw"
        />
        <div className="mm-product__badges">
          {p.isSale && (
            <span className="mm-badge mm-badge--sale">−{discount}%</span>
          )}
          {p.isNew && <span className="mm-badge mm-badge--new">NEW</span>}
          {p.isHouse && <span className="mm-badge mm-badge--house">HOUSE</span>}
        </div>
        <button
          className={"mm-product__cmp " + (isCompared ? "is-on" : "")}
          onClick={(e) => {
            e.stopPropagation();
            onCompare?.(p);
          }}
          aria-label="Compare"
        >
          ⇌
        </button>
        <button
          className={"mm-product__wish " + (isWished ? "is-on" : "")}
          onClick={(e) => {
            e.stopPropagation();
            onWish?.(p.id);
          }}
          aria-label="Wishlist"
        >
          <IconHeart filled={isWished} />
        </button>
        <span className="mm-product__sold">
          <span className="dot" />
          {s.soldWeek} {t.sold_units}
        </span>
        <button
          className="mm-product__quick"
          onClick={(e) => {
            e.stopPropagation();
            onAdd?.(p);
          }}
        >
          + {t.add_to_cart}
        </button>
      </div>
      <span className="mm-product__brand">
        {p.brand} · {p[lang].cat}
      </span>
      <h4 className="mm-product__name">{p[lang].name}</h4>
      <div className="mm-product__price">
        <span className="now">€{p.price.toFixed(2).replace(".", ",")}</span>
        {p.oldPrice && (
          <span className="old">
            €{p.oldPrice.toFixed(2).replace(".", ",")}
          </span>
        )}
        {discount > 0 && <span className="pct">−{discount}%</span>}
      </div>
      <div className={"mm-product__stock " + (s.lowStock ? "low" : "")}>
        <span className="ind" />
        {s.lowStock ? t.stock_low : t.stock_in}
        <span className="viewers">
          · <strong>{s.viewing}</strong> {t.viewing_now}
        </span>
      </div>
      {p.swatches && (
        <div className="mm-product__swatches">
          {p.swatches.map((sw, i) => (
            <span
              key={i}
              className="mm-product__swatch"
              style={{ background: sw }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NewArrivals({
  t,
  lang,
  onQuickView,
  onAdd,
  wishlist,
  onWish,
  compare,
  onCompare,
}: { t: T; lang: Lang } & CardHandlers) {
  return (
    <section className="mm-root mm-section">
      <div className="mm-container">
        <SectionHeader
          eyebrow={t.sec_new_eyebrow}
          h={t.sec_new_h}
          meta={t.sec_new_meta}
          cta={t.sec_new_all}
        />
        <div className="mm-products">
          {FEATURED.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              t={t}
              lang={lang}
              onQuickView={onQuickView}
              onAdd={onAdd}
              wishlist={wishlist}
              onWish={onWish}
              compare={compare}
              onCompare={onCompare}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Bestsellers({
  t,
  lang,
  onQuickView,
  onAdd,
  wishlist,
  onWish,
  compare,
  onCompare,
}: { t: T; lang: Lang } & CardHandlers) {
  return (
    <section className="mm-root mm-section">
      <div className="mm-container">
        <SectionHeader
          eyebrow={t.sec_best_eyebrow}
          h={t.sec_best_h}
          meta={t.sec_best_meta}
          cta={t.sec_best_all}
        />
        <div className="mm-products">
          {BESTSELLERS.map((p) => (
            <ProductCard
              key={p.id}
              p={p}
              t={t}
              lang={lang}
              onQuickView={onQuickView}
              onAdd={onAdd}
              wishlist={wishlist}
              onWish={onWish}
              compare={compare}
              onCompare={onCompare}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HouseBrands({ t, lang }: { t: T; lang: Lang }) {
  return (
    <section className="mm-root mm-house">
      <div className="mm-container">
        <div className="mm-house__intro">
          <span className="mm-eyebrow">{t.sec_house_eyebrow}</span>
          <h2>
            {t.sec_house_h} <em>{t.sec_house_h2}</em>.
          </h2>
          <p>{t.sec_house_p}</p>
        </div>
        <div className="mm-house__grid">
          {HOUSE_BRANDS.map((b) => (
            <div key={b.id} className="mm-brand-card">
              <div className="mm-brand-card__bg">
                <Image
                  src={b.img}
                  alt={b.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                />
              </div>
              <div>
                <h3 className="mm-brand-card__wordmark">{b.name}</h3>
                <span className="mm-brand-card__tag">{b[lang].tag}</span>
              </div>
              <div>
                <p className="mm-brand-card__desc">{b[lang].desc}</p>
                <a href="#" className="mm-brand-card__cta">
                  {t.house_shop_all}
                  {b.name} <IconArrowUpRight />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FindBike({ t, lang }: { t: T; lang: Lang }) {
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [engine, setEngine] = useState("");
  const years: number[] = [];
  for (let y = 2026; y >= 1990; y--) years.push(y);
  return (
    <section className="mm-root mm-findbike">
      <div className="mm-findbike__hazard" />
      <div className="mm-container">
        <div className="mm-findbike__inner">
          <div className="mm-findbike__left">
            <span className="mm-eyebrow">{t.sec_find_eyebrow}</span>
            <h2>
              {t.sec_find_h} <em>{t.sec_find_h2}</em>
            </h2>
            <p>{t.sec_find_p}</p>
          </div>
          <div className="mm-findbike__panel">
            <span className="mm-findbike__panel-label">
              — {lang === "el" ? "ΕΠΙΛΟΓΗ ΜΗΧΑΝΗΣ" : "BIKE PICKER"}
            </span>
            <div className="mm-fields">
              <label className="mm-field">
                <span className="mm-field__lbl">{t.find_year}</span>
                <select
                  className="mm-field__select"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                >
                  <option value="">— {t.find_year} —</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mm-field">
                <span className="mm-field__lbl">{t.find_make}</span>
                <select
                  className="mm-field__select"
                  value={make}
                  onChange={(e) => {
                    setMake(e.target.value);
                    setModel("");
                  }}
                >
                  <option value="">— {t.find_make} —</option>
                  {BIKE_BRANDS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mm-field">
                <span className="mm-field__lbl">{t.find_model}</span>
                <select
                  className="mm-field__select"
                  value={model}
                  disabled={!make}
                  onChange={(e) => setModel(e.target.value)}
                >
                  <option value="">— {t.find_model} —</option>
                  {(MODELS_BY[make] || []).map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <label className="mm-field">
                <span className="mm-field__lbl">{t.find_engine}</span>
                <select
                  className="mm-field__select"
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                >
                  <option value="">— cc —</option>
                  {[
                    "125",
                    "250",
                    "500",
                    "650",
                    "700",
                    "900",
                    "1000",
                    "1200+",
                  ].map((cc) => (
                    <option key={cc}>{cc}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mm-findbike__cta">
              <button className="mm-btn mm-btn--primary">
                {t.find_cta} <IconArrowRight />
              </button>
              <button
                className="mm-btn mm-btn--ghost"
                onClick={() => {
                  setYear("");
                  setMake("");
                  setModel("");
                  setEngine("");
                }}
              >
                {t.find_clear}
              </button>
            </div>
            <div style={{ marginTop: 24 }}>
              <span className="mm-findbike__panel-label">— {t.find_or}</span>
              <div className="mm-findbike__brands">
                {BIKE_BRANDS.slice(0, 12).map((b) => (
                  <button key={b} onClick={() => setMake(b)}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Heritage({ t, lang }: { t: T; lang: Lang }) {
  return (
    <section className="mm-root mm-heritage">
      <div className="mm-container">
        <div className="mm-heritage__grid">
          <div className="mm-heritage__left">
            <span className="mm-eyebrow">{t.sec_heritage_eyebrow}</span>
            <h2>
              {t.sec_heritage_h_pre}
              <span className="year">{t.sec_heritage_h_year}</span>
              {t.sec_heritage_h_post}
            </h2>
            <p>{t.sec_heritage_p}</p>
            <div className="mm-heritage__stores">
              {STORES.map((s) => (
                <div className="mm-store" key={s.city.en}>
                  <h4 className="mm-store__city">{s.city[lang]}</h4>
                  <p className="mm-store__addr">{s.addr[lang]}</p>
                  <a
                    className="mm-store__phone"
                    href={`tel:${s.phone.replace(/\s/g, "")}`}
                  >
                    T. {s.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>
          <div className="mm-heritage__right">
            <Image
              src={A.editorial}
              alt=""
              fill
              sizes="(max-width: 1000px) 100vw, 50vw"
            />
            <span className="mm-heritage__tag">{t.sec_heritage_tag}</span>
            <div className="mm-heritage__right-bottom">
              <span>{t.sec_heritage_bottom_l}</span>
              <span>{t.sec_heritage_bottom_r}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function BrandCarousel({ t }: { t: T }) {
  return (
    <section className="mm-root mm-brandscarousel">
      <div className="mm-container">
        <div className="mm-brandscarousel__title">{t.sec_brands_title}</div>
      </div>
      <div className="mm-brandscarousel__track">
        <div>
          {CARRIED_BRANDS.map((b) => (
            <span key={b} className="mm-brand-logo">
              {b}
            </span>
          ))}
        </div>
        <div>
          {CARRIED_BRANDS.map((b) => (
            <span key={b + "2"} className="mm-brand-logo">
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter({ t }: { t: T }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return (
    <section className="mm-root mm-nl">
      <div className="mm-container">
        <div className="mm-nl__inner">
          <div>
            <span className="mm-eyebrow">{t.nl_eyebrow}</span>
            <h2>{t.nl_h}</h2>
            <p>{t.nl_p}</p>
          </div>
          <div>
            {done ? (
              <div style={{ padding: "20px 0", color: "var(--bone)" }}>
                <div
                  className="mm-display"
                  style={{ fontSize: 48, color: "var(--accent)" }}
                >
                  ✓
                </div>
                <p style={{ marginTop: 12, color: "var(--bone-2)" }}>
                  You're in.
                </p>
              </div>
            ) : (
              <form
                className="mm-nl__form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (email) setDone(true);
                }}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.nl_placeholder}
                  required
                />
                <button type="submit">
                  {t.nl_cta} <IconArrowRight />
                </button>
              </form>
            )}
            <div className="mm-nl__perks">
              <span>{t.nl_perk1}</span>
              <span>· {t.nl_perk2}</span>
              <span>· {t.nl_perk3}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ t, lang }: { t: T; lang: Lang }) {
  return (
    <footer className="mm-root mm-footer">
      <div className="mm-container">
        <div className="mm-footer__grid">
          <div>
            <a href="#" className="mm-brand">
              <div className="mm-brand__logo">M</div>
              <div>
                <div className="mm-brand__name">MOTO MARKET</div>
                <div className="mm-brand__sub">EST. 1982</div>
              </div>
            </a>
            <p>{t.foot_blurb}</p>
            <div className="mm-footer__socials">
              <a href="#">
                <IconInsta />
              </a>
              <a href="#">
                <IconFacebook />
              </a>
              <a href="#">
                <IconYouTube />
              </a>
            </div>
          </div>
          <div>
            <h5>{t.foot_shop}</h5>
            <ul>
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <a href={`/category/${c.id}`}>{c[lang].title}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5>{t.foot_help}</h5>
            <ul>
              <li>
                <a href="#">
                  {lang === "el"
                    ? "Αποστολές & επιστροφές"
                    : "Shipping & returns"}
                </a>
              </li>
              <li>
                <a href="#">
                  {lang === "el" ? "Τρόποι πληρωμής" : "Payment methods"}
                </a>
              </li>
              <li>
                <a href="#">{lang === "el" ? "Εγγύηση" : "Warranty"}</a>
              </li>
              <li>
                <a href="#">
                  {lang === "el" ? "Οδηγός μεγεθών" : "Size guide"}
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h5>{t.foot_about}</h5>
            <ul>
              <li>
                <a href="#">{lang === "el" ? "Η εταιρεία" : "About"}</a>
              </li>
              <li>
                <a href="#">Brands</a>
              </li>
              <li>
                <a href="#">Partners</a>
              </li>
              <li>
                <a href="#">{lang === "el" ? "ΕΣΠΑ" : "ESPA"}</a>
              </li>
            </ul>
          </div>
          <div>
            <h5>{t.foot_contact}</h5>
            <ul>
              {STORES.map((s) => (
                <li key={s.city.en}>
                  <a href="#">
                    <strong style={{ color: "var(--bone)" }}>
                      {s.city[lang]}
                    </strong>
                    <br />
                    {s.phone}
                  </a>
                </li>
              ))}
              <li>
                <a href="mailto:customer@motomarket.gr">
                  customer@motomarket.gr
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mm-footer__bottom">
          <span>© 1982 — 2026 Moto Market</span>
          <span>
            {lang === "el"
              ? "Φτιαγμένο με αγάπη στην Ελλάδα"
              : "Made with love in Greece"}
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ════════════════════════════════════════════════════════════════════
   FOUR SEASONS — pinned-scroll storytelling
   ════════════════════════════════════════════════════════════════════ */
function FourSeasons({ t: _t, lang }: { t: T; lang: Lang }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      if (total <= 0) return;
      const past = Math.max(0, -r.top);
      const p = Math.max(0, Math.min(1, past / total));
      setProgress(p);
      setActive(Math.min(SEASONS.length - 1, Math.floor(p * SEASONS.length)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const s = SEASONS[active];

  return (
    <section className="mm-root mm-seasons">
      <div ref={wrapRef} className="mm-seasons__wrap">
        <div className="mm-seasons__sticky">
          <div className="mm-container mm-seasons__grid">
            <div className="mm-seasons__left">
              <div
                className="mm-seasons__blob"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${s.color}33, transparent 65%)`,
                }}
              />
              <SeasonBikeSvg color={s.color} />
              <span className="mm-seasons__lab mm-seasons__lab--tr">
                {lang === "el" ? "ΚΡΑΝΟΣ" : "HELMET"}
              </span>
              <span className="mm-seasons__lab mm-seasons__lab--tl">
                {lang === "el" ? "ΜΠΟΥΦΑΝ" : "JACKET"}
              </span>
              <span className="mm-seasons__lab mm-seasons__lab--br">
                {lang === "el" ? "ΓΑΝΤΙΑ" : "GLOVES"}
              </span>
              <span className="mm-seasons__lab mm-seasons__lab--bl">
                {lang === "el" ? "ΜΠΟΤΕΣ" : "BOOTS"}
              </span>
            </div>

            <div className="mm-seasons__right">
              <span className="mm-eyebrow">
                {lang === "el"
                  ? "Μία μηχανή · Τέσσερις εποχές"
                  : "One bike · Four seasons"}
              </span>
              <h2 className="mm-seasons__h">
                {lang === "el" ? "Ίδια μηχανή." : "Same bike."}{" "}
                <span className="accent">
                  {lang === "el" ? "Τέσσερα κιτ." : "Four kits."}
                </span>
              </h2>
              <div className="mm-seasons__nav">
                {SEASONS.map((sn, i) => (
                  <button
                    key={sn.id}
                    className={i === active ? "is-on" : ""}
                    style={{ "--c": sn.color } as React.CSSProperties}
                    onClick={() => {
                      const el = wrapRef.current;
                      if (!el) return;
                      const r = el.getBoundingClientRect();
                      const total = r.height - window.innerHeight;
                      const tp = (i + 0.5) / SEASONS.length;
                      window.scrollTo({
                        top: window.scrollY + r.top + total * tp,
                        behavior: "smooth",
                      });
                    }}
                  >
                    <span className="num">0{i + 1}</span>
                    {sn[lang].label}
                  </button>
                ))}
              </div>
              <div className="mm-seasons__panel">
                <span className="temp">
                  {s.temp} · {s[lang].months}
                </span>
                <h3>{s[lang].h}</h3>
                <p>{s[lang].p}</p>
                <ul className="mm-seasons__kit">
                  {s[lang].kit.map((k, j) => (
                    <li key={j}>
                      <span className="n">0{j + 1}</span>
                      <span>{k}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="mm-seasons__bar"
                style={{ "--p": progress * 100 + "%" } as React.CSSProperties}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SeasonBikeSvg({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 560 380"
      fill="none"
      className="mm-seasons__svg"
      aria-hidden
    >
      <g
        stroke={color}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ transition: "stroke 800ms cubic-bezier(.2,.7,.2,1)" }}
      >
        <circle cx="120" cy="280" r="56" />
        <circle cx="120" cy="280" r="22" />
        <circle cx="440" cy="280" r="56" />
        <circle cx="440" cy="280" r="22" />
        <line x1="120" y1="224" x2="120" y2="336" opacity="0.4" />
        <line x1="64" y1="280" x2="176" y2="280" opacity="0.4" />
        <line x1="440" y1="224" x2="440" y2="336" opacity="0.4" />
        <line x1="384" y1="280" x2="496" y2="280" opacity="0.4" />
        <path d="M150 240 L210 200 L320 200 L370 210 L410 240" />
        <path d="M210 200 Q260 150 320 200" />
        <path d="M155 240 Q220 270 280 270 Q360 270 400 240" />
        <rect x="230" y="220" width="100" height="40" rx="4" />
        <line x1="150" y1="240" x2="120" y2="280" />
        <line x1="120" y1="280" x2="170" y2="170" />
        <line x1="170" y1="170" x2="200" y2="180" />
        <line x1="170" y1="170" x2="140" y2="180" />
        <path d="M320 200 L380 200 L400 230" />
        <path
          d="M250 200 L260 150 L280 130 L300 130 L310 150 L320 200"
          strokeWidth="2"
          opacity="0.6"
        />
        <circle cx="290" cy="115" r="18" opacity="0.6" />
        <line x1="270" y1="160" x2="200" y2="180" opacity="0.5" />
        <line x1="310" y1="160" x2="380" y2="180" opacity="0.5" />
      </g>
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
   KIT BUILDER — 5-step configurator + 8% bundle discount
   ════════════════════════════════════════════════════════════════════ */
function KitBuilder({
  t,
  lang,
  onAddBundle,
}: {
  t: T;
  lang: Lang;
  onAddBundle?: (items: Product[], discount: number) => void;
}) {
  const [active, setActive] = useState<number>(0);
  const [picks, setPicks] = useState<Record<KitStep, KitItem | undefined>>(
    {} as Record<KitStep, KitItem | undefined>,
  );

  const stepLabels: Record<KitStep, { el: string; en: string }> = {
    helmet: { el: "Κράνος", en: "Helmet" },
    jacket: { el: "Μπουφάν", en: "Jacket" },
    pants: { el: "Παντελόνι", en: "Pants" },
    gloves: { el: "Γάντια", en: "Gloves" },
    boots: { el: "Μπότες", en: "Boots" },
  };

  const pickedCount = Object.values(picks).filter(Boolean).length;
  const progress = (pickedCount / KIT_STEPS.length) * 100;
  const subtotal = (Object.values(picks).filter(Boolean) as KitItem[]).reduce(
    (s, it) => s + it.price,
    0,
  );
  const oldTotal = (Object.values(picks).filter(Boolean) as KitItem[]).reduce(
    (s, it) => s + (it.oldPrice || it.price),
    0,
  );
  const isFull = pickedCount === KIT_STEPS.length;
  const bundleDiscount = isFull ? subtotal * 0.08 : 0;
  const finalTotal = subtotal - bundleDiscount;
  const totalSavings = oldTotal - subtotal + bundleDiscount;

  const pick = (step: KitStep, item: KitItem) => {
    setPicks((prev) => ({ ...prev, [step]: item }));
    setTimeout(() => {
      const nextEmpty = KIT_STEPS.findIndex(
        (s, i) => i > active && !picks[s] && s !== step,
      );
      if (nextEmpty >= 0) setActive(nextEmpty);
      else if (active < KIT_STEPS.length - 1) setActive(active + 1);
    }, 350);
  };

  const currentStep = KIT_STEPS[active];

  return (
    <section className="mm-root mm-kit">
      <div className="mm-container">
        <div className="mm-kit__intro">
          <span className="mm-eyebrow">
            {lang === "el" ? "Build your kit" : "Build your kit"}
          </span>
          <h2 className="mm-kit__h">
            {lang === "el" ? "Φτιάξε το" : "Build your"}{" "}
            <em>{lang === "el" ? "setup σου" : "setup"}</em>.
          </h2>
          <p className="mm-kit__p">
            {lang === "el"
              ? "Διάλεξε τα 5 essentials. Όταν τα έχεις όλα, σου κόβουμε επιπλέον 8% στο σύνολο."
              : "Pick the 5 essentials. Get all five and we'll cut 8% off the total."}
          </p>
        </div>

        <div className="mm-kit__layout">
          <div className="mm-kit__steps">
            {KIT_STEPS.map((s, i) => {
              const picked = picks[s];
              return (
                <button
                  key={s}
                  className={
                    "mm-kit__step " + (i === active ? "is-active" : "")
                  }
                  onClick={() => setActive(i)}
                >
                  <span className="num">0{i + 1}</span>
                  <div>
                    <span className="lbl">{stepLabels[s][lang]}</span>
                    <span className="sub">
                      {picked
                        ? `${picked.brand} · €${picked.price.toFixed(2).replace(".", ",")}`
                        : lang === "el"
                          ? "Διάλεξε"
                          : "Pick one"}
                    </span>
                  </div>
                  {picked && <span className="ok">✓</span>}
                </button>
              );
            })}
          </div>

          <div className="mm-kit__main">
            <div className="mm-kit__progress">
              <span>
                {lang === "el" ? "Πρόοδος" : "Progress"} · {pickedCount}/
                {KIT_STEPS.length}
              </span>
              <div className="bar">
                <div style={{ width: progress + "%" }} />
              </div>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="mm-kit__opts">
              {KIT[currentStep].map((it) => {
                const isPicked = picks[currentStep]?.id === it.id;
                return (
                  <div
                    key={it.id}
                    className={"mm-kit__opt " + (isPicked ? "is-picked" : "")}
                    onClick={() => pick(currentStep, it)}
                  >
                    <div className="mm-kit__opt-media">
                      <Image src={it.img} alt={it[lang]} fill sizes="33vw" />
                      <span className="dot">{isPicked ? "✓" : "+"}</span>
                    </div>
                    <span className="brand">{it.brand}</span>
                    <h4>{it[lang]}</h4>
                    <span className="price">
                      €{it.price.toFixed(2).replace(".", ",")}
                      {it.oldPrice && (
                        <span className="old">
                          €{it.oldPrice.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mm-kit__totals">
              <div>
                <span className="lbl">
                  {lang === "el" ? "Σύνολο κιτ" : "Kit total"}
                </span>
                <span className="val">
                  €{finalTotal.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div>
                <span className="lbl">
                  {lang === "el" ? "Γλυτώνεις" : "You save"}
                </span>
                <span className="val savings">
                  −€{totalSavings.toFixed(2).replace(".", ",")}
                </span>
              </div>
              <div>
                <span className="lbl">−8% bundle</span>
                <span className="val amber">{isFull ? "✓ ON" : "— —"}</span>
              </div>
              <button
                className="mm-btn mm-btn--primary"
                disabled={pickedCount === 0}
                style={{ opacity: pickedCount === 0 ? 0.4 : 1 }}
                onClick={() => {
                  const picked = Object.values(picks).filter(
                    Boolean,
                  ) as KitItem[];
                  const asProducts: Product[] = picked.map((k) => ({
                    id: k.id,
                    brand: k.brand,
                    el: { name: k.el, cat: lang === "el" ? "Kit" : "Kit" },
                    en: { name: k.en, cat: "Kit" },
                    price: k.price,
                    oldPrice: k.oldPrice,
                    img: k.img,
                  }));
                  onAddBundle?.(asProducts, bundleDiscount);
                }}
              >
                {lang === "el" ? "Προσθήκη κιτ στο καλάθι" : "Add kit to cart"}{" "}
                <IconArrowRight />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   HERITAGE TIMELINE — 3 counters + interactive milestones
   ════════════════════════════════════════════════════════════════════ */
function HeritageTimeline({ t, lang }: { t: T; lang: Lang }) {
  const [active, setActive] = useState(TIMELINE.length - 1);
  return (
    <section className="mm-root mm-heritage">
      <div className="mm-container">
        <div className="mm-heritage__counters">
          <div>
            <div className="v">
              <CountUp to={44} />
            </div>
            <div className="l">
              {lang === "el" ? "Χρόνια στο πλευρό σου" : "Years by your side"}
            </div>
          </div>
          <div>
            <div className="v">
              <CountUp to={240} />
              <span className="pl">k+</span>
            </div>
            <div className="l">
              {lang === "el" ? "Παραγγελίες" : "Orders shipped"}
            </div>
          </div>
          <div>
            <div className="v">
              <CountUp to={2} />
            </div>
            <div className="l">
              {lang === "el" ? "Φυσικά καταστήματα" : "Physical stores"}
            </div>
          </div>
        </div>

        <div className="mm-heritage__grid">
          <div className="mm-heritage__left">
            <span className="mm-eyebrow">{t.sec_heritage_eyebrow}</span>
            <h2>
              {t.sec_heritage_h_pre}
              <br />
              <span className="year">{t.sec_heritage_h_year}.</span>
            </h2>
            <p>{t.sec_heritage_p}</p>
            <div className="mm-heritage__stores">
              {STORES.map((s) => (
                <div className="mm-store" key={s.city.en}>
                  <h4 className="mm-store__city">{s.city[lang]}</h4>
                  <p className="mm-store__addr">{s.addr[lang]}</p>
                  <a
                    className="mm-store__phone"
                    href={`tel:${s.phone.replace(/\s/g, "")}`}
                  >
                    T. {s.phone}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="mm-timeline">
            <div className="mm-timeline__rail">
              {TIMELINE.map((m, i) => (
                <button
                  key={m.year}
                  className={"mm-timeline__yr " + (i === active ? "is-on" : "")}
                  onClick={() => setActive(i)}
                >
                  {m.year}
                </button>
              ))}
            </div>
            <div className="mm-timeline__panel">
              <h3>{TIMELINE[active][lang].h}</h3>
              <p>{TIMELINE[active][lang].p}</p>
              <div className="mm-timeline__photo">
                <Image
                  src={A.editorial}
                  alt=""
                  fill
                  sizes="(max-width: 1000px) 100vw, 50vw"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   JOURNAL / FIELD NOTES
   ════════════════════════════════════════════════════════════════════ */
function Journal({ t: _t, lang }: { t: T; lang: Lang }) {
  return (
    <section className="mm-root mm-section">
      <div className="mm-container">
        <SectionHeader
          eyebrow={lang === "el" ? "Field Notes" : "Field Notes"}
          h={lang === "el" ? "Δες πριν" : "Read before"}
          h2={lang === "el" ? "αγοράσεις." : "you buy."}
          meta={
            lang === "el"
              ? "Buyer guides · Συγκρίσεις"
              : "Buyer guides · Comparisons"
          }
        />
        <div className="mm-journal">
          {JOURNAL.map((j) => (
            <article key={j.id} className="mm-journal__card">
              <div className="mm-journal__media">
                <Image
                  src={j.img}
                  alt={j[lang].h}
                  fill
                  sizes="(max-width: 800px) 100vw, 25vw"
                />
                <span className="mm-journal__tag">{j[lang].tag}</span>
              </div>
              <h3>{j[lang].h}</h3>
              <p>{j[lang].excerpt}</p>
              <div className="mm-journal__foot">
                <span>{j.author[lang]}</span>
                <span>{j.read} min read</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   COMMUNITY — #motomarketgr UGC grid
   ════════════════════════════════════════════════════════════════════ */
function Community({ t: _t, lang }: { t: T; lang: Lang }) {
  return (
    <section className="mm-root mm-community">
      <div className="mm-container">
        <div className="mm-community__intro">
          <h2>
            <span className="big">{lang === "el" ? "44.000" : "44,000"}</span>{" "}
            <span className="rest">
              {lang === "el" ? "αναβάτες μαζί." : "riders riding with us."}
            </span>
          </h2>
          <div>
            <span className="mm-eyebrow">#motomarketgr</span>
            <p>
              {lang === "el"
                ? "Tag #motomarketgr και μπες στη συλλογή μας. Διαλέγουμε τις καλύτερες κάθε εβδομάδα."
                : "Tag #motomarketgr and join our wall. We pick the best every week."}
            </p>
          </div>
        </div>
        <div className="mm-community__grid">
          {COMMUNITY.map((tile) => (
            <a
              key={tile.id}
              href="#"
              className={"mm-community__tile " + (tile.wide ? "is-wide" : "")}
            >
              <Image
                src={tile.img}
                alt={tile.handle}
                fill
                sizes="(max-width: 700px) 50vw, 25vw"
              />
              <span className="handle">{tile.handle}</span>
            </a>
          ))}
        </div>
        <div className="mm-community__cta">
          <button className="mm-btn mm-btn--ghost">
            <IconInsta />{" "}
            {lang === "el"
              ? "Δες όλο το feed στο Instagram"
              : "See full feed on Instagram"}{" "}
            <IconArrowUpRight />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   MOBILE BOTTOM NAV — 5 buttons, mobile only
   ════════════════════════════════════════════════════════════════════ */
function MobileBottomNav({
  lang,
  cartCount,
  wishCount,
  onOpenSearch,
  onOpenCart,
  onOpenWish,
}: {
  lang: Lang;
  cartCount: number;
  wishCount: number;
  onOpenSearch: () => void;
  onOpenCart: () => void;
  onOpenWish: () => void;
}) {
  return (
    <nav className="mm-root mm-mobnav">
      <button className="is-on">
        <IconArrowUpRight />
        <span>{lang === "el" ? "Αρχική" : "Home"}</span>
      </button>
      <button onClick={onOpenSearch}>
        <IconSearch />
        <span>{lang === "el" ? "Αναζ." : "Search"}</span>
      </button>
      <button onClick={onOpenWish}>
        <IconHeart />
        <span>{lang === "el" ? "Λίστα" : "Wish"}</span>
        {wishCount > 0 && <span className="badge">{wishCount}</span>}
      </button>
      <button onClick={onOpenCart}>
        <IconCart />
        <span>{lang === "el" ? "Καλάθι" : "Cart"}</span>
        {cartCount > 0 && <span className="badge">{cartCount}</span>}
      </button>
      <button>
        <IconUser />
        <span>{lang === "el" ? "Εγώ" : "Me"}</span>
      </button>
    </nav>
  );
}

/* ════════════════════════════════════════════════════════════════════
   CART DRAWER — slide-out with free-shipping meter
   ════════════════════════════════════════════════════════════════════ */
function CartDrawer({
  open,
  onClose,
  cart,
  lang,
  onUpdate,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  cart: CartLine[];
  lang: Lang;
  onUpdate: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
}) {
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const FREE_AT = 50;
  const remaining = Math.max(0, FREE_AT - subtotal);
  const pct = Math.min(100, (subtotal / FREE_AT) * 100);
  const shipFree = subtotal >= FREE_AT;
  const count = cart.reduce((n, it) => n + it.qty, 0);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);

  return (
    <>
      <div
        className={"mm-scrim " + (open ? "is-open" : "")}
        onClick={onClose}
      />
      <aside
        className={"mm-root mm-drawer " + (open ? "is-open" : "")}
        aria-hidden={!open}
      >
        <div className="mm-drawer__head">
          <div>
            <h3>{lang === "el" ? "Καλάθι" : "Cart"}</h3>
            <span className="count">
              {count} {lang === "el" ? "προϊόντα" : "items"}
            </span>
          </div>
          <button
            className="mm-drawer__close"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="mm-drawer__body">
          {cart.length === 0 ? (
            <div className="mm-drawer__empty">
              <div className="mm-display">
                {lang === "el" ? "Άδειο." : "Empty."}
              </div>
              <p>
                {lang === "el"
                  ? "Δεν έχεις προσθέσει κάτι ακόμα."
                  : "Nothing in here yet."}
              </p>
              <button
                className="mm-btn mm-btn--ghost"
                onClick={onClose}
                style={{ marginTop: 16 }}
              >
                {lang === "el" ? "Δες προϊόντα" : "Shop products"}
              </button>
            </div>
          ) : (
            cart.map((it) => (
              <div className="mm-cart-item" key={it.id}>
                <div className="mm-cart-item__media">
                  <Image src={it.img} alt={it[lang].name} fill sizes="80px" />
                </div>
                <div className="mm-cart-item__body">
                  <div className="brand">{it.brand}</div>
                  <h5>{it[lang].name}</h5>
                  <div className="qty">
                    <button
                      onClick={() => onUpdate(it.id, Math.max(1, it.qty - 1))}
                    >
                      −
                    </button>
                    <span>{it.qty}</span>
                    <button onClick={() => onUpdate(it.id, it.qty + 1)}>
                      +
                    </button>
                  </div>
                </div>
                <div className="mm-cart-item__price">
                  <div className="amt">
                    €{(it.price * it.qty).toFixed(2).replace(".", ",")}
                  </div>
                  <button className="rm" onClick={() => onRemove(it.id)}>
                    {lang === "el" ? "Αφαίρεση" : "Remove"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {cart.length > 0 && (
          <div className="mm-drawer__foot">
            <div className="mm-drawer__meter">
              <div className="lab">
                <span>
                  {shipFree
                    ? lang === "el"
                      ? "Δωρεάν αποστολή ενεργή"
                      : "Free shipping unlocked"
                    : `${lang === "el" ? "Λείπουν" : "Add"} €${remaining.toFixed(2).replace(".", ",")} ${lang === "el" ? "για δωρεάν" : "for free shipping"}`}
                </span>
                <span>{shipFree ? "✓" : `${Math.round(pct)}%`}</span>
              </div>
              <div className="bar">
                <div style={{ width: pct + "%" }} />
              </div>
            </div>
            <div className="mm-drawer__row">
              <span>{lang === "el" ? "Υποσύνολο" : "Subtotal"}</span>
              <span>€{subtotal.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="mm-drawer__row">
              <span>{lang === "el" ? "Αποστολή" : "Shipping"}</span>
              <span>
                {shipFree ? (lang === "el" ? "Δωρεάν" : "Free") : "€4,90"}
              </span>
            </div>
            <div className="mm-drawer__total">
              <span>{lang === "el" ? "Σύνολο" : "Total"}</span>
              <span className="amt">
                €
                {(subtotal + (shipFree ? 0 : 4.9)).toFixed(2).replace(".", ",")}
              </span>
            </div>
            <button className="mm-btn mm-btn--primary mm-drawer__cta">
              {lang === "el" ? "Ολοκλήρωση παραγγελίας" : "Checkout"}{" "}
              <IconArrowRight />
            </button>
          </div>
        )}
      </aside>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
   QUICK VIEW — product modal
   ════════════════════════════════════════════════════════════════════ */
function QuickView({
  product,
  onClose,
  lang,
  onAdd,
  wishlist,
  onWish,
}: {
  product: Product | null;
  onClose: () => void;
  lang: Lang;
  onAdd: (p: Product) => void;
  wishlist: string[];
  onWish: (id: string) => void;
}) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (product) document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [product, onClose]);

  if (!product) return null;
  const p = product;
  const discount = p.oldPrice
    ? Math.round((1 - p.price / p.oldPrice) * 100)
    : 0;
  const isWished = wishlist.includes(p.id);
  const sizes = ["S", "M", "L", "XL"];

  return (
    <>
      <div className={"mm-scrim is-open"} onClick={onClose} />
      <div className={"mm-root mm-modal is-open"} onClick={onClose}>
        <div className="mm-modal__panel" onClick={(e) => e.stopPropagation()}>
          <div className="mm-modal__media">
            <Image
              src={p.img}
              alt={p[lang].name}
              fill
              sizes="(max-width: 800px) 100vw, 50vw"
            />
            <div className="mm-product__badges">
              {p.isSale && (
                <span className="mm-badge mm-badge--sale">−{discount}%</span>
              )}
              {p.isNew && <span className="mm-badge mm-badge--new">NEW</span>}
              {p.isHouse && (
                <span className="mm-badge mm-badge--house">HOUSE</span>
              )}
            </div>
          </div>
          <div className="mm-modal__body">
            <button
              className="mm-modal__close"
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
            <span className="brand">
              {p.brand} · {p[lang].cat}
            </span>
            <h2>{p[lang].name}</h2>
            <div className="price">
              <span className="now">
                €{p.price.toFixed(2).replace(".", ",")}
              </span>
              {p.oldPrice && (
                <span className="old">
                  €{p.oldPrice.toFixed(2).replace(".", ",")}
                </span>
              )}
              {discount > 0 && (
                <span className="save">
                  {lang === "el"
                    ? `ΓΛΥΤΩΝΕΙΣ €${(p.oldPrice! - p.price).toFixed(2).replace(".", ",")}`
                    : `SAVE €${(p.oldPrice! - p.price).toFixed(2).replace(".", ",")}`}
                </span>
              )}
            </div>
            {p.swatches && (
              <div className="mm-modal__row">
                <span className="lab">
                  {lang === "el" ? "Χρώμα" : "Colour"}
                </span>
                <div className="swatches">
                  {p.swatches.map((s, i) => (
                    <button
                      key={i}
                      className={i === 0 ? "is-active" : ""}
                      style={{ background: s }}
                      aria-label={`Swatch ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="mm-modal__row">
              <span className="lab">{lang === "el" ? "Μέγεθος" : "Size"}</span>
              <div className="sizes">
                {sizes.map((s, i) => (
                  <button key={s} className={i === 1 ? "is-active" : ""}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="mm-modal__cta">
              <button
                className="mm-btn mm-btn--primary"
                style={{ flex: 1, justifyContent: "center" }}
                onClick={() => onAdd(p)}
              >
                {lang === "el" ? "Προσθήκη στο καλάθι" : "Add to cart"} · €
                {p.price.toFixed(2).replace(".", ",")}
              </button>
              <button
                className="mm-btn mm-btn--ghost"
                onClick={() => onWish(p.id)}
                aria-label="Wishlist"
              >
                <IconHeart filled={isWished} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SEARCH OVERLAY
   ════════════════════════════════════════════════════════════════════ */
function SearchOverlay({
  open,
  onClose,
  lang,
  onPickProduct,
}: {
  open: boolean;
  onClose: () => void;
  lang: Lang;
  onPickProduct: (p: Product) => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current)
      setTimeout(() => inputRef.current?.focus(), 100);
    else setQ("");
  }, [open]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", k);
    return () => document.removeEventListener("keydown", k);
  }, [open, onClose]);

  const all = [...FEATURED, ...BESTSELLERS];
  const results =
    q.trim().length >= 2
      ? all
          .filter((p) =>
            (p.brand + " " + p[lang].name + " " + p[lang].cat)
              .toLowerCase()
              .includes(q.toLowerCase()),
          )
          .slice(0, 6)
      : [];

  const pops =
    lang === "el"
      ? [
          "κράνος Shoei",
          "Nordcode jacket",
          "βαλίτσα Givi",
          "Quad Lock iPhone",
          "γάντια χειμώνας",
        ]
      : [
          "shoei helmet",
          "Nordcode jacket",
          "Givi top case",
          "Quad Lock iPhone",
          "winter gloves",
        ];

  return (
    <div className={"mm-root mm-search " + (open ? "is-open" : "")}>
      <div className="mm-search__inner">
        <div className="mm-search__form">
          <IconSearch />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              lang === "el" ? "Τι ψάχνεις;" : "What are you looking for?"
            }
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button className="mm-search__close" onClick={onClose}>
            {lang === "el" ? "Κλείσιμο · ESC" : "Close · ESC"}
          </button>
        </div>
        <div className="mm-search__cols">
          <div>
            <h6>{lang === "el" ? "Δημοφιλή τώρα" : "Popular right now"}</h6>
            <ul>
              {pops.map((p, i) => (
                <li key={i}>
                  <button onClick={() => setQ(p)}>{p}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h6>{lang === "el" ? "Κατηγορίες" : "Categories"}</h6>
            <ul>
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <a href={`/category/${c.id}`}>{c[lang].title}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h6>
              {results.length > 0
                ? lang === "el"
                  ? "Αποτελέσματα"
                  : "Results"
                : lang === "el"
                  ? "Δοκίμασε"
                  : "Try"}
            </h6>
            <div className="mm-search__results">
              {results.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: 13 }}>
                  {q.trim().length < 2
                    ? lang === "el"
                      ? "Πληκτρολόγησε 2+ χαρακτήρες."
                      : "Type 2+ chars."
                    : lang === "el"
                      ? "Δεν βρέθηκε τίποτα."
                      : "No matches."}
                </p>
              ) : (
                results.map((p) => (
                  <button
                    key={p.id}
                    className="mm-search__result"
                    onClick={() => {
                      onPickProduct(p);
                      onClose();
                    }}
                  >
                    <div className="img">
                      <Image src={p.img} alt={p[lang].name} fill sizes="60px" />
                    </div>
                    <div>
                      <div className="b">{p.brand}</div>
                      <div className="n">{p[lang].name}</div>
                    </div>
                    <div className="pr">
                      €{p.price.toFixed(2).replace(".", ",")}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   COMPARE BAR — bottom drawer 1-3 products
   ════════════════════════════════════════════════════════════════════ */
function CompareBar({
  items,
  lang,
  onRemove,
  onClear,
}: {
  items: Product[];
  lang: Lang;
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  return (
    <div className={"mm-root mm-cmpbar " + (items.length > 0 ? "is-open" : "")}>
      <div className="mm-container mm-cmpbar__inner">
        <div className="mm-cmpbar__h">
          <span>
            {lang === "el" ? "Σύγκριση" : "Compare"} · {items.length}/3
          </span>
          <strong>{lang === "el" ? "Έως 3 προϊόντα" : "Up to 3 items"}</strong>
        </div>
        <div className="mm-cmpbar__slots">
          {[0, 1, 2].map((i) => {
            const it = items[i];
            return (
              <div className="mm-cmpbar__slot" key={i}>
                {it ? (
                  <>
                    <div className="img">
                      <Image
                        src={it.img}
                        alt={it[lang].name}
                        fill
                        sizes="60px"
                      />
                    </div>
                    <div className="info">
                      <div className="b">{it.brand}</div>
                      <div className="n">{it[lang].name}</div>
                    </div>
                    <button
                      className="x"
                      onClick={() => onRemove(it.id)}
                      aria-label="Remove"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <span className="ph">
                    — {lang === "el" ? `Θέση ${i + 1}` : `Slot ${i + 1}`}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mm-cmpbar__actions">
          <button className="mm-btn mm-btn--ghost" onClick={onClear}>
            {lang === "el" ? "Καθαρισμός" : "Clear"}
          </button>
          <button
            className="mm-btn mm-btn--primary"
            disabled={items.length < 2}
            style={{ opacity: items.length < 2 ? 0.5 : 1 }}
          >
            {lang === "el" ? "Δες σύγκριση" : "View comparison"}{" "}
            <IconArrowRight />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════════════════════════ */
function Toast({ msg, show }: { msg: string; show: boolean }) {
  return (
    <div className={"mm-root mm-toast " + (show ? "is-show" : "")}>
      <span className="dot">✓</span>
      <span>{msg}</span>
    </div>
  );
}
