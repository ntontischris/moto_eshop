"use client";

import { useTransition } from "react";
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
    <div className="v3-garage-card">
      <div className="v3-garage-card-info">
        <div className="v3-garage-card-name">
          <span>
            {make} {model}
          </span>
          {isPrimary && <span className="v3-garage-badge">Κύρια</span>}
        </div>
        <span className="v3-garage-card-year">{year}</span>
      </div>

      <div className="v3-garage-card-actions">
        {!isPrimary && (
          <button
            type="button"
            className="v3-garage-icon"
            onClick={handleSetPrimary}
            disabled={isPending}
            title="Ορισμός ως κύρια"
          >
            <Star className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          className="v3-garage-icon v3-garage-icon-danger"
          onClick={handleRemove}
          disabled={isPending}
          title="Αφαίρεση"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
