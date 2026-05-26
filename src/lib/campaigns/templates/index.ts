import type { Block, Blocks } from "@/lib/campaigns/blocks/schema";

// ──────────────────────────────────────────────────────────────────────────────
// Template descriptor types
// ──────────────────────────────────────────────────────────────────────────────

export type TemplateFieldKind =
  | "text"
  | "textarea"
  | "image"
  | "slug"
  | "datetime"
  | "products";

export interface TemplateField {
  key: string;
  label: string;
  kind: TemplateFieldKind;
  hint?: string;
  optional?: boolean;
  /** For `products`: min/max ids. */
  min?: number;
  max?: number;
}

export interface TemplateDef {
  id: string;
  label: string;
  icon: string;
  description: string;
  fields: TemplateField[];
  build: (input: Record<string, unknown>) => Blocks;
}

// ──────────────────────────────────────────────────────────────────────────────
// Shared helpers + polished defaults
// ──────────────────────────────────────────────────────────────────────────────

function s(v: unknown, fb = ""): string {
  const t = typeof v === "string" ? v.trim() : "";
  return t || fb;
}

function ids(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
}

const DEFAULT_STATS = [
  { value: "12.000+", label: "Προϊόντα" },
  { value: "4.8★", label: "Αξιολόγηση" },
  { value: "24ω", label: "Γρήγορη αποστολή" },
  { value: "14 ημ.", label: "Εύκολες επιστροφές" },
];

const DEFAULT_FAQS = [
  {
    q: "Πόσο κοστίζει η αποστολή;",
    a: "Δωρεάν αποστολή για παραγγελίες άνω των 50€. Διαφορετικά 3,90€.",
  },
  {
    q: "Πόσος χρόνος για παράδοση;",
    a: "Οι παραγγελίες αποστέλλονται εντός 24 ωρών — παράδοση σε 1–3 εργάσιμες.",
  },
  {
    q: "Πώς γίνονται οι επιστροφές;",
    a: "Επιστροφή σε άριστη κατάσταση εντός 14 ημερών, χωρίς ερωτήσεις.",
  },
];

function defaultSocialProof(title = "Γιατί MotoMarket"): Block {
  return { type: "socialProof", title, stats: DEFAULT_STATS };
}

function defaultFaq(title = "Συχνές ερωτήσεις"): Block {
  return { type: "faq", title, items: DEFAULT_FAQS };
}

// ──────────────────────────────────────────────────────────────────────────────
// Templates
// ──────────────────────────────────────────────────────────────────────────────

const sale: TemplateDef = {
  id: "sale",
  label: "Έκπτωση / Sale",
  icon: "🔥",
  description:
    "Black Friday, εποχιακή προσφορά. Banner, αντίστροφη μέτρηση, προϊόντα.",
  fields: [
    {
      key: "heroHeadline",
      label: "Headline",
      kind: "text",
      hint: "π.χ. -20% σε όλα τα κράνη AGV",
    },
    { key: "heroImage", label: "Hero εικόνα", kind: "image" },
    {
      key: "discountText",
      label: "Banner κείμενο",
      kind: "text",
      hint: "π.χ. Black Friday -20%",
    },
    {
      key: "discountCode",
      label: "Κωδικός έκπτωσης",
      kind: "text",
      hint: "π.χ. BF20",
    },
    {
      key: "countdownTargetAt",
      label: "Λήγει στις (ISO datetime)",
      kind: "datetime",
      optional: true,
    },
    {
      key: "productCategory",
      label: "Κατηγορία προϊόντων (slug)",
      kind: "slug",
      optional: true,
      hint: "π.χ. krani-anabath",
    },
  ],
  build: (i) => {
    const blocks: Block[] = [];
    const img = s(i.heroImage);
    if (img) {
      blocks.push({
        type: "hero",
        headline: s(i.heroHeadline, "Προσφορά"),
        mediaUrl: img,
        mediaType: "image",
        primaryCta: { label: "Δες τις προσφορές", href: "#offers" },
      });
    }
    blocks.push({
      type: "discountBanner",
      text: s(i.discountText, "Ειδική προσφορά"),
      code: s(i.discountCode, "SAVE"),
    });
    const t = s(i.countdownTargetAt);
    if (t)
      blocks.push({
        type: "countdown",
        title: "Η προσφορά λήγει σε",
        targetAt: t,
      });
    const cat = s(i.productCategory);
    if (cat) {
      blocks.push({
        type: "productRail",
        title: "Δες τις προσφορές",
        source: { mode: "auto", by: "category", value: cat, limit: 8 },
      });
    }
    blocks.push(defaultSocialProof());
    blocks.push({
      type: "emailCapture",
      title: "Μη χάσεις τις επόμενες προσφορές",
      buttonLabel: "Εγγραφή",
      source: "campaign",
    });
    return blocks;
  },
};

