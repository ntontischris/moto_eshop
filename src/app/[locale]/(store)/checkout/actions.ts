"use server";

import { z } from "zod/v4";
import { createAdminClient } from "@/lib/supabase/admin";
import { priceOrder } from "@/lib/checkout/pricing";
import type { Json } from "@/types/database";

export interface CheckoutItem {
  slug: string;
  name: string;
  qty: number;
  price: number; // display-only; the server re-prices from the products table
}

export interface CheckoutInput {
  email: string;
  phone: string;
  fullName: string;
  address: string;
  city: string;
  postal: string;
  region: string;
  notes: string;
  payment: "cod"; // card (Viva) added later
  items: CheckoutItem[];
}

export interface PlaceOrderResult {
  ok: boolean;
  orderNumber?: string;
  error?: string;
}

const CheckoutSchema = z.object({
  email: z.email("Μη έγκυρο email."),
  phone: z.string().trim().min(1, "Συμπλήρωσε τηλέφωνο."),
  fullName: z.string().trim().min(1, "Συμπλήρωσε ονοματεπώνυμο."),
  address: z.string().trim().min(1, "Συμπλήρωσε διεύθυνση."),
  city: z.string().trim().min(1, "Συμπλήρωσε πόλη."),
  postal: z
    .string()
    .trim()
    .regex(/^\d{5}$/, "Μη έγκυρος Τ.Κ. (5 ψηφία)."),
  region: z.string().trim().default(""),
  notes: z.string().trim().default(""),
  payment: z.literal("cod", { error: "Μη διαθέσιμος τρόπος πληρωμής." }),
  items: z
    .array(z.object({ slug: z.string().min(1), qty: z.number().int().min(1) }))
    .min(1, "Το καλάθι είναι άδειο."),
});

export async function placeOrder(
  input: CheckoutInput,
): Promise<PlaceOrderResult> {
  const parsed = CheckoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Σφάλμα επικύρωσης.",
    };
  }
  const data = parsed.data;

  // Admin client: guest (COD) orders are inserted without an auth session, so
  // RLS is intentionally bypassed here. Amounts are derived server-side via
  // priceOrder (below), so the client cannot tamper with them. See ADR 0001.
  const supabase = createAdminClient();

  const slugs = data.items.map((i) => i.slug);
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, slug, price, stock, status")
    .in("slug", slugs);

  if (prodErr) {
    return { ok: false, error: "Αποτυχία επαλήθευσης προϊόντων." };
  }

  const priced = priceOrder(
    data.items.map((i) => ({ slug: i.slug, qty: i.qty })),
    products ?? [],
  );
  if (!priced.ok) {
    return { ok: false, error: priced.error };
  }

  const orderNumber = `MM-${Date.now().toString(36).toUpperCase()}`;
  const addressJson = {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    postal: data.postal,
    region: data.region,
    notes: data.notes,
    payment: "cod",
  } as unknown as Json;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      billing_address: addressJson,
      shipping_address: addressJson,
      subtotal: priced.subtotal,
      shipping_cost: priced.shipping,
      total: priced.total,
      discount: 0,
      user_id: null,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return { ok: false, error: "Αποτυχία καταχώρησης παραγγελίας." };
  }

  const rows = priced.lines.map((l) => ({
    order_id: order.id,
    product_id: l.productId,
    quantity: l.quantity,
    unit_price: l.unitPrice,
    total: l.lineTotal,
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(rows);
  if (itemsErr) {
    return {
      ok: false,
      error: "Η παραγγελία καταχωρήθηκε μερικώς. Επικοινώνησε μαζί μας.",
    };
  }

  return { ok: true, orderNumber };
}
