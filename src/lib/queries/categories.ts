import { cacheTag, cacheLife } from "next/cache";
import type { Locale } from "@/i18n/config";
import { applyTranslation } from "@/lib/queries/products";

export interface Category {
  id: string;
  slug: string;
  full_path: string | null;
  name: string;
  description: string | null;
  seo_intro: string | null;
  parent_id: string | null;
  parent_slug: string | null;
  parent_name: string | null;
  image_url: string | null;
  position: number;
}

export interface CategoryTreeNode {
  id: string;
  slug: string;
  name: string;
  children: CategoryTreeNode[];
}

export interface BreadcrumbItem {
  label: string;
  href: string;
}

export interface BikeBrand {
  name: string;
  slug: string;
  path: string;
  models: { name: string; slug: string; path: string }[];
}

function rowToCategory(data: {
  id: string;
  slug: string;
  full_path?: string | null;
  name: string;
  description: string | null;
  seo_intro: string | null;
  parent_id: string | null;
  image_url: string | null;
  position: number;
}): Category {
  return {
    id: data.id,
    slug: data.slug,
    full_path: data.full_path ?? null,
    name: data.name,
    description: data.description,
    seo_intro: data.seo_intro,
    parent_id: data.parent_id,
    parent_slug: null,
    parent_name: null,
    image_url: data.image_url,
    position: data.position,
  };
}

const CATEGORY_COLS =
  "id, slug, full_path, name, description, seo_intro, parent_id, image_url, position";

export async function getCategory(
  slug: string,
  locale: Locale = "el",
): Promise<Category | null> {
  "use cache";
  cacheTag(`category:v3:${slug}:${locale}`);
  cacheTag("categories");
  cacheLife("hours");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_COLS)
    .eq("slug", slug)
    .maybeSingle();
  // Never cache a transient error as a 404 (see getProduct for rationale).
  if (error) throw new Error(`getCategory(${slug}): ${error.message}`);
  if (!data) return null;
  const category = rowToCategory(data as Parameters<typeof rowToCategory>[0]);

  if (locale === "el") return category;

  // Best-effort: a missing category_translations table or empty row falls
  // back to the Greek source so the page never blocks on i18n.
  const { data: tr } = await supabase
    .from("category_translations")
    .select("name,description")
    .eq("category_id", category.id)
    .eq("locale", locale)
    .maybeSingle();

  return applyTranslation(category, tr);
}

/** Brands (L2 under "my-bike") with their models (L3), for the bike finder. */
export async function getMyBikeBrands(): Promise<BikeBrand[]> {
  "use cache";
  cacheTag("categories");
  cacheLife("hours");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: root } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "my-bike")
    .maybeSingle();
  if (!root) return [];

  const { data: brands } = await supabase
    .from("categories")
    .select("id, name, slug, full_path")
    .eq("parent_id", root.id)
    .order("name", { ascending: true });
  if (!brands?.length) return [];

  const { data: models } = await supabase
    .from("categories")
    .select("name, slug, full_path, parent_id")
    .in(
      "parent_id",
      brands.map((b) => b.id),
    )
    .order("name", { ascending: true });

  const byBrand = new Map<
    string,
    { name: string; slug: string; path: string }[]
  >();
  for (const m of models ?? []) {
    const pid = m.parent_id as string;
    const list = byBrand.get(pid) ?? [];
    list.push({ name: m.name, slug: m.slug, path: m.full_path ?? "" });
    byBrand.set(pid, list);
  }

  return brands.map((b) => ({
    name: b.name,
    slug: b.slug,
    path: b.full_path ?? "",
    models: byBrand.get(b.id) ?? [],
  }));
}

/** Resolve a category by its full hierarchical path (Option B clean URLs). */
export async function getCategoryByPath(
  fullPath: string,
): Promise<Category | null> {
  "use cache";
  cacheTag("categories");
  cacheLife("hours");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select(CATEGORY_COLS)
    .eq("full_path", fullPath)
    .maybeSingle();
  // Never cache a transient error as a 404 (see getProduct for rationale).
  if (error)
    throw new Error(`getCategoryByPath(${fullPath}): ${error.message}`);
  if (!data) return null;
  return rowToCategory(data as Parameters<typeof rowToCategory>[0]);
}

