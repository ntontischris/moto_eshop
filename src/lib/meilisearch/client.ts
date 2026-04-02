import { Meilisearch } from "meilisearch";

function getHost(): string {
  return process.env.MEILI_HOST ?? process.env.NEXT_PUBLIC_MEILI_HOST ?? "";
}

let _adminClient: Meilisearch | null = null;
let _searchClient: Meilisearch | null = null;

/** Admin client — server-side only. Never expose MEILI_ADMIN_KEY to the browser. */
export function getAdminClient(): Meilisearch {
  if (!_adminClient) {
    _adminClient = new Meilisearch({
      host: getHost(),
      apiKey: process.env.MEILI_ADMIN_KEY ?? "",
    });
  }
  return _adminClient;
}

/** Search-only client — safe to use in the browser. */
export function getSearchClient(): Meilisearch {
  if (!_searchClient) {
    _searchClient = new Meilisearch({
      host: getHost(),
      apiKey: process.env.NEXT_PUBLIC_MEILI_SEARCH_KEY ?? "",
    });
  }
  return _searchClient;
}

/** @deprecated Use getAdminClient() */
export const adminClient = {
  index: (uid: string) => getAdminClient().index(uid),
} as Meilisearch;

export const PRODUCTS_INDEX = "products";
