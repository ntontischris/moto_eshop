"use client";

import { useTransition } from "react";
import { voteReview } from "@/lib/actions/reviews";
import type { Review } from "@/lib/queries/reviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp } from "lucide-react";

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Αρχάριος",
  intermediate: "Ενδιάμεσος",
  expert: "Έμπειρος",
};

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const [isPending, startTransition] = useTransition();

  function handleHelpful() {
    startTransition(async () => {
      await voteReview({ reviewId: review.id, isHelpful: true });
    });
  }

  return (
    <article className="space-y-2 rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-yellow-400">
            {"★".repeat(review.rating)}
            {"☆".repeat(5 - review.rating)}
          </span>
          {review.title && <h4 className="font-semibold">{review.title}</h4>}
        </div>
        <div className="flex gap-2">
          {review.is_verified && (
            <Badge variant="secondary">Επαληθευμένη αγορά</Badge>
          )}
          {review.riding_experience && (
            <Badge variant="outline">
              {EXPERIENCE_LABELS[review.riding_experience] ??
                review.riding_experience}
            </Badge>
          )}
        </div>
      </div>
      <p className="text-sm text-foreground">{review.body}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>{review.reviewer_name}</span>
        {review.bike_make && (
          <span>
            {review.bike_make} {review.bike_model}
          </span>
        )}
        {review.rider_height && review.rider_weight && (
          <span>
            {review.rider_height} cm / {review.rider_weight} kg
          </span>
        )}
        <time dateTime={review.created_at}>
          {new Date(review.created_at).toLocaleDateString("el-GR")}
        </time>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleHelpful}
        disabled={isPending}
      >
        <ThumbsUp className="mr-1 h-3 w-3" />
        Χρήσιμο
      </Button>
    </article>
  );
}
