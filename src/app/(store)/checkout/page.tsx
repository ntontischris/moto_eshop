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
      items: cart.map((l) => ({
        slug: l.slug,
        name: l.name,
        qty: l.qty,
        price: l.price,
      })),
    });
    if (res.ok && res.orderNumber) {
      clearCart();
      router.push(`/checkout/success?order=${res.orderNumber}`);
    } else {
      setError(res.error ?? "Κάτι πήγε στραβά.");
      setBusy(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="v3-co v3-co-empty">
        <h1 className="v3-display">Ταμείο</h1>
        <p>Το καλάθι σου είναι άδειο.</p>
        <Link className="v3-btn-primary" href="/category/eksoplismos-anabath">
          Συνέχισε τα ψώνια <span aria-hidden="true">→</span>
        </Link>
        <CheckoutStyles />
      </div>
    );
  }

  return (
    <div className="v3-co">
      <nav className="v3-co-bc" aria-label="Breadcrumb">
        <Link href="/">Αρχική</Link>
        <span aria-hidden="true">/</span>
        <Link href="/cart">Καλάθι</Link>
        <span aria-hidden="true">/</span>
        <span>Ταμείο</span>
      </nav>
      <h1 className="v3-display">
        Ταμείο<span className="v3-co-dot">.</span>
      </h1>

      <form className="v3-co-grid" onSubmit={submit}>
        <div className="v3-co-form">
          <h2 className="v3-display">Στοιχεία &amp; αποστολή</h2>
          <div className="v3-co-fields">
            {FIELDS.map((f) => (
              <label key={f.name} className="v3-co-field">
                <span>{f.label}</span>
                <input
                  type={f.type ?? "text"}
                  required
                  value={form[f.name] ?? ""}
                  onChange={(e) => set(f.name, e.target.value)}
                />
              </label>
            ))}
            <label className="v3-co-field v3-co-full">
              <span>Σημειώσεις (προαιρετικό)</span>
              <textarea
                rows={3}
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
              />
            </label>
          </div>

          <h2 className="v3-display">Πληρωμή</h2>
          <div className="v3-co-pay">
            <label className="v3-co-pay-opt is-on">
              <input type="radio" name="pay" defaultChecked readOnly />
              <span>Αντικαταβολή — πληρωμή στην παράδοση</span>
            </label>
            <label className="v3-co-pay-opt is-off">
              <input type="radio" name="pay" disabled />
              <span>Κάρτα (Viva) — σύντομα</span>
            </label>
          </div>

          {error && <p className="v3-co-err">{error}</p>}
        </div>

        <aside className="v3-co-sum" aria-label="Σύνοψη">
          <h2 className="v3-display">Παραγγελία</h2>
          {cart.map((l) => (
            <div key={l.slug + l.size} className="v3-co-line">
              <span>
                {l.qty}× {l.name}
                {l.size ? ` (${l.size})` : ""}
              </span>
              <span>{formatPrice(l.price * l.qty)}</span>
            </div>
          ))}
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
          <button
            type="submit"
            className="v3-btn-primary v3-co-place"
            disabled={busy}
          >
            {busy ? "Καταχώρηση…" : "Καταχώρηση παραγγελίας"}
          </button>
          <Link href="/cart" className="v3-co-back">
            ← Πίσω στο καλάθι
          </Link>
        </aside>
      </form>
      <CheckoutStyles />
    </div>
  );
}

function CheckoutStyles() {
  return (
    <style precedence="default">{`
      .v3-co { max-width: 1180px; margin: 0 auto;
        padding: 28px var(--v3-gutter) 90px; }
      .v3-co-empty { display: flex; flex-direction: column;
        align-items: flex-start; gap: 18px; color: var(--v3-bone-dim); }
      .v3-co-empty .v3-btn-primary { text-decoration: none; }
      .v3-co-bc { display: flex; gap: 8px; font-size: .82rem;
        color: var(--v3-bone-dim); margin-bottom: 18px; }
      .v3-co-bc a { color: var(--v3-bone-dim); text-decoration: none; }
      .v3-co-bc a:hover { color: var(--v3-bone); }
      .v3-co h1 { margin: 0 0 28px; font-size: clamp(2rem,5vw,3.4rem);
        font-weight: 900; text-transform: uppercase; transform: skewX(-6deg);
        color: var(--v3-bone); }
      .v3-co-dot { color: var(--v3-red); }
      .v3-co-grid { display: grid; grid-template-columns: 1fr 360px;
        gap: 40px; align-items: start; }
      .v3-co-form h2 { font-size: 1.05rem; font-weight: 800;
        text-transform: uppercase; color: var(--v3-bone);
        margin: 0 0 16px; }
      .v3-co-form h2:nth-of-type(2) { margin-top: 32px; }
      .v3-co-fields { display: grid; grid-template-columns: 1fr 1fr;
        gap: 14px; }
      .v3-co-field { display: flex; flex-direction: column; gap: 6px; }
      .v3-co-full { grid-column: 1 / -1; }
      .v3-co-field span { font-size: .8rem; color: var(--v3-bone-dim);
        font-weight: 600; }
      .v3-co-field input, .v3-co-field textarea {
        background: var(--v3-surface); border: 1px solid var(--v3-line);
        border-radius: 8px; padding: 12px; color: var(--v3-bone);
        font-family: var(--v3-font); font-size: .92rem; }
      .v3-co-field input:focus, .v3-co-field textarea:focus {
        outline: 2px solid var(--v3-cyan); outline-offset: 1px; }
      .v3-co-pay { display: flex; flex-direction: column; gap: 10px; }
      .v3-co-pay-opt { display: flex; align-items: center; gap: 10px;
        padding: 14px; border: 1px solid var(--v3-line); border-radius: 8px;
        color: var(--v3-bone); font-size: .9rem; cursor: pointer; }
      .v3-co-pay-opt.is-on { border-color: var(--v3-red); }
      .v3-co-pay-opt.is-off { opacity: .5; cursor: not-allowed; }
      .v3-co-err { margin-top: 16px; color: #fff;
        background: var(--v3-red); padding: 12px 14px; border-radius: 8px;
        font-size: .88rem; }
      .v3-co-sum { background: var(--v3-surface);
        border: 1px solid var(--v3-line); padding: 24px; position: sticky;
        top: 96px; clip-path: polygon(0 0,100% 0,100% calc(100% - 16px),
          calc(100% - 16px) 100%,0 100%); }
      .v3-co-sum h2 { margin: 0 0 16px; font-size: 1.2rem; font-weight: 900;
        text-transform: uppercase; color: var(--v3-bone); }
      .v3-co-line { display: flex; justify-content: space-between;
        gap: 12px; padding: 7px 0; font-size: .88rem;
        color: var(--v3-bone-dim); }
      .v3-co-total { border-top: 1px solid var(--v3-line); margin-top: 8px;
        padding-top: 13px; color: var(--v3-bone); font-weight: 900;
        font-size: 1.1rem; }
      .v3-co-place { display: flex; justify-content: center; width: 100%;
        margin: 18px 0 12px; }
      .v3-co-place:disabled { opacity: .6; cursor: progress; }
      .v3-co-back { display: block; text-align: center;
        color: var(--v3-bone-dim); text-decoration: none; font-size: .85rem; }
      .v3-co-back:hover { color: var(--v3-bone); }
      @media (max-width: 900px) {
        .v3-co-grid { grid-template-columns: 1fr; gap: 28px; }
        .v3-co-sum { position: static; }
      }
      @media (max-width: 520px) {
        .v3-co-fields { grid-template-columns: 1fr; }
      }
    `}</style>
  );
}
