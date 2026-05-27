import { searchProductsTool } from "./search-products";
import { getProductDetailsTool } from "./get-product-details";
import { checkStockTool } from "./check-stock";
import { handoffToHumanTool } from "./handoff-to-human";
import { showProductCardsTool } from "./show-product-cards";
import { compareProductsTool } from "./compare-products";
import { addToCartTool } from "./add-to-cart";
import { navigateToTool } from "./navigate-to";
import { applyFiltersTool } from "./apply-filters";

/**
 * Tool catalog handed to streamText({ tools: chatTools }).
 * - Server tools have execute defined → run on the route handler.
 * - Client tools (navigateTo, applyFilters) have no execute → run in the
 *   browser via useChat's onToolCall handler.
 */
export const chatTools = {
  searchProducts: searchProductsTool,
  getProductDetails: getProductDetailsTool,
  checkStock: checkStockTool,
  handoffToHuman: handoffToHumanTool,
  showProductCards: showProductCardsTool,
  compareProducts: compareProductsTool,
  addToCart: addToCartTool,
  navigateTo: navigateToTool,
  applyFilters: applyFiltersTool,
} as const;

export type ChatToolName = keyof typeof chatTools;