const newProduct: TemplateDef = {
  id: "new-product",
  label: "Νέο προϊόν",
  icon: "🚀",
  description: "Λανσάρισμα νέου προϊόντος. Hero, ιστορία, σύγκριση.",
  fields: [
    {
      key: "heroHeadline",
      label: "Headline",
      kind: "text",
      hint: "π.χ. AGV Pista GP RR — Έφτασε",
    },
    { key: "heroImage", label: "Hero εικόνα", kind: "image" },
    {
      key: "storyTitle",
      label: "Τίτλος ιστορίας",
      kind: "text",
      optional: true,
    },
    {
      key: "storyBody",
      label: "Κείμενο ιστορίας",
      kind: "textarea",
      optional: true,
    },
    {
      key: "storyImage",
      label: "Εικόνα ιστορίας",
      kind: "image",
      optional: true,
    },
    {
      key: "productIds",
      label: "Προϊόντα (2-4)",
      kind: "products",
      min: 2,
      max: 4,
    },
  ],
  build: (i) => {
    const blocks: Block[] = [];
    const heroImg = s(i.heroImage);
    if (heroImg) {
      blocks.push({
        type: "hero",
        headline: s(i.heroHeadline, "Νέο προϊόν"),
        mediaUrl: heroImg,
        mediaType: "image",
        primaryCta: { label: "Αγόρασέ το", href: "#shop" },
      });
    }
    const storyImg = s(i.storyImage);
    const storyTitle = s(i.storyTitle);
    const storyBody = s(i.storyBody);
    if (storyImg && (storyTitle || storyBody)) {
      blocks.push({
        type: "editorial",
        title: storyTitle || "Η ιστορία πίσω από το προϊόν",
        body: storyBody || "Σχεδιάστηκε για αναβάτες που θέλουν περισσότερα.",
        imageUrl: storyImg,
        imagePosition: "right",
      });
    }
    const productIds = ids(i.productIds);
    if (productIds.length > 0) {
      blocks.push({
        type: "productRail",
        title: "Το νέο προϊόν",
        source: { mode: "manual", productIds },
      });
    }
    if (productIds.length >= 2 && productIds.length <= 4) {
      blocks.push({ type: "comparison", title: "Σύγκρινε", productIds });
    }
    blocks.push(defaultFaq());
    return blocks;
  },
};

