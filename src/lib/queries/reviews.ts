import { createClient } from "@/lib/supabase/server";

export type ReviewSort = "recent" | "highest" | "lowest";

export interface Review {
  id: string;
  product_id: string;
  user_id: string | null;
  rating: number;
  title: string | null;
  body: string;
  bike_make: string | null;
  bike_model: string | null;
  rider_height: number | null;
  rider_weight: number | null;
  riding_experience: string | null;
  is_verified: boolean;
  status: string;
  created_at: string;
  reviewer_name: string;
}

export interface ReviewStats {
  average_rating: number;
  total_count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

const PAGE_SIZE = 10;

export async function getProductReviews(params: {
  productId: string;
  sort?: ReviewSort;
  page?: number;
}): Promise<{ data: Review[]; totalCount: number }> {
  const { productId, sort = "recent", page = 1 } = params;
  const supabase = await createClient();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const orderMap: Record<ReviewSort, { column: string; ascending: boolean }> = {
    recent: { column: "created_at", ascending: false },
    highest: { column: "rating", ascending: false },
    lowest: { column: "rating", ascending: true },
  };
  const { column, ascending } = orderMap[sort];

  const { data, error, count } = await supabase
    .from("reviews")
    .select(
      `id, product_id, user_id, rating, title, body,
       bike_make, bike_model, rider_height, rider_weight,
       riding_experience, is_verified, status, created_at`,
      { count: "exact" },
    )
    .eq("product_id", productId)
    .eq("status", "approved")
    .order(column, { ascending })
    .range(from, to);

  if (error) return { data: [], totalCount: 0 };

  // Fetch reviewer names
  const userIds = [
    ...new Set((data ?? []).map((r) => r.user_id).filter(Boolean)),
  ] as string[];
  let nameMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name")
      .in("id", userIds);

    nameMap = new Map(
      (profiles ?? []).map((p) => [
        p.id,
        [p.first_name, p.last_name].filter(Boolean).join(" ") || "Ανώνυμος",
      ]),
    );
  }

  const reviews: Review[] = (data ?? []).map((r) => ({
    ...r,
    reviewer_name: r.user_id
      ? (nameMap.get(r.user_id) ?? "Ανώνυμος")
      : "Ανώνυμος",
  }));

  return { data: reviews, totalCount: count ?? 0 };
}

export async function getReviewStats(productId: string): Promise<ReviewStats> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("reviews")
    .select("rating")
    .eq("product_id", productId)
    .eq("status", "approved");

  const rows = data ?? [];
  if (rows.length === 0) {
    return {
      average_rating: 0,
      total_count: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<
    1 | 2 | 3 | 4 | 5,
    number
  >;
  let sum = 0;
  for (const row of rows) {
    const r = row.rating as 1 | 2 | 3 | 4 | 5;
    distribution[r] = (distribution[r] ?? 0) + 1;
    sum += r;
  }

  return {
    average_rating: Math.round((sum / rows.length) * 10) / 10,
    total_count: rows.length,
    distribution,
  };
}

export async function getQuestionsForProduct(productId: string) {
  const supabase = await createClient();

  const { data } = await supabase
    .from("questions")
    .select(
      `
      id, product_id, user_id, body, created_at,
      answers ( id, body, is_official, created_at, user_id )
    `,
    )
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  return data ?? [];
}
