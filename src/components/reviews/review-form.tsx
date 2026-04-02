"use client";

import { useState, useTransition } from "react";
import { createReview } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ReviewFormProps {
  productId: string;
  isLoggedIn: boolean;
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Βαθμολογία">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} αστέρια`}
          className="text-2xl text-yellow-400 transition-transform hover:scale-110"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
        >
          {star <= (hovered || value) ? "★" : "☆"}
        </button>
      ))}
    </div>
  );
}

export function ReviewForm({ productId, isLoggedIn }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-muted-foreground">
        <a href="/login" className="underline">
          Συνδέσου
        </a>{" "}
        για να αφήσεις κριτική.
      </p>
    );
  }

  if (success) {
    return (
      <p className="text-sm text-green-600">
        Η κριτική σου υποβλήθηκε για έγκριση!
      </p>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createReview({
        productId,
        rating,
        title: fd.get("title") as string,
        body: fd.get("body") as string,
        bikeMake: (fd.get("bikeMake") as string) || undefined,
        bikeModel: (fd.get("bikeModel") as string) || undefined,
        riderHeight: fd.get("riderHeight")
          ? Number(fd.get("riderHeight"))
          : undefined,
        riderWeight: fd.get("riderWeight")
          ? Number(fd.get("riderWeight"))
          : undefined,
        ridingExperience:
          (fd.get("ridingExperience") as
            | "beginner"
            | "intermediate"
            | "expert") || undefined,
      });

      if (result.success) {
        setSuccess(true);
      } else {
        setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Βαθμολογία *</label>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <Input name="title" placeholder="Τίτλος κριτικής *" required />
      <Textarea name="body" placeholder="Η κριτική σου *" rows={4} required />
      <div className="grid grid-cols-2 gap-3">
        <Input name="bikeMake" placeholder="Μάρκα μοτοσυκλέτας" />
        <Input name="bikeModel" placeholder="Μοντέλο μοτοσυκλέτας" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input name="riderHeight" type="number" placeholder="Ύψος (cm)" />
        <Input name="riderWeight" type="number" placeholder="Βάρος (kg)" />
      </div>
      <select
        name="ridingExperience"
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Εμπειρία οδήγησης</option>
        <option value="beginner">Αρχάριος</option>
        <option value="intermediate">Ενδιάμεσος</option>
        <option value="expert">Έμπειρος</option>
      </select>
      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <Button type="submit" disabled={isPending || rating === 0}>
        {isPending ? "Υποβολή..." : "Υποβολή Κριτικής"}
      </Button>
    </form>
  );
}
