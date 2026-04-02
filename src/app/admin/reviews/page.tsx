import Link from "next/link";
import { getAdminReviews } from "@/lib/queries/admin";
import { approveReview, rejectReview, deleteReview } from "@/lib/actions/admin";
import { Check, X, Trash2, Star } from "lucide-react";

interface Props {
  searchParams: Promise<{ page?: string; status?: string }>;
}

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  approved: "bg-green-500/20 text-green-400",
  rejected: "bg-red-500/20 text-red-400",
};

export default async function AdminReviewsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const perPage = 20;
  const { data: reviews, total } = await getAdminReviews({
    page,
    perPage,
    status: params.status,
  });
  const totalPages = Math.ceil(total / perPage);

  return (
    <div>
      <h1 className="font-display text-2xl text-text-primary">Αξιολογήσεις</h1>
      <p className="mt-1 text-sm text-text-muted">{total} αξιολογήσεις</p>

      {/* Filters */}
      <form className="mt-6 flex gap-3">
        <select
          name="status"
          defaultValue={params.status ?? "all"}
          className="rounded-lg border border-border-default bg-bg-elevated px-3 py-2 text-sm text-text-primary"
        >
          <option value="all">Όλες</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-bg-elevated px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-border-subtle"
        >
          Φιλτράρισμα
        </button>
      </form>

      {/* Reviews List */}
      <div className="mt-4 space-y-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="rounded-xl border border-border-default bg-bg-surface p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-gold text-gold"
                            : "text-text-muted"
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[review.status] ?? ""}`}
                  >
                    {review.status}
                  </span>
                  {review.is_verified && (
                    <span className="text-xs text-green-400">Verified</span>
                  )}
                </div>
                {review.title && (
                  <p className="mt-1 font-medium text-text-primary">
                    {review.title}
                  </p>
                )}
                {review.body && (
                  <p className="mt-1 text-sm text-text-secondary">
                    {review.body}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-text-muted">
                  {review.product_name && (
                    <span>Προϊόν: {review.product_name}</span>
                  )}
                  <span>
                    {new Date(review.created_at).toLocaleDateString("el-GR")}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="ml-4 flex items-center gap-1">
                {review.status === "pending" && (
                  <>
                    <form
                      action={async () => {
                        "use server";
                        await approveReview(review.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded p-1.5 text-text-muted transition-colors hover:bg-green-500/20 hover:text-green-400"
                        title="Έγκριση"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await rejectReview(review.id);
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/20 hover:text-red-400"
                        title="Απόρριψη"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </form>
                  </>
                )}
                <form
                  action={async () => {
                    "use server";
                    await deleteReview(review.id);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded p-1.5 text-text-muted transition-colors hover:bg-red-500/20 hover:text-red-400"
                    title="Διαγραφή"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="py-8 text-center text-text-muted">
            Δεν βρέθηκαν αξιολογήσεις
          </p>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/reviews?page=${p}${params.status ? `&status=${params.status}` : ""}`}
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
