import { createAdminClient } from "@/lib/supabase/admin";

// ─── Dashboard Metrics ────────────────────────────────────────────

export interface DashboardMetrics {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalUsers: number;
  pendingReviews: number;
  lowStockProducts: number;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const supabase = createAdminClient();

  const [products, activeProducts, orders, pendingOrders, users, pendingReviews, lowStock] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("reviews").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("status", "active").lt("stock", 5),
    ]);

  const { data: revenueData } = await supabase
    .from("orders")
    .select("total")
    .in("status", ["confirmed", "processing", "shipped", "delivered"]);

  const totalRevenue = (revenueData ?? []).reduce((sum, o) => sum + (o.total ?? 0), 0);

  return {
    totalProducts: products.count ?? 0,
    activeProducts: activeProducts.count ?? 0,
    totalOrders: orders.count ?? 0,
    pendingOrders: pendingOrders.count ?? 0,
    totalRevenue,
    totalUsers: users.count ?? 0,
    pendingReviews: pendingReviews.count ?? 0,
    lowStockProducts: lowStock.count ?? 0,
  };
}

export interface RecentOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

export async function getRecentOrders(limit = 10): Promise<RecentOrder[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as RecentOrder[];
}

// ─── Products ─────────────────────────────────────────────────────

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  stock: number;
  status: string;
  sku: string | null;
  brand_name: string | null;
  category_name: string | null;
  images: { url: string; alt: string; position: number }[];
  created_at: string;
}

export async function getAdminProducts(options: {
  page?: number;
  perPage?: number;
  search?: string;
  status?: string;
}): Promise<{ data: AdminProduct[]; total: number }> {
  const { page = 1, perPage = 20, search, status } = options;
  const supabase = createAdminClient();
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("products")
    .select(
      `id, name, slug, price, compare_at_price, stock, status, sku, images, created_at,
       brands ( name ), categories ( name )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }
  if (status && status !== "all") {
    query = query.eq("status", status as "draft" | "active" | "archived");
  }

  const { data, count } = await query;

  const products: AdminProduct[] = (data ?? []).map((row) => {
    const brand = row.brands as unknown as { name: string } | null;
    const cat = row.categories as unknown as { name: string } | null;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      price: row.price,
      compare_at_price: row.compare_at_price,
      stock: row.stock,
      status: row.status,
      sku: row.sku,
      brand_name: brand?.name ?? null,
      category_name: cat?.name ?? null,
      images: (row.images as unknown as { url: string; alt: string; position: number }[]) ?? [],
      created_at: row.created_at,
    };
  });

  return { data: products, total: count ?? 0 };
}

export async function getAdminProduct(id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(
      `*, brands ( id, name ), categories ( id, name )`,
    )
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data;
}

// ─── Orders ───────────────────────────────────────────────────────

export interface AdminOrder {
  id: string;
  order_number: string;
  status: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  shipping_address: Record<string, string> | null;
  created_at: string;
  user_id: string | null;
}

export async function getAdminOrders(options: {
  page?: number;
  perPage?: number;
  status?: string;
}): Promise<{ data: AdminOrder[]; total: number }> {
  const { page = 1, perPage = 20, status } = options;
  const supabase = createAdminClient();
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, total, subtotal, shipping_cost, discount, shipping_address, created_at, user_id",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (status && status !== "all") {
    query = query.eq("status", status as "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded");
  }

  const { data, count } = await query;
  return {
    data: (data ?? []) as AdminOrder[],
    total: count ?? 0,
  };
}

export async function getAdminOrder(id: string) {
  const supabase = createAdminClient();

  const [orderResult, itemsResult, eventsResult] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).single(),
    supabase
      .from("order_items")
      .select("*, products ( name, slug, images )")
      .eq("order_id", id),
    supabase
      .from("order_events")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!orderResult.data) return null;

  return {
    order: orderResult.data,
    items: itemsResult.data ?? [],
    events: eventsResult.data ?? [],
  };
}

// ─── Categories & Brands ──────────────────────────────────────────

export async function getAdminCategories() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id, position, image_url, description")
    .order("position", { ascending: true });
  return data ?? [];
}

export async function getAdminBrands() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url, description")
    .order("name", { ascending: true });
  return data ?? [];
}

// ─── Reviews ──────────────────────────────────────────────────────

export interface AdminReview {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  is_verified: boolean;
  created_at: string;
  product_name: string | null;
  product_slug: string | null;
}

export async function getAdminReviews(options: {
  page?: number;
  perPage?: number;
  status?: string;
}): Promise<{ data: AdminReview[]; total: number }> {
  const { page = 1, perPage = 20, status } = options;
  const supabase = createAdminClient();
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("reviews")
    .select(
      `id, rating, title, body, status, is_verified, created_at,
       products ( name, slug )`,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (status && status !== "all") {
    query = query.eq("status", status as "pending" | "approved" | "rejected");
  }

  const { data, count } = await query;

  const reviews: AdminReview[] = (data ?? []).map((row) => {
    const product = row.products as unknown as { name: string; slug: string } | null;
    return {
      id: row.id,
      rating: row.rating,
      title: row.title,
      body: row.body,
      status: row.status,
      is_verified: row.is_verified,
      created_at: row.created_at,
      product_name: product?.name ?? null,
      product_slug: product?.slug ?? null,
    };
  });

  return { data: reviews, total: count ?? 0 };
}

// ─── Users ────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  rider_type: string | null;
  rfm_segment: string | null;
  created_at: string;
}

export async function getAdminUsers(options: {
  page?: number;
  perPage?: number;
  search?: string;
}): Promise<{ data: AdminUser[]; total: number }> {
  const { page = 1, perPage = 20, search } = options;
  const supabase = createAdminClient();
  const offset = (page - 1) * perPage;

  let query = supabase
    .from("user_profiles")
    .select("id, first_name, last_name, phone, role, rider_type, rfm_segment, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  }

  const { data, count } = await query;
  return {
    data: (data ?? []) as unknown as AdminUser[],
    total: count ?? 0,
  };
}
