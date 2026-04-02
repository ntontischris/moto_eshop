import { Truck } from "lucide-react";

interface DeliveryEstimateProps {
  inStock: boolean;
}

function getDeliveryText(inStock: boolean): string {
  if (!inStock) return "Κατόπιν παραγγελίας (5–10 εργάσιμες)";
  return "Παράδοση σε 1–3 εργάσιμες ημέρες";
}

export function DeliveryEstimate({ inStock }: DeliveryEstimateProps) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-sm">
      <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span>{getDeliveryText(inStock)}</span>
    </div>
  );
}