const brand: TemplateDef = {
  id: "brand",
  label: "Brand spotlight",
  icon: "🛡️",
  description:
    "Προβολή ενός brand (AGV, Alpinestars). Hero, ιστορία, προϊόντα του brand.",
  fields: [
    {
      key: "heroHeadline",
      label: "Headline",
      kind: "text",
      hint: "π.χ. AGV — Made in Italy",
    },
    { key: "heroImage", label: "Hero εικόνα", kind: "image" },
    { key: "brandSlug", label: "Brand (slug)", kind: "slug", hint: "π.χ. agv" },
    {
      key: "storyTitle",
      label: "Τίτλος ιστορίας",
      kind: "text",
      optional: true,
    },
    {
      key: "storyBody",
      label: "Κείμενο ιστορίας",
      kind: "textarea",
      optional: true,
    },
    {
      key: "storyImage",
      label: "Εικόνα ιστορίας",
      kind: "image",
      optional: true,
    },
  ],
  build: (i) => {
    const blocks: Block[] = [];
    const heroImg = s(i.heroImage);
    if (heroImg) {
      blocks.push({
        type: "hero",
        headline: s(i.heroHeadline, "Brand spotlight"),
        mediaUrl: heroImg,
        mediaType: "image",
        primaryCta: { label: "Δες όλα τα προϊόντα", href: "#shop" },
      });
    }
    const storyImg = s(i.storyImage);
    const storyTitle = s(i.storyTitle);
    const storyBody = s(i.storyBody);
    if (storyImg && (storyTitle || storyBody)) {
      blocks.push({
        type: "editorial",
        title: storyTitle || "Η ιστορία του brand",
        body:
          storyBody || "Δεκαετίες αφοσίωσης στην ποιότητα και την προστασία.",
        imageUrl: storyImg,
        imagePosition: "left",
      });
    }
    const brandSlug = s(i.brandSlug);
    if (brandSlug) {
      blocks.push({
        type: "productRail",
        title: "Όλα τα προϊόντα του brand",
        source: { mode: "auto", by: "brand", value: brandSlug, limit: 12 },
      });
    }
    blocks.push(defaultSocialProof());
    return blocks;
  },
};

const ridingStyle: TemplateDef = {
  id: "riding-style",
  label: "Riding style",
  icon: "🏍️",
  description:
    "Εξοπλισμός για συγκεκριμένο riding (σπορ, touring, urban, off-road).",
  fields: [
    {
      key: "heroHeadline",
      label: "Headline",
      kind: "text",
      hint: "π.χ. Εξοπλισμός για σπορ αναβάτες",
    },
    { key: "heroImage", label: "Hero εικόνα", kind: "image" },
    {
      key: "rideCategory",
      label: "Κατηγορία προϊόντων (slug)",
      kind: "slug",
      hint: "π.χ. krani-racing",
    },
  ],
  build: (i) => {
    const blocks: Block[] = [];
    const heroImg = s(i.heroImage);
    if (heroImg) {
      blocks.push({
        type: "hero",
        headline: s(i.heroHeadline, "Επίλεξε σωστά"),
        mediaUrl: heroImg,
        mediaType: "image",
        primaryCta: { label: "Δες τον εξοπλισμό", href: "#shop" },
      });
    }
    const cat = s(i.rideCategory);
    if (cat) {
      blocks.push({
        type: "productRail",
        title: "Διαλεγμένα για σένα",
        source: { mode: "auto", by: "category", value: cat, limit: 12 },
      });
    }
    blocks.push(defaultSocialProof());
    blocks.push(defaultFaq());
    blocks.push({
      type: "emailCapture",
      title: "Μείνε ενημερωμένος",
      buttonLabel: "Εγγραφή",
      source: "campaign",
    });
    return blocks;
  },
};

