import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  Star,
  Users,
  ArrowLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Προϊόντα", icon: Package },
  { href: "/admin/orders", label: "Παραγγελίες", icon: ShoppingCart },
  { href: "/admin/categories", label: "Κατηγορίες & Brands", icon: FolderTree },
  { href: "/admin/reviews", label: "Αξιολογήσεις", icon: Star },
  { href: "/admin/users", label: "Χρήστες", icon: Users },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-bg-deep">
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-border-default bg-bg-surface">
        <div className="flex items-center gap-2 border-b border-border-default px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-brand-teal text-sm font-bold text-white">
            M
          </div>
          <div>
            <p className="font-display text-sm text-text-primary">MotoMarket</p>
            <p className="text-xs text-text-muted">Admin Panel</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border-default px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Πίσω στο site
          </Link>
          <p className="mt-2 px-3 text-xs text-text-muted">
            {user.adminRole === "super_admin" ? "Super Admin" : "Admin"}
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
