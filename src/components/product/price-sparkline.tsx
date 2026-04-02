import type { PricePoint } from "@/lib/queries/price-history";

interface PriceSparklineProps {
  data: PricePoint[];
  width?: number;
  height?: number;
  days: 30 | 90 | 180;
}

function buildPath(
  points: PricePoint[],
  width: number,
  height: number,
  pad: number,
): string {
  if (points.length < 2) return "";
  const prices = points.map((p) => p.price);
  const times = points.map((p) => new Date(p.recorded_at).getTime());
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const minT = Math.min(...times);
  const maxT = Math.max(...times);
  const rangeP = maxP - minP || 1;
  const rangeT = maxT - minT || 1;
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;

  const coords = points.map((p) => {
    const x =
      pad + ((new Date(p.recorded_at).getTime() - minT) / rangeT) * innerW;
    const y = pad + innerH - ((p.price - minP) / rangeP) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M ${coords.join(" L ")}`;
}

export function PriceSparkline({
  data,
  width = 300,
  height = 80,
  days,
}: PriceSparklineProps) {
  if (data.length < 2) {
    return (
      <p className="text-xs text-muted-foreground">
        Δεν υπάρχουν αρκετά δεδομένα ιστορικού τιμής.
      </p>
    );
  }

  const pad = 12;
  const path = buildPath(data, width, height, pad);
  const prices = data.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const latest = data[data.length - 1]?.price ?? 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Ιστορικό {days} ημερών</span>
        <span>Τώρα: {latest.toFixed(2)} EUR</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label={`Ιστορικό τιμής: από ${min.toFixed(2)} EUR έως ${max.toFixed(2)} EUR`}
      >
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-primary"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Min: {min.toFixed(2)} EUR</span>
        <span>Max: {max.toFixed(2)} EUR</span>
      </div>
    </div>
  );
}
