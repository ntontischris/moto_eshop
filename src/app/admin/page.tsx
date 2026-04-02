import {
  getDashboardMetrics,
  getRecentOrders,
} from "@/lib/queries/admin";
import {
  Package,
  ShoppingCart,
  DollarSign,
  Users,
  Star,
  AlertTriangle,
} from "lucide-react";

function MetricCard({
  label,
  value,
  icon: Icon,
  colorClass,
  bgClass,
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
}) {
  return (
    <div className="rounded-xl border border-border-default bg-bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-muted">{label}</p>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${bgClass}`}
        >
          <Icon className={`h-4 w-4 ${colorClass}`} />
        </div>
      </div>
      <p className="mt-2 font-display text-2xl text-text-primary">{value}</p>
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  processing: "bg-purple-500/20 text-purple-400",
  shipped: "bg-cyan-500/20 text-cyan-400",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
  refunded: "bg-orange-500/20 text-orange-400",
};

export default async function AdminDashboard() {
  const [metrics, recentOrders] = await Promise.all([
    getDashboardMetrics(),
    getRecentOrders(8),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-text-primary">Dashboard</h1>
      <p className="mt-1 text-sm text-text-muted">
        Επισκόπηση του καταστήματος
      </p>

      {/* Metrics Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Συνολικά Προϊόντα"
          value={`${metrics.activeProducts} / ${metrics.totalProducts}`}
          icon={Package}
          colorClass="text-brand-teal"
          bgClass="bg-brand-teal/20"
        />
        <MetricCard
          label="Παραγγελίες"
          value={metrics.totalOrders}
          icon={ShoppingCart}
          colorClass="text-purple-400"
          bgClass="bg-purple-500/20"
        />
        <MetricCard
          label="Έσοδα"
          value={`€${metrics.totalRevenue.toLocaleString("el-GR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          colorClass="text-green-400"
          bgClass="bg-green-500/20"
        />
        <MetricCard
          label="Χρήστες"
          value={metrics.totalUsers}
          icon={Users}
          colorClass="text-blue-400"
          bgClass="bg-blue-500/20"
        />
      </div>

      {/* Alert Cards */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {metrics.pendingReviews > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
            <Star className="h-5 w-5 text-yellow-400" />
            <p className="text-sm text-yellow-200">
              <strong>{metrics.pendingReviews}</strong> αξιολογήσεις προς έγκριση
            </p>
          </div>
        )}
        {metrics.lowStockProducts > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            <p className="text-sm text-orange-200">
              <strong>{metrics.lowStockProducts}</strong> προϊόντα με χαμηλό stock
            </p>
          </div>
        )}
        {metrics.pendingOrders > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
            <ShoppingCart className="h-5 w-5 text-blue-400" />
            <p className="text-sm text-blue-200">
              <strong>{metrics.pendingOrders}</strong> παραγγελίες σε αναμονή
            </p>
          </div>
        )}
      </div>

      {/* Recent Orders */}
      <div className="mt-8">
        <h2 className="font-display text-lg text-text-primary">
          Πρόσφατες Παραγγελίες
        </h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border-default bg-bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-default text-left text-text-muted">
                <th className="px-4 py-3 font-medium">Αρ. Παραγγελίας</th>
                <th className="px-4 py-3 font-medium">Κατάσταση</th>
                <th className="px-4 py-3 text-right font-medium">Σύνολο</th>
                <th className="px-4 py-3 text-right font-medium">Ημ/νία</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border-default last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-text-primary">
                    {order.order_number}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-500/20 text-gray-400"}`}
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
                </tr>
              ))}
              {recentOrders.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-text-muted"
                  >
                    Δεν υπάρχουν παραγγελίες
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
