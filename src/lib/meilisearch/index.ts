export { getAdminClient, getSearchClient, PRODUCTS_INDEX } from "./client";
export {
  syncProducts,
  syncSingleProduct,
  deleteProductFromIndex,
} from "./sync";
export { searchProducts } from "./search-query";
export { initSearchIndex } from "./init-index";
export type { SearchDocument, SearchHit, SearchFacets } from "./types";
export type {
  SearchProductsOptions,
  SearchProductsResult,
} from "./search-query";
