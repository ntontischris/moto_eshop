"use client";

import "./checkout.css";
import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useV3 } from "../_components/shell/v3-provider";
import { formatPrice } from "../_lib/format";
import { placeOrder, type CheckoutInput } from "./actions";
import {
  FREE_SHIPPING_THRESHOLD,
  DEFAULT_SHIPPING_ESTIMATE,
} from "@/lib/cart/utils";

const FIELD_NAMES: {
  name: keyof CheckoutInput;
  tKey: string;
  type?: string;
}[] = [
  { name: "fullName", tKey: "fieldFullName" },
  { name: "email", tKey: "email", type: "email" },
  { name: "phone", tKey: "fieldPhone", type: "tel" },
  { name: "address", tKey: "fieldAddress" },
  { name: "city", tKey: "fieldCity" },
  { name: "postal", tKey: "fieldPostal" },
  { name: "region", tKey: "fieldRegion" },
];

export default function CheckoutPage() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useV3();
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shipping =
    cart.length === 0 || cartTotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : DEFAULT_SHIPPING_ESTIMATE;
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
      setError(res.error ?? t("genericError"));
      setBusy(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="v3-co v3-co-empty">
        <p className="v3-label">Checkout</p>
        <h1 className="v3-display">{t("emptyHeading")}</h1>
        <p>{t("emptyText")}</p>
        <Link className="v3-btn-primary" href="/category/eksoplismos-anabath">
          {t("backToCart")} <span aria-hidden="true">→</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="v3-co v3-co--apple">
      <nav className="v3-co-bc" aria-label="Breadcrumb">
        <Link href="/">{t("homeLabel")}</Link>
        <span aria-hidden="true">/</span>
        <Link href="/cart">{t("cartLabel")}</Link>
        <span aria-hidden="true">/</span>
        <span>{t("checkoutLabel")}</span>
      </nav>

      <header className="v3-co-title">
        <p className="v3-label">Secure checkout</p>
        <h1 className="v3-display">{t("heading")}</h1>
      </header>

      <form className="v3-co-grid" onSubmit={submit}>
        <div className="v3-co-form">
          <section className="v3-co-block">
            <div className="v3-co-block-head">
              <span>1</span>
              <div>
                <h2>{t("shippingSection")}</h2>
                <p>{t("shippingNote")}</p>
              </div>
            </div>
            <div className="v3-co-fields">
              {FIELD_NAMES.map((field) => (
                <label key={field.name} className="v3-co-field">
                  <span>
                    {field.tKey === "email"
                      ? "Email"
                      : t(field.tKey as Parameters<typeof t>[0])}
                  </span>
                  <input
                    type={field.type ?? "text"}
                    required
                    value={form[field.name] ?? ""}
                    onChange={(e) => set(field.name, e.target.value)}
                  />
                </label>
              ))}
              <label className="v3-co-field v3-co-full">
                <span>{t("fieldNotes")}</span>
                <textarea
                  rows={3}
                  value={form.notes ?? ""}
                  onChange={(e) => set("notes", e.target.value)}
                  placeholder={t("notesPlaceholder")}
                />
              </label>
            </div>
          </section>

          <section className="v3-co-block">
            <div className="v3-co-block-head">
              <span>2</span>
              <div>
                <h2>{t("paymentSection")}</h2>
                <p>{t("paymentNote")}</p>
              </div>
            </div>
            <div className="v3-co-pay">
              <label className="v3-co-pay-opt is-on">
                <input type="radio" name="pay" defaultChecked readOnly />
                <span>{t("codLabel")}</span>
              </label>
              <label className="v3-co-pay-opt is-off">
                <input type="radio" name="pay" disabled />
                <span>{t("cardLabel")}</span>
              </label>
            </div>
          </section>

          {error && <p className="v3-co-err">{error}</p>}
        </div>

        <aside className="v3-co-sum" aria-label={t("orderSummaryLabel")}>
          <h2>{t("yourOrder")}</h2>
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
              <span>{t("subtotal")}</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>
            <div className="v3-co-line">
              <span>{t("shipping")}</span>
              <span>{shipping === 0 ? t("free") : formatPrice(shipping)}</span>
            </div>
            <div className="v3-co-line v3-co-total">
              <span>{t("total")}</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <button
            type="submit"
            className="v3-btn-primary v3-co-place"
            disabled={busy}
          >
            {busy ? t("placing") : t("placeOrder")}
          </button>
          <Link href="/cart" className="v3-co-back">
            {t("backToCart")}
          </Link>
          <div className="v3-co-confidence">
            <span>{t("trustSecure")}</span>
            <span>{t("trustSize")}</span>
            <span>{t("trustPhone")}</span>
          </div>
        </aside>
      </form>
    </div>
  );
}