const seasonal: TemplateDef = {
  id: "seasonal",
  label: "Σεζόν / Καιρός",
  icon: "❄️",
  description: "Χειμωνιάτικος εξοπλισμός, βροχή, καλοκαιρινά αξεσουάρ.",
  fields: [
    {
      key: "heroHeadline",
      label: "Headline",
      kind: "text",
      hint: "π.χ. Έτοιμος για τον χειμώνα;",
    },
    { key: "heroImage", label: "Hero εικόνα", kind: "image" },
    {
      key: "storyTitle",
      label: "Τίτλος ενότητας",
      kind: "text",
      optional: true,
    },
    { key: "storyBody", label: "Κείμενο", kind: "textarea", optional: true },
    {
      key: "storyImage",
      label: "Εικόνα ενότητας",
      kind: "image",
      optional: true,
    },
    {
      key: "productCategory",
      label: "Κατηγορία (slug)",
      kind: "slug",
      hint: "π.χ. xeimoniatika",
    },
    {
      key: "discountText",
      label: "Banner κείμενο",
      kind: "text",
      optional: true,
    },
    { key: "discountCode", label: "Κωδικός", kind: "text", optional: true },
  ],
  build: (i) => {
    const blocks: Block[] = [];
    const heroImg = s(i.heroImage);
    if (heroImg) {
      blocks.push({
        type: "hero",
        headline: s(i.heroHeadline, "Επόμενη σεζόν"),
        mediaUrl: heroImg,
        mediaType: "image",
        primaryCta: { label: "Δες τη συλλογή", href: "#shop" },
      });
    }
    const storyImg = s(i.storyImage);
    const storyTitle = s(i.storyTitle);
    const storyBody = s(i.storyBody);
    if (storyImg && (storyTitle || storyBody)) {
      blocks.push({
        type: "editorial",
        title: storyTitle || "Έτοιμος για κάθε καιρό",
        body:
          storyBody || "Επιλεγμένος εξοπλισμός που σε κρατά άνετο όλη τη μέρα.",
        imageUrl: storyImg,
        imagePosition: "right",
      });
    }
    const cat = s(i.productCategory);
    if (cat) {
      blocks.push({
        type: "productRail",
        title: "Διαλεγμένα για τη σεζόν",
        source: { mode: "auto", by: "category", value: cat, limit: 12 },
      });
    }
    const dText = s(i.discountText);
    const dCode = s(i.discountCode);
    if (dText && dCode) {
      blocks.push({ type: "discountBanner", text: dText, code: dCode });
    }
    blocks.push({
      type: "emailCapture",
      title: "Μάθε πρώτος για νέες συλλογές",
      buttonLabel: "Εγγραφή",
      source: "campaign",
    });
    return blocks;
  },
};

const bundle: TemplateDef = {
  id: "bundle",
  label: "Bundle / Σετ",
  icon: "📦",
  description: "Σετ προϊόντων με συνδυαστική προσφορά (κράνος + γάντια κ.λπ.).",
  fields: [
    {
      key: "heroHeadline",
      label: "Headline",
      kind: "text",
      hint: "π.χ. Το ιδανικό σετ για νέους αναβάτες",
    },
    { key: "heroImage", label: "Hero εικόνα", kind: "image" },
    {
      key: "productIds",
      label: "Προϊόντα του σετ (2-4)",
      kind: "products",
      min: 2,
      max: 4,
    },
    {
      key: "bundleDiscountText",
      label: "Banner κείμενο",
      kind: "text",
      hint: "π.χ. -15% στο σετ",
    },
    {
      key: "bundleDiscountCode",
      label: "Κωδικός",
      kind: "text",
      hint: "π.χ. BUNDLE15",
    },
  ],
  build: (i) => {
    const blocks: Block[] = [];
    const heroImg = s(i.heroImage);
    if (heroImg) {
      blocks.push({
        type: "hero",
        headline: s(i.heroHeadline, "Το σετ που θέλεις"),
        mediaUrl: heroImg,
        mediaType: "image",
        primaryCta: { label: "Δες το σετ", href: "#bundle" },
      });
    }
    const productIds = ids(i.productIds);
    if (productIds.length > 0) {
      blocks.push({
        type: "productRail",
        title: "Το σετ",
        source: { mode: "manual", productIds },
      });
    }
    if (productIds.length >= 2 && productIds.length <= 4) {
      blocks.push({ type: "comparison", title: "Τι περιλαμβάνει", productIds });
    }
    const dText = s(i.bundleDiscountText);
    const dCode = s(i.bundleDiscountCode);
    if (dText && dCode) {
      blocks.push({ type: "discountBanner", text: dText, code: dCode });
    }
    return blocks;
  },
};