export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  "use cache";
  cacheTag("categories");
  cacheLife("hours");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, name, parent_id, position")
    .order("position", { ascending: true });

  if (error || !data) return [];

  type RawNode = CategoryTreeNode & { parent_id: string | null };

  const nodeMap = new Map<string, RawNode>();
  for (const row of data) {
    nodeMap.set(row.id, {
      id: row.id,
      slug: row.slug,
      name: row.name,
      parent_id: row.parent_id,
      children: [],
    });
  }

  const roots: CategoryTreeNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.parent_id) {
      nodeMap.get(node.parent_id)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getCategoryBreadcrumbs(
  slug: string,
): Promise<BreadcrumbItem[]> {
  "use cache";
  cacheTag(`breadcrumbs:${slug}`);
  cacheTag("categories");
  cacheLife("hours");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const crumbs: BreadcrumbItem[] = [{ label: "Αρχική", href: "/" }];

  // Get the target category to know its full_path (which encodes the chain).
  const { data: target } = await supabase
    .from("categories")
    .select("slug, name, full_path")
    .eq("slug", slug)
    .maybeSingle();

  if (!target?.full_path) {
    if (target?.name && target?.slug) {
      crumbs.push({ label: target.name, href: `/${target.slug}` });
    }
    return crumbs;
  }

  // Build all prefix full_paths from the chain, then fetch them in ONE query.
  const parts = target.full_path.split("/");
  const prefixes: string[] = [];
  for (let i = 1; i <= parts.length; i++) {
    prefixes.push(parts.slice(0, i).join("/"));
  }

  const { data: chain } = await supabase
    .from("categories")
    .select("slug, name, full_path")
    .in("full_path", prefixes);

  if (!chain) return crumbs;

  // Sort ancestors by depth (shorter full_path first).
  const sorted = [...chain].sort(
    (a, b) => (a.full_path?.length ?? 0) - (b.full_path?.length ?? 0),
  );
  for (const c of sorted) {
    crumbs.push({ label: c.name, href: `/${c.slug}` });
  }

  return crumbs;
}

export async function getSubcategories(
  parentSlug: string,
  locale: Locale = "el",
): Promise<Category[]> {
  "use cache";
  cacheTag(`subcategories:${parentSlug}:${locale}`);
  cacheTag("categories");
  cacheLife("hours");
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();

  const { data: parent } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", parentSlug)
    .maybeSingle();

  if (!parent) return [];

  const { data, error } = await supabase
    .from("categories")
    .select(
      "id, slug, full_path, name, description, seo_intro, parent_id, image_url, position",
    )
    .eq("parent_id", parent.id)
    .order("position", { ascending: true });

  if (error || !data) return [];

  const subcategories: Category[] = data.map((row) => ({
    ...row,
    parent_slug: parentSlug,
    parent_name: null,
  }));

  if (locale === "el") return subcategories;

  // Best-effort: missing category_translations or empty result → Greek source.
  const ids = subcategories.map((c) => c.id);
  const { data: trs, error: trErr } = await supabase
    .from("category_translations")
    .select("category_id,name,description")
    .in("category_id", ids)
    .eq("locale", locale);
  if (trErr || !trs) return subcategories;
  const byId = new Map(trs.map((t) => [t.category_id, t]));
  return subcategories.map((c) => applyTranslation(c, byId.get(c.id)));
}

/** A category match shaped for the command palette (id, name, path to link). */
export interface CategoryMatch {
  id: string;
  name: string;
  full_path: string | null;
  slug: string;
}

/**
 * Find categories whose name matches `term`, for the ⌘K command palette.
 * Matches the Greek source name; when a non-Greek locale is requested the
 * localized name is overlaid best-effort (Greek stays as the fallback).
 */
export async function searchCategories(
  term: string,
  limit = 5,
  locale: Locale = "el",
): Promise<CategoryMatch[]> {
  const q = term.trim();
  if (q.length < 2) return [];
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const safe = q.replace(/[%_,]/g, " ");

  const { data, error } = await supabase
    .from("categories")
    .select("id, slug, full_path, name")
    .ilike("name", `%${safe}%`)
    .order("position", { ascending: true })
    .limit(limit);
  if (error || !data) return [];

  const matches: CategoryMatch[] = data.map((row) => ({
    id: row.id,
    slug: row.slug,
    full_path: row.full_path ?? null,
    name: row.name,
  }));

  if (locale === "el") return matches;

  const { data: trs } = await supabase
    .from("category_translations")
    .select("category_id,name")
    .in(
      "category_id",
      matches.map((c) => c.id),
    )
    .eq("locale", locale);
  if (!trs) return matches;
  const byId = new Map(trs.map((t) => [t.category_id, t.name]));
  return matches.map((c) => ({ ...c, name: byId.get(c.id) ?? c.name }));
}
