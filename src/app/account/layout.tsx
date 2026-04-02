import { requireAuth } from "@/lib/auth/guards";
import { AccountSidebar } from "@/components/account/sidebar";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-8 md:flex-row">
        <AccountSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
