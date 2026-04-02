"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PriceSparkline } from "@/components/product/price-sparkline";
import type { PricePoint } from "@/lib/queries/price-history";

interface PriceHistorySectionProps {
  data30: PricePoint[];
  data90: PricePoint[];
  data180: PricePoint[];
}

const DAY_OPTIONS = [30, 90, 180] as const;

export function PriceHistorySection({
  data30,
  data90,
  data180,
}: PriceHistorySectionProps) {
  const [days, setDays] = useState<30 | 90 | 180>(90);
  const dataMap = { 30: data30, 90: data90, 180: data180 };

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {DAY_OPTIONS.map((d) => (
          <Button
            key={d}
            size="sm"
            variant={days === d ? "default" : "outline"}
            onClick={() => setDays(d)}
          >
            {d} ημ.
          </Button>
        ))}
      </div>
      <PriceSparkline data={dataMap[days]} days={days} />
    </div>
  );
}
