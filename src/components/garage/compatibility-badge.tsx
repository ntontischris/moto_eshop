import Link from "next/link";
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
      <span className="v3-compat v3-compat-ok">
        <CheckCircle2 className="h-3 w-3" />
        Ταιριάζει{bikeName ? ` στη ${bikeName}` : ""}
      </span>
    );
  }

  if (status === "incompatible") {
    return (
      <span className="v3-compat v3-compat-no">
        <XCircle className="h-3 w-3" />
        Δεν είναι συμβατό{bikeName ? ` με ${bikeName}` : ""}
      </span>
    );
  }

  return (
    <Link href="/garage" className="v3-compat-link">
      <PlusCircle className="h-4 w-4" />
      Πρόσθεσε τη μηχανή σου για έλεγχο συμβατότητας
    </Link>
  );
}