const leadCapture: TemplateDef = {
  id: "lead",
  label: "Lead capture",
  icon: "📩",
  description:
    "Newsletter / συλλογή emails. Hero + social proof + email capture.",
  fields: [
    {
      key: "heroHeadline",
      label: "Headline",
      kind: "text",
      hint: "π.χ. Γίνε μέλος — προσφορές πρώτος",
    },
    { key: "heroImage", label: "Hero εικόνα", kind: "image" },
    {
      key: "leadTitle",
      label: "Τίτλος εγγραφής",
      kind: "text",
      hint: "π.χ. Γίνε MotoMarket Insider",
    },
    {
      key: "leadSubtitle",
      label: "Υπότιτλος εγγραφής",
      kind: "textarea",
      optional: true,
    },
  ],
  build: (i) => {
    const blocks: Block[] = [];
    const heroImg = s(i.heroImage);
    if (heroImg) {
      blocks.push({
        type: "hero",
        headline: s(i.heroHeadline, "Γίνε μέλος"),
        mediaUrl: heroImg,
        mediaType: "image",
        primaryCta: { label: "Εγγραφή", href: "#signup" },
      });
    }
    blocks.push(defaultSocialProof());
    blocks.push({
      type: "emailCapture",
      title: s(i.leadTitle, "Γίνε μέλος"),
      subtitle: s(i.leadSubtitle) || undefined,
      buttonLabel: "Εγγραφή",
      source: "campaign",
    });
    return blocks;
  },
};

const contest: TemplateDef = {
  id: "contest",
  label: "Διαγωνισμός / Δώρο",
  icon: "🎁",
  description:
    "Διαγωνισμός με δώρο. Hero, countdown, όροι, συμμετοχή με email.",
  fields: [
    {
      key: "heroHeadline",
      label: "Headline",
      kind: "text",
      hint: "π.χ. Κέρδισε ένα κράνος AGV",
    },
    { key: "heroImage", label: "Hero εικόνα", kind: "image" },
    { key: "endDate", label: "Λήξη διαγωνισμού (ISO)", kind: "datetime" },
    { key: "prizeTitle", label: "Τίτλος δώρου", kind: "text", optional: true },
    {
      key: "prizeDescription",
      label: "Περιγραφή / όροι",
      kind: "textarea",
      optional: true,
    },
  ],
  build: (i) => {
    const blocks: Block[] = [];
    const heroImg = s(i.heroImage);
    if (heroImg) {
      blocks.push({
        type: "hero",
        headline: s(i.heroHeadline, "Διαγωνισμός"),
        mediaUrl: heroImg,
        mediaType: "image",
        primaryCta: { label: "Συμμετοχή", href: "#signup" },
      });
    }
    const end = s(i.endDate);
    if (end)
      blocks.push({ type: "countdown", title: "Λήγει σε", targetAt: end });
    const pTitle = s(i.prizeTitle);
    const pDesc = s(i.prizeDescription);
    if (pTitle || pDesc) {
      const html = `${pTitle ? `<h2>${pTitle}</h2>` : ""}${pDesc ? `<p>${pDesc.replace(/\n+/g, "</p><p>")}</p>` : ""}`;
      if (html) blocks.push({ type: "richText", html });
    }
    blocks.push({
      type: "emailCapture",
      title: "Συμμετοχή",
      subtitle: "Συμπλήρωσε το email σου για να μπεις στην κλήρωση",
      buttonLabel: "Συμμετοχή",
      source: "campaign",
    });
    return blocks;
  },
};

// ──────────────────────────────────────────────────────────────────────────────
// Registry
// ──────────────────────────────────────────────────────────────────────────────

export const TEMPLATES: TemplateDef[] = [
  sale,
  newProduct,
  brand,
  ridingStyle,
  seasonal,
  bundle,
  leadCapture,
  contest,
];

export function getTemplate(id: string): TemplateDef | null {
  return TEMPLATES.find((t) => t.id === id) ?? null;
}
