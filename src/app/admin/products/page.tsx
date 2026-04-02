import Link from "next/link";
import { getAdminProducts } from "@/lib/queries/admin";
import { deleteProduct } from "@/lib/actions/admin";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface Props {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-500/20 text-green-400",
  draft: "bg-yellow-500/20 text-yellow-400",
  archived: "bg-gray-500/20 text-gray-400",
};

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const perPage = 20;
  const { data: products, total } = await getAdminProducts({
    page,
    perPage,
    search: params.search,
    status: params.status,
  });
  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-text-primary">Προϊόντα</h1>
          <p className="mt-1 text-sm text-text-muted">{total} προϊόντα</p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-teal-hover"
        >
          <Plus className="h-4 w-4" />
          Νέο Προϊόν
        </Link>
      </div>

      {/* Filters */}
      <form className="mt-6 flex gap-3">
        <input
          name="search"
          type="text"
          placeholder="Αναζήτηση..."
          defaultValue={params.search ?? ""}
          className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
        />
        <select
          name="status"
          defaultValue={params.status ?? "all"}
          className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary"
        >
          <option value="all">Όλα</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-border-subtle"
        >
          Φιλτράρισμα
        </button>
      </form>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border-default bg-bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default text-left text-text-muted">
              <th className="px-4 py-3 font-medium">Προϊόν</th>
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Κατάσταση</th>
              <th className="px-4 py-3 text-right font-medium">Τιμή</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 text-right font-medium">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr
                key={product.id}
                className="border-b border-border-default last:border-0"
              >
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-text-primary">
                      {product.name}
                    </p>
                    <p className="text-xs text-text-muted">
                      {product.brand_name} · {product.category_name}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-muted">
                  {product.sku ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[product.status] ?? ""}`}
                  >
                    {product.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  €{product.price.toFixed(2)}
                  {product.compare_at_price && (
                    <span className="ml-1 text-xs text-text-muted line-through">
                      €{product.compare_at_price.toFixed(2)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={
                      product.stock < 5
                        ? "font-medium text-red-400"
                        : "text-text-secondary"
                    }
                  >
                    {product.stock}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${product.id}/edit`}
                      className="rounded p-1 text-text-muted transition-colors hover:bg-bg-elevated hover:text-brand-teal"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <form
                      action={async () => {
                        "use server";
                        await deleteProduct(product.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded p-1 text-text-muted transition-colors hover:bg-bg-elevated hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  Δεν βρέθηκαν προϊόντα
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/products?page=${p}${params.search ? `&search=${params.search}` : ""}${params.status ? `&status=${params.status}` : ""}`}
              className={`rounded-lg px-3 py-1 text-sm ${
                p === page
                  ? "bg-brand-teal text-white"
                  : "text-text-muted hover:bg-bg-elevated"
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
