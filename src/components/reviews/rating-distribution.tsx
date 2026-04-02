import type { ReviewStats } from "@/lib/queries/reviews";

interface RatingDistributionProps {
  stats: ReviewStats;
}

export function RatingDistribution({ stats }: RatingDistributionProps) {
  const { average_rating, total_count, distribution } = stats;

  return (
    <div className="flex gap-6">
      <div className="flex flex-col items-center justify-center">
        <span className="text-5xl font-bold">{average_rating}</span>
        <div className="text-xl text-yellow-400">
          {"★".repeat(Math.round(average_rating))}
          {"☆".repeat(5 - Math.round(average_rating))}
        </div>
        <span className="text-sm text-muted-foreground">
          {total_count} κριτικές
        </span>
      </div>
      <div className="flex-1 space-y-1">
        {([5, 4, 3, 2, 1] as const).map((star) => {
          const count = distribution[star] ?? 0;
          const pct =
            total_count > 0 ? Math.round((count / total_count) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-6 text-right">{star}</span>
              <div className="h-3 flex-1 overflow-hidden rounded bg-muted">
                <div
                  className="h-full rounded bg-yellow-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-muted-foreground">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
