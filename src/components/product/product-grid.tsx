import { ProductCard } from "@/components/product/product-card";
import type { ProductListItem } from "@/lib/queries/products";

interface ProductGridProps {
  products: ProductListItem[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          Δεν βρέθηκαν προϊόντα
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Δοκιμάστε να αλλάξετε τα φίλτρα αναζήτησης
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
