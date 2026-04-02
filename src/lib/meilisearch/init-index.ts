import { getAdminClient, PRODUCTS_INDEX } from "./client";
import {
  searchableAttributes,
  filterableAttributes,
  sortableAttributes,
  synonyms,
  typoTolerance,
  pagination,
} from "./index-config";

export async function initSearchIndex(): Promise<void> {
  const index = getAdminClient().index(PRODUCTS_INDEX);

  await index.updateSettings({
    searchableAttributes,
    filterableAttributes,
    sortableAttributes,
    faceting: { maxValuesPerFacet: 100, sortFacetValuesBy: { "*": "count" } },
    typoTolerance,
    pagination,
    displayedAttributes: ["*"],
    distinctAttribute: "id",
  });

  for (const [word, wordSynonyms] of Object.entries(synonyms)) {
    await index.updateSynonyms({ [word]: wordSynonyms });
  }

  console.log("[Meilisearch] Index settings applied to:", PRODUCTS_INDEX);
}
