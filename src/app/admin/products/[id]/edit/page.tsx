import { notFound } from "next/navigation";
import {
  getAdminProduct,
  getAdminCategories,
  getAdminBrands,
} from "@/lib/queries/admin";
import { ProductForm } from "../../_components/product-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories, brands] = await Promise.all([
    getAdminProduct(id),
    getAdminCategories(),
    getAdminBrands(),
  ]);

  if (!product) notFound();

  const brand = product.brands as unknown as { id: string; name: string } | null;
  const cat = product.categories as unknown as { id: string; name: string } | null;

  return (
    <div>
      <h1 className="font-display text-2xl text-text-primary">
        Επεξεργασία Προϊόντος
      </h1>
      <p className="mt-1 text-sm text-text-muted">{product.name}</p>
      <div className="mt-6">
        <ProductForm
          categories={categories}
          brands={brands}
          defaultValues={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            description: product.description ?? "",
            price: product.price,
            compare_at_price: product.compare_at_price ?? undefined,
            cost_price: product.cost_price ?? undefined,
            stock: product.stock,
            sku: product.sku ?? "",
            brand_id: brand?.id ?? "",
            category_id: cat?.id ?? "",
            status: product.status as "draft" | "active" | "archived",
            certification: product.certification ?? "",
            rider_type: product.rider_type ?? "",
          }}
        />
      </div>
    </div>
  );
}
