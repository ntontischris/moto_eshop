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

export const blockSchema = z.discriminatedUnion("type", [
  heroBlock,
  productRailBlock,
  richTextBlock,
  discountBannerBlock,
  countdownBlock,
]);

export const blocksSchema = z.array(blockSchema);

export type Block = z.infer<typeof blockSchema>;
export type Blocks = z.infer<typeof blocksSchema>;
