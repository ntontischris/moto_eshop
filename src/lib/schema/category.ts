export interface SchemaCategoryProduct {
  slug: string;
  name: string;
}

export function generateCollectionPageSchema(
  category: { name: string; slug: string; description: string | null },
  products: SchemaCategoryProduct[],
  pageUrl: string,
) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description ?? undefined,
    url: pageUrl,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: products.slice(0, 10).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${pageUrl}/${p.slug}`,
        name: p.name,
      })),
    },
  };
}
