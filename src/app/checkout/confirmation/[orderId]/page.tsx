import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

interface ConfirmationPageProps {
  params: Promise<{ orderId: string }>;
}

export const metadata = { title: "Επιβεβαίωση Παραγγελίας | MotoMarket" };

export default async function OrderConfirmationPage({
  params,
}: ConfirmationPageProps) {
  const { orderId } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, order_number, total, status, created_at, shipping_address")
    .eq("id", orderId)
    .single();

  if (!order) notFound();

  const address = order.shipping_address as {
    name: string;
    line1: string;
    city: string;
    postal_code: string;
  } | null;

  return (
    <main className="container mx-auto flex flex-col items-center px-4 py-16 text-center">
      <CheckCircle className="mb-4 h-16 w-16 text-green-500" />
      <h1 className="text-2xl font-bold">Η παραγγελία σας καταχωρήθηκε!</h1>
      <p className="mt-2 text-muted-foreground">
        Αριθμός παραγγελίας:{" "}
        <span className="font-mono font-semibold">{order.order_number}</span>
      </p>

      <Card className="mt-8 w-full max-w-md text-left">
        <CardContent className="space-y-3 pt-6">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Σύνολο</span>
            <span className="font-semibold">
              {new Intl.NumberFormat("el-GR", {
                style: "currency",
                currency: "EUR",
              }).format(order.total)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Κατάσταση</span>
            <span className="font-medium text-yellow-600">Σε αναμονή</span>
          </div>
          {address && (
            <div className="border-t pt-3 text-sm">
              <p className="font-medium">{address.name}</p>
              <p className="text-muted-foreground">{address.line1}</p>
              <p className="text-muted-foreground">
                {address.city}, {address.postal_code}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 flex gap-4">
        <Button render={<Link href="/account/orders" />} variant="outline">
          Οι παραγγελίες μου
        </Button>
        <Button render={<Link href="/" />}>Συνέχεια αγορών</Button>
      </div>
    </main>
  );
}
