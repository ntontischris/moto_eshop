import { cn } from "@/lib/utils";
import { Shield } from "lucide-react";

interface CertificationBadgeProps {
  certification?: string | null;
  ceLevel?: string | null;
  className?: string;
}

export const CertificationBadge = ({
  certification,
  ceLevel,
  className,
}: CertificationBadgeProps) => {
  if (!certification && !ceLevel) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md",
        className,
      )}
    >
      <Shield className="h-3.5 w-3.5" />
      {certification && <span>{certification}</span>}
      {ceLevel && <span>CE {ceLevel}</span>}
    </div>
  );
};
