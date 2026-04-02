import { cn } from "@/lib/utils";

interface StockBadgeProps {
  stock: number;
  className?: string;
}

export const StockBadge = ({ stock, className }: StockBadgeProps) => {
  if (stock <= 0) {
    return (
      <span className={cn("text-sm font-medium text-destructive", className)}>
        Εξαντλήθηκε
      </span>
    );
  }

  if (stock <= 5) {
    return (
      <span className={cn("text-sm font-medium text-amber-600", className)}>
        Μόνο {stock} τεμάχια
      </span>
    );
  }

  return (
    <span className={cn("text-sm font-medium text-green-600", className)}>
      Σε απόθεμα
    </span>
  );
};
