import type { ReviewStats, Review } from "@/lib/queries/reviews";

export function generateAggregateRating(stats: ReviewStats) {
  if (stats.total_count === 0) return undefined;
  return {
    "@type": "AggregateRating",
    ratingValue: stats.average_rating,
    reviewCount: stats.total_count,
    bestRating: 5,
    worstRating: 1,
  };
}

export function generateReviewsJsonLd(reviews: Review[]) {
  return reviews.slice(0, 5).map((r) => ({
    "@type": "Review",
    author: {
      "@type": "Person",
      name: r.reviewer_name,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    name: r.title,
    reviewBody: r.body,
    datePublished: r.created_at.split("T")[0],
  }));
}
