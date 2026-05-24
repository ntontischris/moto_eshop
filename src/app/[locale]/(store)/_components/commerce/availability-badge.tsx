import { getAvailabilityState } from "../../_lib/availability";

interface AvailabilityBadgeProps {
  stock: number;
}

export function AvailabilityBadge({ stock }: AvailabilityBadgeProps) {
  const availability = getAvailabilityState(stock);
  const className = [
    "v3-availability",
    availability.isImmediate ? "is-ready" : "",
    !availability.isImmediate && availability.isOrderable ? "is-backorder" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={className}>
      <span aria-hidden="true" />
      {availability.badgeLabel}
    </span>
  );
}
