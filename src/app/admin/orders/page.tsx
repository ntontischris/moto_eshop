import Link from "next/link";
import { getAdminOrders } from "@/lib/queries/admin";

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  processing: "bg-purple-500/20 text-purple-400",
  shipped: "bg-cyan-500/20 text-cyan-400",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
  refunded: "bg-orange-500/20 text-orange-400",
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const perPage = 20;
  const { data: orders, total } = await getAdminOrders({
    page,
    perPage,
    status: params.status,
  });
  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <h1 className="font-display text-2xl text-text-primary">Παραγγελίες</h1>
      <p className="mt-1 text-sm text-text-muted">{total} παραγγελίες</p>

      {/* Filters */}
      <form className="mt-6 flex gap-3">
        <select
          name="status"
          defaultValue={params.status ?? "all"}
          className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary"
        >
          <option value="all">Όλες</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
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
              <th className="px-4 py-3 font-medium">Αρ. Παραγγελίας</th>
              <th className="px-4 py-3 font-medium">Κατάσταση</th>
              <th className="px-4 py-3 text-right font-medium">Σύνολο</th>
              <th className="px-4 py-3 text-right font-medium">Ημ/νία</th>
              <th className="px-4 py-3 text-right font-medium">Ενέργειες</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-border-default last:border-0"
              >
                <td className="px-4 py-3 font-medium text-text-primary">
                  {order.order_number}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[order.status] ?? ""}`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-text-secondary">
                  €{order.total.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-right text-text-muted">
                  {new Date(order.created_at).toLocaleDateString("el-GR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-brand-teal hover:underline"
                  >
                    Προβολή
                  </Link>
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  Δεν βρέθηκαν παραγγελίες
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
              href={`/admin/orders?page=${p}${params.status ? `&status=${params.status}` : ""}`}
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
