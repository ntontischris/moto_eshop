import Link from "next/link";
import { getAdminUsers } from "@/lib/queries/admin";
import { updateUserRole } from "@/lib/actions/admin";

interface Props {
  searchParams: Promise<{ page?: string; search?: string }>;
}

const ROLE_BADGE: Record<string, string> = {
  user: "bg-gray-500/20 text-gray-400",
  admin: "bg-blue-500/20 text-blue-400",
  super_admin: "bg-purple-500/20 text-purple-400",
};

const SEGMENT_BADGE: Record<string, string> = {
  champion: "bg-yellow-500/20 text-yellow-400",
  loyal: "bg-green-500/20 text-green-400",
  at_risk: "bg-red-500/20 text-red-400",
  new: "bg-blue-500/20 text-blue-400",
  hibernating: "bg-gray-500/20 text-gray-400",
};

export default async function AdminUsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const perPage = 20;
  const { data: users, total } = await getAdminUsers({
    page,
    perPage,
    search: params.search,
  });
  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <h1 className="font-display text-2xl text-text-primary">Χρήστες</h1>
      <p className="mt-1 text-sm text-text-muted">{total} χρήστες</p>

      {/* Search */}
      <form className="mt-6 flex gap-3">
        <input
          name="search"
          type="text"
          placeholder="Αναζήτηση ονόματος..."
          defaultValue={params.search ?? ""}
          className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted"
        />
        <button
          type="submit"
          className="rounded-lg bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-border-subtle"
        >
          Αναζήτηση
        </button>
      </form>

      {/* Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border-default bg-bg-surface">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-default text-left text-text-muted">
              <th className="px-4 py-3 font-medium">Χρήστης</th>
              <th className="px-4 py-3 font-medium">Ρόλος</th>
              <th className="px-4 py-3 font-medium">Segment</th>
              <th className="px-4 py-3 font-medium">Τύπος Αναβάτη</th>
              <th className="px-4 py-3 text-right font-medium">Ημ/νία</th>
              <th className="px-4 py-3 text-right font-medium">Ρόλος</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-border-default last:border-0"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-text-primary">
                    {user.first_name ?? ""} {user.last_name ?? ""}
                    {!user.first_name && !user.last_name && (
                      <span className="text-text-muted">Ανώνυμος</span>
                    )}
                  </p>
                  {user.phone && (
                    <p className="text-xs text-text-muted">{user.phone}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE[user.role] ?? ""}`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {user.rfm_segment ? (
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${SEGMENT_BADGE[user.rfm_segment] ?? ""}`}
                    >
                      {user.rfm_segment}
                    </span>
                  ) : (
                    <span className="text-text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {user.rider_type ?? "—"}
                </td>
                <td className="px-4 py-3 text-right text-text-muted">
                  {new Date(user.created_at).toLocaleDateString("el-GR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <form
                    action={async (fd: FormData) => {
                      "use server";
                      const role = fd.get("role") as
                        | "user"
                        | "admin"
                        | "super_admin";
                      await updateUserRole(user.id, role);
                    }}
                    className="flex items-center justify-end gap-2"
                  >
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="rounded-lg border border-border-default bg-bg-elevated px-2 py-1 text-xs text-text-primary"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded px-2 py-1 text-xs text-brand-teal transition-colors hover:bg-bg-elevated"
                    >
                      Save
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-text-muted"
                >
                  Δεν βρέθηκαν χρήστες
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
              href={`/admin/users?page=${p}${params.search ? `&search=${params.search}` : ""}`}
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
