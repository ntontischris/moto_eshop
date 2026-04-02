"use client";

import { useState, useTransition } from "react";
import { createPriceAlert } from "@/lib/actions/price-alerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bell } from "lucide-react";

interface PriceAlertFormProps {
  productId: string;
  currentPrice: number;
  prefillEmail?: string;
}

export function PriceAlertForm({
  productId,
  currentPrice,
  prefillEmail = "",
}: PriceAlertFormProps) {
  const [email, setEmail] = useState(prefillEmail);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createPriceAlert({
        productId,
        email,
        targetPrice: currentPrice,
      });
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error);
      }
    });
  }

  if (success) {
    return (
      <p className="text-sm text-green-600">
        Θα σε ειδοποιήσουμε αν πέσει η τιμή!
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Bell className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Input
        type="email"
        placeholder="Το email σου"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="h-8 flex-1 text-sm"
      />
      <Button type="submit" variant="outline" size="sm" disabled={isPending}>
        {isPending ? "..." : "Ειδοποίησέ με"}
      </Button>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </form>
  );
}
