import { searchProductsTool } from "./search-products";
import { getProductDetailsTool } from "./get-product-details";
import { checkStockTool } from "./check-stock";
import { handoffToHumanTool } from "./handoff-to-human";

/**
 * Tool catalog handed to streamText({ tools: chatTools }).
 * Sub-projects B/C/D append more tools here — names must be stable
 * (the model learns them via the system prompt; renaming breaks behavior).
 */
export const chatTools = {
  searchProducts: searchProductsTool,
  getProductDetails: getProductDetailsTool,
  checkStock: checkStockTool,
  handoffToHuman: handoffToHumanTool,
} as const;

export type ChatToolName = keyof typeof chatTools;
