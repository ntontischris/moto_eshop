import { getAdminCategories, getAdminBrands } from "@/lib/queries/admin";
import { ProductForm } from "../_components/product-form";

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    getAdminCategories(),
    getAdminBrands(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-text-primary">Νέο Προϊόν</h1>
      <p className="mt-1 text-sm text-text-muted">
        Δημιουργία νέου προϊόντος
      </p>
      <div className="mt-6">
        <ProductForm categories={categories} brands={brands} />
      </div>
    </div>
  );
}
