import { getAdminCategories, getAdminBrands } from "@/lib/queries/admin";
import {
  deleteCategory,
  deleteBrand,
} from "@/lib/actions/admin";
import { Trash2 } from "lucide-react";
import { CategoryForm } from "./_components/category-form";
import { BrandForm } from "./_components/brand-form";

export default async function AdminCategoriesPage() {
  const [categories, brands] = await Promise.all([
    getAdminCategories(),
    getAdminBrands(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-text-primary">
        Κατηγορίες & Brands
      </h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* Categories */}
        <div>
          <h2 className="font-display text-lg text-text-primary">Κατηγορίες</h2>
          <div className="mt-4">
            <CategoryForm categories={categories} />
          </div>
          <div className="mt-4 space-y-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-lg border border-border-default bg-bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {cat.parent_id ? "  └ " : ""}
                    {cat.name}
                  </p>
                  <p className="text-xs text-text-muted">{cat.slug}</p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await deleteCategory(cat.id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded p-1 text-text-muted transition-colors hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-text-muted">Δεν υπάρχουν κατηγορίες</p>
            )}
          </div>
        </div>

        {/* Brands */}
        <div>
          <h2 className="font-display text-lg text-text-primary">Brands</h2>
          <div className="mt-4">
            <BrandForm />
          </div>
          <div className="mt-4 space-y-2">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="flex items-center justify-between rounded-lg border border-border-default bg-bg-surface px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {brand.name}
                  </p>
                  <p className="text-xs text-text-muted">{brand.slug}</p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await deleteBrand(brand.id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded p-1 text-text-muted transition-colors hover:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            ))}
            {brands.length === 0 && (
              <p className="text-sm text-text-muted">Δεν υπάρχουν brands</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
