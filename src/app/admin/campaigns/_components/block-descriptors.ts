// Editor-side descriptors that drive the generic block form. Blocks are edited
// as loose records and validated against the Zod blockSchema on save.

export type EditorBlock = Record<string, unknown> & { type: string };

export type FieldKind =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "image"
  | "select"
  | "cta"
  | "products"
  | "objectList"
  | "railSource";

export interface SubField {
  key: string;
  label: string;
  kind: "text" | "textarea" | "image";
}

export interface FieldDesc {
  key: string;
  label: string;
  kind: FieldKind;
  optional?: boolean;
  options?: { value: string; label: string }[];
  subFields?: SubField[];
  min?: number;
}

export interface BlockDef {
  type: string;
  label: string;
  create: () => EditorBlock;
  fields: FieldDesc[];
}

export const BLOCK_DEFS: BlockDef[] = [
  {
    type: "hero",
    label: "Hero",
    create: () => ({
      type: "hero",
      headline: "",
      mediaUrl: "",
      mediaType: "image",
      primaryCta: { label: "", href: "" },
    }),
    fields: [
      { key: "headline", label: "Τίτλος", kind: "text" },
      { key: "subhead", label: "Υπότιτλος", kind: "textarea", optional: true },
      { key: "mediaUrl", label: "Εικόνα/Βίντεο URL", kind: "image" },
      {
        key: "mediaType",
        label: "Τύπος media",
        kind: "select",
        options: [
          { value: "image", label: "Εικόνα" },
          { value: "video", label: "Βίντεο" },
        ],
      },
      { key: "primaryCta", label: "Κύριο CTA", kind: "cta" },
      {
        key: "secondaryCta",
        label: "Δευτερεύον CTA",
        kind: "cta",
        optional: true,
      },
    ],
  },
  {
    type: "productRail",
    label: "Product Rail",
    create: () => ({
      type: "productRail",
      title: "",
      source: { mode: "manual", productIds: [] },
    }),
    fields: [
      { key: "title", label: "Τίτλος", kind: "text", optional: true },
      { key: "source", label: "Πηγή προϊόντων", kind: "railSource" },
    ],
  },
  {
    type: "discountBanner",
    label: "Discount Banner",
    create: () => ({ type: "discountBanner", text: "", code: "" }),
    fields: [
      { key: "text", label: "Κείμενο", kind: "text" },
      { key: "code", label: "Κωδικός", kind: "text" },
      { key: "expiresAt", label: "Λήγει (ISO)", kind: "text", optional: true },
    ],
  },
  {
    type: "countdown",
    label: "Countdown",
    create: () => ({ type: "countdown", targetAt: "" }),
    fields: [
      { key: "title", label: "Τίτλος", kind: "text", optional: true },
      { key: "targetAt", label: "Λήξη (ISO datetime)", kind: "text" },
    ],
  },
  {
    type: "richText",
    label: "Rich Text",
    create: () => ({ type: "richText", html: "" }),
    fields: [{ key: "html", label: "HTML", kind: "textarea" }],
  },
  {
    type: "editorial",
    label: "Editorial",
    create: () => ({
      type: "editorial",
      title: "",
      body: "",
      imageUrl: "",
      imagePosition: "left",
    }),
    fields: [
      { key: "title", label: "Τίτλος", kind: "text" },
      { key: "body", label: "Κείμενο", kind: "textarea" },
      { key: "imageUrl", label: "Εικόνα URL", kind: "image" },
      {
        key: "imagePosition",
        label: "Θέση εικόνας",
        kind: "select",
        options: [
          { value: "left", label: "Αριστερά" },
          { value: "right", label: "Δεξιά" },
        ],
      },
    ],
  },
  {
    type: "comparison",
    label: "Comparison",
    create: () => ({ type: "comparison", title: "", productIds: [] }),
    fields: [
      { key: "title", label: "Τίτλος", kind: "text", optional: true },
      { key: "productIds", label: "Προϊόντα (2-4)", kind: "products", min: 2 },
    ],
  },
  {
    type: "faq",
    label: "FAQ",
    create: () => ({ type: "faq", items: [] }),
    fields: [
      { key: "title", label: "Τίτλος", kind: "text", optional: true },
      {
        key: "items",
        label: "Ερωτήσεις",
        kind: "objectList",
        subFields: [
          { key: "q", label: "Ερώτηση", kind: "text" },
          { key: "a", label: "Απάντηση", kind: "textarea" },
        ],
      },
    ],
  },
  {
    type: "socialProof",
    label: "Social Proof",
    create: () => ({ type: "socialProof", stats: [] }),
    fields: [
      { key: "title", label: "Τίτλος", kind: "text", optional: true },
      {
        key: "stats",
        label: "Στατιστικά",
        kind: "objectList",
        subFields: [
          { key: "value", label: "Τιμή", kind: "text" },
          { key: "label", label: "Ετικέτα", kind: "text" },
        ],
      },
    ],
  },
  {
    type: "brandStrip",
    label: "Brand Strip",
    create: () => ({ type: "brandStrip", logos: [] }),
    fields: [
      { key: "title", label: "Τίτλος", kind: "text", optional: true },
      {
        key: "logos",
        label: "Logos",
        kind: "objectList",
        subFields: [
          { key: "name", label: "Όνομα", kind: "text" },
          { key: "imageUrl", label: "Logo URL", kind: "image" },
        ],
      },
    ],
  },
  {
    type: "emailCapture",
    label: "Email Capture",
    create: () => ({
      type: "emailCapture",
      title: "",
      buttonLabel: "Εγγραφή",
      source: "campaign",
    }),
    fields: [
      { key: "title", label: "Τίτλος", kind: "text" },
      { key: "subtitle", label: "Υπότιτλος", kind: "textarea", optional: true },
      { key: "buttonLabel", label: "Κουμπί", kind: "text" },
      { key: "source", label: "Source (analytics)", kind: "text" },
    ],
  },
  {
    type: "stickyCta",
    label: "Sticky CTA (mobile)",
    create: () => ({ type: "stickyCta", label: "", href: "" }),
    fields: [
      { key: "label", label: "Ετικέτα", kind: "text" },
      { key: "href", label: "Σύνδεσμος", kind: "text" },
    ],
  },
];

export const BLOCK_DEF_MAP: Record<string, BlockDef> = Object.fromEntries(
  BLOCK_DEFS.map((d) => [d.type, d]),
);
