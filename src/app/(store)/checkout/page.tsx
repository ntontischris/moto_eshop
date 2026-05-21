"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useV3 } from "../_components/shell/v3-provider";
import { formatPrice } from "../_lib/format";
import { placeOrder, type CheckoutInput } from "./actions";

const FREE_OVER = 50;
const SHIP = 3.5;

const FIELDS: { name: keyof CheckoutInput; label: string; type?: string }[] = [
  { name: "fullName", label: "Ονοματεπώνυμο" },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Τηλέφωνο", type: "tel" },
  { name: "address", label: "Διεύθυνση" },
  { name: "city", label: "Πόλη" },
  { name: "postal", label: "Τ.Κ." },
  { name: "region", label: "Περιοχή / Νομός" },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useV3();
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping = cart.length === 0 || cartTotal >= FREE_OVER ? 0 : SHIP;
  const total = cartTotal + shipping;

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await placeOrder({
      email: form.email ?? "",
      phone: form.phone ?? "",
      fullName: form.fullName ?? "",
      address: form.address ?? "",
      city: form.city ?? "",
      postal: form.postal ?? "",
      region: form.region ?? "",
      notes: form.notes ?? "",
      payment: "cod",
      items: cart.map((line) => ({
        slug: line.slug,
        name: line.name,
        qty: line.qty,
        price: line.price,
      })),
    });
    if (res.ok && res.orderNumber) {
      clearCart();
      router.push(`/checkout/success?order=${res.orderNumber}`);
    } else {
      setError(res.error ?? "Κάτι πήγε στραβά. Δοκίμασε ξανά.");
      setBusy(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="v3-co v3-co-empty">
        <p className="v3-label">Checkout</p>
        <h1 className="v3-display">Ταμείο</h1>
        <p>Το καλάθι σου είναι άδειο.</p>
        <Link className="v3-btn-primary" href="/category/eksoplismos-anabath">
          Συνέχισε αγορές <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="v3-co v3-co--apple">
      <nav className="v3-co-bc" aria-label="Breadcrumb">
        <Link href="/">Αρχική</Link>
        <span aria-hidden="true">/</span>
        <Link href="/cart">Καλάθι</Link>
        <span aria-hidden="true">/</span>
        <span>Ταμείο</span>
      </nav>

      <header className="v3-co-title">
        <p className="v3-label">Secure checkout</p>
        <h1 className="v3-display">Ολοκλήρωση αγοράς</h1>
      </header>

      <form className="v3-co-grid" onSubmit={submit}>
        <div className="v3-co-form">
          <section className="v3-co-block">
            <div className="v3-co-block-head">
              <span>1</span>
              <div>
                <h2>Στοιχεία αποστολής</h2>
                <p>Συμπλήρωσε τα βασικά. Η παραγγελία καταχωρείται καθαρά.</p>
              </div>
            </div>
            <div className="v3-co-fields">
              {FIELDS.map((field) => (
                <label key={field.name} className="v3-co-field">
                  <span>{field.label}</span>
                  <input
                    type={field.type ?? "text"}
                    required
                    value={form[field.name] ?? ""}
                    onChange={(e) => set(field.name, e.target.value)}
                  />
                </label>
              ))}
              <label className="v3-co-field v3-co-full">
                <span>Σημειώσεις</span>
                <textarea
                  rows={3}
                  value={form.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder="Προαιρετικό"
                />
              </label>
            </div>
          </section>

          <section className="v3-co-block">
            <div className="v3-co-block-head">
              <span>2</span>
              <div>
                <h2>Πληρωμή</h2>
                <p>Για τώρα κρατάμε την πιο απλή ροή: πληρωμή στην παράδοση.</p>
              </div>
            </div>
            <div className="v3-co-pay">
              <label className="v3-co-pay-opt is-on">
                <input type="radio" name="pay" defaultChecked readOnly />
                <span>Αντικαταβολή, πληρωμή στην παράδοση</span>
              </label>
              <label className="v3-co-pay-opt is-off">
                <input type="radio" name="pay" disabled />
                <span>Κάρτα, σύντομα διαθέσιμη</span>
              </label>
            </div>
          </section>

          {error && <p className="v3-co-err">{error}</p>}
        </div>

        <aside className="v3-co-sum" aria-label="Σύνοψη παραγγελίας">
          <h2>Η παραγγελία σου</h2>
          <div className="v3-co-lines">
            {cart.map((line) => (
              <div key={line.slug + line.size} className="v3-co-line">
                <span>
                  {line.qty} × {line.name}
                  {line.size ? ` (${line.size})` : ""}
                </span>
                <span>{formatPrice(line.price * line.qty)}</span>
              </div>
            ))}
          </div>
          <div className="v3-co-total-box">
            <div className="v3-co-line">
              <span>Υποσύνολο</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="v3-co-line">
              <span>Αποστολή</span>
              <span>{shipping === 0 ? "Δωρεάν" : formatPrice(shipping)}</span>
            </div>
            <div className="v3-co-line v3-co-total">
              <span>Σύνολο</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <button
            type="submit"
            className="v3-btn-primary v3-co-place"
            disabled={busy}
          >
            {busy ? "Καταχώρηση..." : "Καταχώρηση παραγγελίας"}
          </button>
          <Link href="/cart" className="v3-co-back">
            Πίσω στο καλάθι
          </Link>
          <div className="v3-co-confidence">
            <span>Ασφαλής ροή</span>
            <span>Αλλαγές μεγέθους</span>
            <span>Τηλεφωνική υποστήριξη</span>
          </div>
        </aside>
      </form>
    </div>
  );
}
