import { createClient } from "@/lib/supabase/server";

export interface Category {
  id: string;
  slug: string;
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

export async function getCategory(slug: string): Promise<Category | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      id, slug, name, description, seo_intro, parent_id, image_url, position,
      parent:categories!parent_id ( slug, name )
    `,
    )
    .eq("slug", slug)
    .single();

  if (error || !data) return null;

  const parent = data.parent as unknown as {
    slug: string;
    name: string;
  } | null;

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description,
    seo_intro: data.seo_intro,
    parent_id: data.parent_id,
    parent_slug: parent?.slug ?? null,
    parent_name: parent?.name ?? null,
    image_url: data.image_url,
    position: data.position,
  };
}

export async function getCategoryTree(): Promise<CategoryTreeNode[]> {
  const supabase = await createClient();

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
  const supabase = await createClient();
  const crumbs: BreadcrumbItem[] = [{ label: "Αρχική", href: "/" }];

  const ancestors: { name: string; slug: string }[] = [];
  let currentSlug: string | null = slug;
  let depth = 0;

  while (currentSlug && depth < 5) {
    const { data, error } = await supabase
      .from("categories")
      .select("name, slug, parent:categories!parent_id ( slug )")
      .eq("slug", currentSlug)
      .single();

    if (error || !data) break;

    ancestors.unshift({ name: data.name, slug: data.slug });
    const parent = data.parent as unknown as { slug: string } | null;
    currentSlug = parent?.slug ?? null;
    depth += 1;
  }

  for (const ancestor of ancestors) {
    crumbs.push({ label: ancestor.name, href: `/${ancestor.slug}` });
  }

  return crumbs;
}

export async function getSubcategories(
  parentSlug: string,
): Promise<Category[]> {
  const supabase = await createClient();

  const { data: parent } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", parentSlug)
    .single();

  if (!parent) return [];

  const { data, error } = await supabase
    .from("categories")
    .select(
      "id, slug, name, description, seo_intro, parent_id, image_url, position",
    )
    .eq("parent_id", parent.id)
    .order("position", { ascending: true });

  if (error || !data) return [];

  return data.map((row) => ({
    ...row,
    parent_slug: parentSlug,
    parent_name: null,
  }));
}
