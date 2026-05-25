import type { Blocks } from "./schema";
import { HeroBlock } from "./components/hero";
import { ProductRailBlock } from "./components/product-rail";
import { RichTextBlock } from "./components/rich-text";
import { DiscountBannerBlock } from "./components/discount-banner";
import { CountdownBlock } from "./components/countdown";

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
          default:
            return null;
        }
      })}
    </>
  );
}
