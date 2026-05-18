"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export interface CheckoutItem {
  slug: string;
  name: string;
  qty: number;
  price: number;
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

const SHIPPING_FREE_OVER = 50;
const SHIPPING_COST = 3.5;

function valid(i: CheckoutInput): string | null {
  if (!i.items?.length) return "Το καλάθι είναι άδειο.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(i.email)) return "Μη έγκυρο email.";
  if (!i.fullName.trim()) return "Συμπλήρωσε ονοματεπώνυμο.";
  if (!i.phone.trim()) return "Συμπλήρωσε τηλέφωνο.";
  if (!i.address.trim()) return "Συμπλήρωσε διεύθυνση.";
  if (!i.city.trim()) return "Συμπλήρωσε πόλη.";
  if (!/^\d{5}$/.test(i.postal.trim())) return "Μη έγκυρος Τ.Κ. (5 ψηφία).";
  if (i.payment !== "cod") return "Μη διαθέσιμος τρόπος πληρωμής.";
  return null;
}

export async function placeOrder(
  input: CheckoutInput,
): Promise<PlaceOrderResult> {
  const err = valid(input);
  if (err) return { ok: false, error: err };

  const supabase = createAdminClient();

  const subtotal = input.items.reduce((s, it) => s + it.price * it.qty, 0);
  const shipping = subtotal >= SHIPPING_FREE_OVER ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const orderNumber = `MM-${Date.now().toString(36).toUpperCase()}`;

  const addressJson = {
    fullName: input.fullName,
    email: input.email,
    phone: input.phone,
    address: input.address,
    city: input.city,
    postal: input.postal,
    region: input.region,
    notes: input.notes,
    payment: "cod",
  } as unknown as Json;

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      billing_address: addressJson,
      shipping_address: addressJson,
      subtotal,
      shipping_cost: shipping,
      total,
      discount: 0,
      user_id: null,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    return { ok: false, error: "Αποτυχία καταχώρησης παραγγελίας." };
  }

  // Resolve product ids by slug (best-effort; nullable in schema)
  const slugs = input.items.map((i) => i.slug);
  const { data: prods } = await supabase
    .from("products")
    .select("id, slug")
    .in("slug", slugs);
  const idBySlug = new Map((prods ?? []).map((p) => [p.slug, p.id as string]));

  const rows = input.items.map((it) => ({
    order_id: order.id,
    product_id: idBySlug.get(it.slug) ?? null,
    quantity: it.qty,
    unit_price: it.price,
    total: it.price * it.qty,
  }));

  const { error: itemsErr } = await supabase.from("order_items").insert(rows);

  if (itemsErr) {
    // Order exists but items failed — surface so it can be reconciled.
    return {
      ok: false,
      error: "Η παραγγελία καταχωρήθηκε μερικώς. Επικοινώνησε μαζί μας.",
    };
  }

  return { ok: true, orderNumber };
}
