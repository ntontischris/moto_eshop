import type { Blocks } from "./schema";
import { HeroBlock } from "./components/hero";
import { ProductRailBlock } from "./components/product-rail";
import { RichTextBlock } from "./components/rich-text";
import { DiscountBannerBlock } from "./components/discount-banner";
import { CountdownBlock } from "./components/countdown";
import { EditorialBlock } from "./components/editorial";
import { ComparisonBlock } from "./components/comparison";
import { FaqBlock } from "./components/faq";
import { SocialProofBlock } from "./components/social-proof";
import { BrandStripBlock } from "./components/brand-strip";
import { StickyCtaBlock } from "./components/sticky-cta";
import { EmailCaptureBlock } from "./components/email-capture";

export function BlockRenderer({ blocks }: { blocks: Blocks }) {
  if (blocks.length === 0) return null;
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "hero":
            return <HeroBlock key={i} block={block} />;
          case "productRail":
            return <ProductRailBlock key={i} block={block} />;
          case "richText":
            return <RichTextBlock key={i} block={block} />;
          case "discountBanner":
            return <DiscountBannerBlock key={i} block={block} />;
          case "countdown":
            return <CountdownBlock key={i} block={block} />;
          case "editorial":
            return <EditorialBlock key={i} block={block} />;
          case "comparison":
            return <ComparisonBlock key={i} block={block} />;
          case "faq":
            return <FaqBlock key={i} block={block} />;
          case "socialProof":
            return <SocialProofBlock key={i} block={block} />;
          case "brandStrip":
            return <BrandStripBlock key={i} block={block} />;
          case "stickyCta":
            return <StickyCtaBlock key={i} block={block} />;
          case "emailCapture":
            return <EmailCaptureBlock key={i} block={block} />;
          default:
            return null;
        }
      })}
    </>
  );
}
