"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod/v4";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { AuthErrorMessage } from "@/components/auth/auth-error-message";
import { SHIPPING_RATES, type ShippingMethodKey } from "@/lib/cart/utils";
import { placeOrder } from "@/lib/actions/checkout";

const checkoutSchema = z.object({
  email: z.email("Εισάγετε έγκυρο email"),
  firstName: z.string().min(1, "Απαιτείται όνομα"),
  lastName: z.string().min(1, "Απαιτείται επώνυμο"),
  phone: z.string().min(7, "Απαιτείται τηλέφωνο"),
  address: z.string().min(3, "Απαιτείται διεύθυνση"),
  city: z.string().min(2, "Απαιτείται πόλη"),
  postalCode: z.string().min(4, "Απαιτείται Τ.Κ."),
  country: z.string().default("GR"),
});

export default function CheckoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethodKey>("acs_standard");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const raw = {
      email: formData.get("email"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      city: formData.get("city"),
      postalCode: formData.get("postalCode"),
      country: "GR",
    };

    const parsed = checkoutSchema.safeParse(raw);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Σφάλμα επικύρωσης");
      return;
    }

    startTransition(async () => {
      const result = await placeOrder({
        ...parsed.data,
        shippingMethod,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push(`/checkout/confirmation/${result.data.orderId}`);
    });
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Ολοκλήρωση Παραγγελίας</h1>

      <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
        <AuthErrorMessage message={error} />

        {/* Contact */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-base font-semibold">Στοιχεία επικοινωνίας</h2>
            <Input
              name="email"
              type="email"
              placeholder="Email"
              required
              disabled={isPending}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="firstName"
                placeholder="Όνομα"
                required
                disabled={isPending}
              />
              <Input
                name="lastName"
                placeholder="Επώνυμο"
                required
                disabled={isPending}
              />
            </div>
            <Input
              name="phone"
              type="tel"
              placeholder="Τηλέφωνο"
              required
              disabled={isPending}
            />
          </CardContent>
        </Card>

        {/* Shipping Address */}
        <Card>
          <CardContent className="space-y-4 pt-6">
            <h2 className="text-base font-semibold">Διεύθυνση αποστολής</h2>
            <Input
              name="address"
              placeholder="Οδός, αριθμός"
              required
              disabled={isPending}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                name="city"
                placeholder="Πόλη"
                required
                disabled={isPending}
              />
              <Input
                name="postalCode"
                placeholder="Τ.Κ."
                required
                disabled={isPending}
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Method */}
        <Card>
          <CardContent className="space-y-3 pt-6">
            <h2 className="text-base font-semibold">Τρόπος αποστολής</h2>
            {(
              Object.entries(SHIPPING_RATES) as [
                ShippingMethodKey,
                { label: string; price: number },
              ][]
            ).map(([key, rate]) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                  shippingMethod === key
                    ? "border-foreground bg-accent"
                    : "border-border hover:border-foreground/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="shippingMethod"
                    value={key}
                    checked={shippingMethod === key}
                    onChange={() => setShippingMethod(key)}
                    className="accent-foreground"
                  />
                  <span className="text-sm font-medium">{rate.label}</span>
                </div>
                <span className="text-sm font-semibold">
                  {rate.price === 0
                    ? "Δωρεάν"
                    : `${rate.price.toFixed(2)} \u20AC`}
                </span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Payment placeholder */}
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-base font-semibold">Πληρωμή</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Η πληρωμή με κάρτα θα είναι διαθέσιμη σύντομα (Stripe — Plan 2A).
              Προς το παρόν η παραγγελία καταχωρείται ως αντικαταβολή.
            </p>
          </CardContent>
        </Card>

        <Button type="submit" size="lg" className="w-full" disabled={isPending}>
          {isPending ? "Υποβολή..." : "Υποβολή Παραγγελίας"}
        </Button>
      </form>
    </main>
  );
}
