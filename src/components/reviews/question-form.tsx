"use client";

import { useState, useTransition } from "react";
import { createQuestion } from "@/lib/actions/reviews";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function QuestionForm({ productId }: { productId: string }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createQuestion({ productId, body });
      if (result.success) {
        setSuccess(true);
        setBody("");
      } else {
        setError(result.error);
      }
    });
  }

  if (success) {
    return <p className="text-sm text-green-600">Η ερώτησή σου υποβλήθηκε!</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Η ερώτησή σου για αυτό το προϊόν..."
        rows={3}
        required
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Υποβολή..." : "Υποβολή Ερώτησης"}
      </Button>
    </form>
  );
}
