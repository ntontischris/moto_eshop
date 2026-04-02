import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, PlusCircle } from "lucide-react";

type CompatibilityStatus = "compatible" | "incompatible" | "no-garage";

interface CompatibilityBadgeProps {
  status: CompatibilityStatus;
  bikeName?: string;
}

export function CompatibilityBadge({
  status,
  bikeName,
}: CompatibilityBadgeProps) {
  if (status === "compatible") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-green-500 text-green-700"
      >
        <CheckCircle2 className="h-3 w-3" />
        Ταιριάζει{bikeName ? ` στη ${bikeName}` : ""}
      </Badge>
    );
  }

  if (status === "incompatible") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-yellow-500 text-yellow-700"
      >
        <XCircle className="h-3 w-3" />
        Δεν είναι συμβατό{bikeName ? ` με ${bikeName}` : ""}
      </Badge>
    );
  }

  return (
    <Link
      href="/garage"
      className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
    >
      <PlusCircle className="h-4 w-4" />
      Πρόσθεσε τη μηχανή σου για έλεγχο συμβατότητας
    </Link>
  );
}
