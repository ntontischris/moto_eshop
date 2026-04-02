import { createClient } from "@/lib/supabase/server";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://motomarket.gr";
const BATCH_SIZE = 500;

interface ProductImage {
  url: string;
  alt: string;
  position: number;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function resolveImageUrl(url: string): string {
  return url.startsWith("http")
    ? url
    : `${BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function buildItemXml(product: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  sku: string | null;
  ean: string | null;
  images: ProductImage[];
  brands: { name: string } | null;
  categories: { name: string; slug: string } | null;
}): string {
  const images = product.images ?? [];
  const firstImage = images[0]?.url;
  const categorySlug = product.categories?.slug ?? "";
  const brandName = product.brands?.name ?? "";
  const description = escapeXml(
    (product.description ?? product.name).slice(0, 5000),
  );
  const availability = product.stock > 0 ? "in_stock" : "out_of_stock";

  const lines = [
    `  <item>`,
    `    <g:id>${escapeXml(product.id)}</g:id>`,
    `    <g:title>${escapeXml(product.name)}</g:title>`,
    `    <g:description>${description}</g:description>`,
    `    <g:link>${BASE_URL}/${categorySlug}/${product.slug}</g:link>`,
  ];

  if (firstImage) {
    lines.push(
      `    <g:image_link>${escapeXml(resolveImageUrl(firstImage))}</g:image_link>`,
    );
  }

  lines.push(
    `    <g:availability>${availability}</g:availability>`,
    `    <g:price>${product.price.toFixed(2)} EUR</g:price>`,
  );

  if (
    product.compare_at_price != null &&
    product.compare_at_price > product.price
  ) {
    lines.push(
      `    <g:sale_price>${product.price.toFixed(2)} EUR</g:sale_price>`,
    );
  }

  if (product.ean) {
    lines.push(`    <g:gtin>${escapeXml(product.ean)}</g:gtin>`);
  }
  if (product.sku) {
    lines.push(`    <g:mpn>${escapeXml(product.sku)}</g:mpn>`);
  }
  if (brandName) {
    lines.push(`    <g:brand>${escapeXml(brandName)}</g:brand>`);
  }
  if (product.categories?.name) {
    lines.push(
      `    <g:product_type>${escapeXml(product.categories.name)}</g:product_type>`,
    );
  }

  lines.push(
    `    <g:condition>new</g:condition>`,
    `    <g:shipping>`,
    `      <g:country>GR</g:country>`,
    `      <g:price>0.00 EUR</g:price>`,
    `    </g:shipping>`,
    `  </item>`,
  );

  return lines.join("\n");
}

export async function GET() {
  const supabase = await createClient();
  const items: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("products")
      .select(
        `id, name, slug, description, price, compare_at_price,
         stock, sku, ean, images,
         brands:brand_id(name),
         categories:category_id(name, slug)`,
      )
      .eq("status", "active")
      .range(offset, offset + BATCH_SIZE - 1)
      .order("id");

    if (error || !data || data.length === 0) break;

    for (const product of data) {
      items.push(
        buildItemXml(product as unknown as Parameters<typeof buildItemXml>[0]),
      );
    }

    if (data.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>MotoMarket Product Feed</title>
    <link>${BASE_URL}</link>
    <description>MotoMarket product catalog feed for Google Merchant Center</description>
${items.join("\n")}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
