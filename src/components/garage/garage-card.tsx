"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { removeBike, setPrimaryBike } from "@/lib/actions/garage";
import { toast } from "sonner";
import { Star, Trash2 } from "lucide-react";

interface GarageCardProps {
  userBikeId: string;
  make: string;
  model: string;
  year: number;
  isPrimary: boolean;
}

export function GarageCard({
  userBikeId,
  make,
  model,
  year,
  isPrimary,
}: GarageCardProps) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = () => {
    startTransition(async () => {
      const result = await removeBike({ userBikeId });
      if (!result.success) toast.error(result.error);
      else toast.success("Η μηχανή αφαιρέθηκε");
    });
  };

  const handleSetPrimary = () => {
    startTransition(async () => {
      const result = await setPrimaryBike({ userBikeId });
      if (!result.success) toast.error(result.error);
      else toast.success("Κύρια μηχανή ορίστηκε");
    });
  };

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            {make} {model}
          </span>
          {isPrimary && <Badge variant="secondary">Κύρια</Badge>}
        </div>
        <span className="text-sm text-muted-foreground">{year}</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {!isPrimary && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSetPrimary}
            disabled={isPending}
            title="Ορισμός ως κύρια"
          >
            <Star className="h-4 w-4" />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={isPending}
          title="Αφαίρεση"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
