import {
  getProductReviews,
  getReviewStats,
  type ReviewSort,
} from "@/lib/queries/reviews";
import { RatingDistribution } from "./rating-distribution";
import { ReviewCard } from "./review-card";
import { ReviewsSort } from "./reviews-sort";
import { ReviewForm } from "./review-form";
import { ReviewsPagination } from "./reviews-pagination";

interface ReviewsSectionProps {
  productId: string;
  isLoggedIn: boolean;
  searchParams: Record<string, string | string[] | undefined>;
}

export async function ReviewsSection({
  productId,
  isLoggedIn,
  searchParams,
}: ReviewsSectionProps) {
  const sort =
    (searchParams["reviewSort"] as ReviewSort | undefined) ?? "recent";
  const page = Number(searchParams["reviewPage"] ?? "1");

  const [stats, { data: reviews, totalCount }] = await Promise.all([
    getReviewStats(productId),
    getProductReviews({ productId, sort, page }),
  ]);

  return (
    <section className="space-y-8" id="reviews">
      <h2 className="text-2xl font-bold">Κριτικές Πελατών</h2>
      <RatingDistribution stats={stats} />
      <ReviewsSort />
      {reviews.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Δεν υπάρχουν κριτικές ακόμα.
        </p>
      )}
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
      <ReviewsPagination totalCount={totalCount} currentPage={page} />
      <div className="border-t pt-6">
        <h3 className="mb-4 text-lg font-semibold">Γράψε κριτική</h3>
        <ReviewForm productId={productId} isLoggedIn={isLoggedIn} />
      </div>
    </section>
  );
}
