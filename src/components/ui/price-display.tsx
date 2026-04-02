import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  price: number;
  compareAtPrice?: number | null;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const PriceDisplay = ({
  price,
  compareAtPrice,
  currency = "€",
  size = "md",
  className,
}: PriceDisplayProps) => {
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPct = hasDiscount
    ? Math.round((1 - price / compareAtPrice) * 100)
    : 0;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span
        className={cn(
          "font-bold",
          sizeClasses[size],
          hasDiscount && "text-brand-red",
        )}
      >
        {currency}
        {price.toFixed(2)}
      </span>
      {hasDiscount && (
        <>
          <span
            className={cn(
              "text-muted-foreground line-through",
              size === "lg" ? "text-base" : "text-sm",
            )}
          >
            {currency}
            {compareAtPrice.toFixed(2)}
          </span>
          <span className="bg-brand-red text-white text-xs font-bold px-1.5 py-0.5 rounded">
            -{discountPct}%
          </span>
        </>
      )}
    </div>
  );
};
