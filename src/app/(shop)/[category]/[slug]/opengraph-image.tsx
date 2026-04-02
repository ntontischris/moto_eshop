import { ImageResponse } from "next/og";

import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const alt = "Product image";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ProductImage {
  url: string;
  alt: string;
  position: number;
}

async function fetchProduct(slug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select(`name, price, compare_at_price, slug, images, brands ( name )`)
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (error || !data) return null;

  const brand = data.brands as unknown as { name: string } | null;
  const images = (data.images as unknown as ProductImage[]) ?? [];
  const primaryImage = [...images].sort((a, b) => a.position - b.position)[0];

  return {
    name: data.name as string,
    price: data.price as number,
    compareAtPrice: data.compare_at_price as number | null,
    brandName: brand?.name ?? "",
    imageUrl: primaryImage?.url ?? null,
  };
}

function formatEur(amount: number): string {
  return `${amount.toFixed(2).replace(".", ",")} €`;
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug);

  if (!product) {
    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          color: "#f8fafc",
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        MotoMarket
      </div>,
      { ...size },
    );
  }

  const displayPrice =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? product.price
      : product.price;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: "#0f172a",
        padding: 48,
      }}
    >
      {product.imageUrl && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "50%",
            height: "100%",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.imageUrl}
            alt={product.name}
            width={480}
            height={480}
            style={{ objectFit: "contain" }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: product.imageUrl ? "50%" : "100%",
          paddingLeft: product.imageUrl ? 32 : 0,
        }}
      >
        {product.brandName && (
          <div
            style={{
              fontSize: 24,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            {product.brandName}
          </div>
        )}

        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: "#f8fafc",
            lineHeight: 1.2,
            marginBottom: 24,
          }}
        >
          {product.name}
        </div>

        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            color: "#f97316",
          }}
        >
          {formatEur(displayPrice)}
        </div>

        <div
          style={{
            fontSize: 20,
            color: "#64748b",
            marginTop: "auto",
          }}
        >
          motomarket.gr
        </div>
      </div>
    </div>,
    { ...size },
  );
}
