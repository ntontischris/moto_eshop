import type { Category } from "@/lib/queries/categories";

interface CategoryHeaderProps {
  category: Category;
}

export function CategoryHeader({ category }: CategoryHeaderProps) {
  return (
    <header className="mb-2">
      <h1 className="text-2xl font-bold lg:text-3xl">{category.name}</h1>
      {category.seo_intro && (
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
          {category.seo_intro}
        </p>
      )}
    </header>
  );
}
