import { cacheTag, cacheLife } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";

// ─── Categories ──────────────────────────────────────────────────

export async function getTopCategories() {
  "use cache";
  cacheTag("categories");
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, image_url, position")
    .is("parent_id", null)
    .order("position", { ascending: true });

  return data ?? [];
}

export async function getCachedCategoryTree() {
  "use cache";
  cacheTag("categories");
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("id, slug, name, parent_id, position")
    .order("position", { ascending: true });

  if (!data) return [];

  type RawNode = {
    id: string;
    slug: string;
    name: string;
    parent_id: string | null;
    children: RawNode[];
  };

  const nodeMap = new Map<string, RawNode>();
  for (const row of data) {
    nodeMap.set(row.id, { ...row, children: [] });
  }

  const roots: RawNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parent_id) {
      nodeMap.get(node.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

// ─── Brands ──────────────────────────────────────────────────────

export async function getActiveBrands() {
  "use cache";
  cacheTag("brands");
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .order("name", { ascending: true });

  return data ?? [];
}

// ─── Featured Products ──────────────────────────────────────────

export async function getFeaturedProducts() {
  "use cache";
  cacheTag("products");
  cacheLife("hours");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select(
      `id, slug, name, price, compare_at_price, stock, images,
       brands:brand_id ( name, slug ),
       categories:category_id ( slug ),
       average_rating, review_count`,
    )
    .eq("is_featured", true)
    .eq("status", "active")
    .limit(6);

  if (!data) return [];

  return data.map((p) => {
    const brand = p.brands as unknown as { name: string; slug: string } | null;
    const category = p.categories as unknown as { slug: string } | null;
    const images = (p.images ?? []) as unknown as {
      url: string;
      alt: string;
      position: number;
    }[];

    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      brand: brand?.name ?? "",
      brand_slug: brand?.slug ?? "",
      category_slug: category?.slug ?? "",
      price: p.price,
      compare_at_price: p.compare_at_price,
      stock: p.stock,
      primary_image_url: images[0]?.url ?? "",
      primary_image_alt: images[0]?.alt ?? p.name,
      average_rating: p.average_rating,
      review_count: p.review_count,
    };
  });
}

// ─── Banners ─────────────────────────────────────────────────────

export async function getActiveBanners() {
  "use cache";
  cacheTag("banners");
  cacheLife("hours");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("banners")
    .select(
      "id, title, subtitle, cta_label, cta_href, image_url, gradient, accent_color, position",
    )
    .eq("is_active", true)
    .order("position", { ascending: true });

  return data ?? [];
}

// ─── Reviews ─────────────────────────────────────────────────────

export async function getTopReviews() {
  "use cache";
  cacheTag("reviews");
  cacheLife("hours");

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("reviews")
    .select(
      `id, rating, body, created_at,
       user_profiles:user_id ( first_name, last_name ),
       products:product_id ( name )`,
    )
    .eq("status", "approved")
    .gte("rating", 4)
    .order("created_at", { ascending: false })
    .limit(6);

  if (!data) return [];

  return data.map((r) => {
    const user = r.user_profiles as unknown as {
      first_name: string | null;
      last_name: string | null;
    } | null;
    const product = r.products as unknown as { name: string } | null;
    const fullName =
      [user?.first_name, user?.last_name].filter(Boolean).join(" ") ||
      "Πελάτης";

    return {
      id: r.id,
      name: fullName,
      rating: r.rating,
      text: r.body ?? "",
      product: product?.name ?? "",
    };
  });
}

// ─── Site Settings ───────────────────────────────────────────────

export async function getSiteSettings() {
  "use cache";
  cacheTag("settings");
  cacheLife("days");

  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("key, value");

  const settings: Record<string, unknown> = {};
  for (const row of data ?? []) {
    settings[row.key] = row.value;
  }
  return settings;
}
