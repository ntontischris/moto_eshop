import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/queries/admin";
import { OrderStatusForm } from "./_components/order-status-form";

interface Props {
  params: Promise<{ id: string }>;
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

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await getAdminOrder(id);
  if (!result) notFound();

  const { order, items, events } = result;
  const addr = order.shipping_address as Record<string, string> | null;

  return (
    <div>
      <div className="flex items-center gap-4">
        <h1 className="font-display text-2xl text-text-primary">
          Παραγγελία {order.order_number}
        </h1>
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[order.status] ?? ""}`}
        >
          {order.status}
        </span>
      </div>
      <p className="mt-1 text-sm text-text-muted">
        {new Date(order.created_at).toLocaleDateString("el-GR", {
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <h2 className="font-display text-lg text-text-primary">Προϊόντα</h2>
          <div className="mt-3 overflow-hidden rounded-xl border border-border-default bg-bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-default text-left text-text-muted">
                  <th className="px-4 py-3 font-medium">Προϊόν</th>
                  <th className="px-4 py-3 text-center font-medium">Ποσότητα</th>
                  <th className="px-4 py-3 text-right font-medium">Τιμή</th>
                  <th className="px-4 py-3 text-right font-medium">Σύνολο</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const product = item.products as unknown as {
                    name: string;
                    slug: string;
                  } | null;
                  return (
                    <tr
                      key={item.id}
                      className="border-b border-border-default last:border-0"
                    >
                      <td className="px-4 py-3 text-text-primary">
                        {product?.name ?? "Διαγραμμένο προϊόν"}
                      </td>
                      <td className="px-4 py-3 text-center text-text-secondary">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right text-text-secondary">
                        €{item.unit_price.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-text-primary">
                        €{item.total.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-border-default px-4 py-3">
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Υποσύνολο</span>
                <span>€{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-text-secondary">
                <span>Αποστολή</span>
                <span>€{order.shipping_cost.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Έκπτωση</span>
                  <span>-€{order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="mt-2 flex justify-between border-t border-border-default pt-2 font-medium text-text-primary">
                <span>Σύνολο</span>
                <span>€{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Update Status */}
          <div className="rounded-xl border border-border-default bg-bg-surface p-4">
            <h3 className="text-sm font-medium text-text-primary">
              Ενημέρωση Κατάστασης
            </h3>
            <div className="mt-3">
              <OrderStatusForm
                orderId={order.id}
                currentStatus={order.status}
              />
            </div>
          </div>

          {/* Shipping Address */}
          {addr && (
            <div className="rounded-xl border border-border-default bg-bg-surface p-4">
              <h3 className="text-sm font-medium text-text-primary">
                Διεύθυνση Αποστολής
              </h3>
              <div className="mt-2 space-y-1 text-sm text-text-secondary">
                <p>
                  {addr.first_name} {addr.last_name}
                </p>
                <p>{addr.street}</p>
                <p>
                  {addr.city}, {addr.postal_code}
                </p>
                <p>{addr.country}</p>
                {addr.phone && <p>Τηλ: {addr.phone}</p>}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="rounded-xl border border-border-default bg-bg-surface p-4">
            <h3 className="text-sm font-medium text-text-primary">Ιστορικό</h3>
            <div className="mt-3 space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-teal" />
                  <div>
                    <p className="text-sm text-text-primary">{event.status}</p>
                    {event.note && (
                      <p className="text-xs text-text-muted">{event.note}</p>
                    )}
                    <p className="text-xs text-text-muted">
                      {new Date(event.created_at).toLocaleDateString("el-GR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-sm text-text-muted">Δεν υπάρχει ιστορικό</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
