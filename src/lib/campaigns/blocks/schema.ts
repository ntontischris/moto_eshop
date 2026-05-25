import { z } from "zod";

const ctaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

const heroBlock = z.object({
  type: z.literal("hero"),
  headline: z.string().min(1),
  subhead: z.string().optional(),
  mediaUrl: z.string().min(1),
  mediaType: z.enum(["image", "video"]),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema.optional(),
});

const productRailBlock = z.object({
  type: z.literal("productRail"),
  title: z.string().optional(),
  source: z.discriminatedUnion("mode", [
    z.object({
      mode: z.literal("manual"),
      productIds: z.array(z.string()).min(1),
    }),
    z.object({
      mode: z.literal("auto"),
      by: z.enum(["category", "brand"]),
      value: z.string().min(1),
      limit: z.number().int().min(1).max(24).default(8),
    }),
  ]),
});

const richTextBlock = z.object({
  type: z.literal("richText"),
  html: z.string(),
});

const discountBannerBlock = z.object({
  type: z.literal("discountBanner"),
  code: z.string().min(1),
  text: z.string().min(1),
  expiresAt: z.string().optional(),
});

const countdownBlock = z.object({
  type: z.literal("countdown"),
  title: z.string().optional(),
  targetAt: z.string().min(1),
});

const editorialBlock = z.object({
  type: z.literal("editorial"),
  title: z.string().min(1),
  body: z.string().min(1),
  imageUrl: z.string().min(1),
  imagePosition: z.enum(["left", "right"]).default("left"),
});

const comparisonBlock = z.object({
  type: z.literal("comparison"),
  title: z.string().optional(),
  productIds: z.array(z.string()).min(2).max(4),
});

const faqBlock = z.object({
  type: z.literal("faq"),
  title: z.string().optional(),
  items: z
    .array(z.object({ q: z.string().min(1), a: z.string().min(1) }))
    .min(1),
});

const socialProofBlock = z.object({
  type: z.literal("socialProof"),
  title: z.string().optional(),
  stats: z
    .array(z.object({ label: z.string().min(1), value: z.string().min(1) }))
    .min(1),
});

const brandStripBlock = z.object({
  type: z.literal("brandStrip"),
  title: z.string().optional(),
  logos: z
    .array(z.object({ name: z.string().min(1), imageUrl: z.string().min(1) }))
    .min(1),
});

const stickyCtaBlock = z.object({
  type: z.literal("stickyCta"),
  label: z.string().min(1),
  href: z.string().min(1),
});

const emailCaptureBlock = z.object({
  type: z.literal("emailCapture"),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  buttonLabel: z.string().default("Εγγραφή"),
  source: z.string().default("campaign"),
});

export const blockSchema = z.discriminatedUnion("type", [
  heroBlock,
  productRailBlock,
  richTextBlock,
  discountBannerBlock,
  countdownBlock,
  editorialBlock,
  comparisonBlock,
  faqBlock,
  socialProofBlock,
  brandStripBlock,
  stickyCtaBlock,
  emailCaptureBlock,
]);

export const blocksSchema = z.array(blockSchema);

export type Block = z.infer<typeof blockSchema>;
export type Blocks = z.infer<typeof blocksSchema>;
