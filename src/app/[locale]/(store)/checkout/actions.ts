"use server";

import { z } from "zod/v4";
import { createAdminClient } from "@/lib/supabase/admin";
import { priceOrder } from "@/lib/checkout/pricing";
import { getPaymentProvider } from "@/lib/payments";
import type { CheckoutLineSnapshot } from "@/lib/payments";
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
  payment: "cod" | "card";
  /** Locale for building the provider return URLs (card only). */
  locale?: string;
  items: CheckoutItem[];
}

export interface PlaceOrderResult {
  ok: boolean;
  /** COD: the created order number. */
  orderNumber?: string;
  /** Card: the provider-hosted page to redirect the customer to. */
  redirectUrl?: string;
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
  locale: z.string().trim().default("el"),
  payment: z.enum(["cod", "card"], {
    error: "Μη διαθέσιμος τρόπος πληρωμής.",
  }),
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

  const addressJson = {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    postal: data.postal,
    region: data.region,
    notes: data.notes,
    payment: data.payment,
  } as unknown as Json;

  // Map server-priced lines back to display names for the snapshot. Names come
  // from the raw input (the validated `data` carries only slug + qty).
  const nameBySlug = new Map(input.items.map((i) => [i.slug, i.name]));

  // Card: never create an order here. Snapshot a Checkout session, redirect to
  // the provider-hosted page, and let the verified webhook create the order
  // once payment is confirmed (ADR 0015).
  if (data.payment === "card") {
    return createCardCheckout(supabase, priced, addressJson, {
      email: data.email,
      locale: data.locale ?? "el",
      nameBySlug,
    });
  }

  // COD: create the order immediately, marked payment_status 'cod'.
  const orderNumber = `MM-${Date.now().toString(36).toUpperCase()}`;
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
      payment_status: "cod",
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

type PricedOrder = Extract<ReturnType<typeof priceOrder>, { ok: true }>;

/** EUR euros -> minor units (cents), rounded per value to avoid drift. */
const toCents = (euros: number) => Math.round(euros * 100);

async function createCardCheckout(
  supabase: ReturnType<typeof createAdminClient>,
  priced: PricedOrder,
  contact: Json,
  opts: { email: string; locale: string; nameBySlug: Map<string, string> },
): Promise<PlaceOrderResult> {
  const lines: CheckoutLineSnapshot[] = priced.lines.map((l) => ({
    productId: l.productId,
    slug: l.slug,
    name: opts.nameBySlug.get(l.slug) ?? l.slug,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    lineTotal: l.lineTotal,
  }));

  // Amount Stripe will charge: sum of line cents + shipping cents. Computed the
  // same way the adapter builds its line items, so the totals match exactly.
  const shippingCents = toCents(priced.shipping);
  const amountTotal =
    lines.reduce((sum, l) => sum + toCents(l.unitPrice) * l.quantity, 0) +
    shippingCents;

  const { data: session, error: sessionErr } = await supabase
    .from("checkout_sessions")
    .insert({
      provider: "stripe",
      status: "pending",
      line_items: lines as unknown as Json,
      subtotal: priced.subtotal,
      shipping_cost: priced.shipping,
      total: priced.total,
      amount_total: amountTotal,
      currency: "eur",
      contact,
    })
    .select("id")
    .single();

  if (sessionErr || !session) {
    return { ok: false, error: "Αποτυχία έναρξης πληρωμής." };
  }

  const base = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
  const provider = getPaymentProvider();

  let result;
  try {
    result = await provider.createCheckoutSession({
      checkoutSessionId: session.id,
      amountTotal,
      shippingAmount: shippingCents,
      currency: "eur",
      customerEmail: opts.email,
      lines,
      successUrl: `${base}/${opts.locale}/checkout/success?cs=${session.id}`,
      cancelUrl: `${base}/${opts.locale}/checkout?canceled=1`,
    });
  } catch {
    return { ok: false, error: "Αποτυχία σύνδεσης με την υπηρεσία πληρωμών." };
  }

  await supabase
    .from("checkout_sessions")
    .update({ provider_session_id: result.providerSessionId })
    .eq("id", session.id);

  return { ok: true, redirectUrl: result.redirectUrl };
}
