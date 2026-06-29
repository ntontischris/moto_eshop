import "./checkout.css";
import { isCardPaymentEnabled } from "@/lib/payments";
import CheckoutClient from "./checkout-client";

// Server entry: the card option renders only when a payment provider is
// configured (key present). COD is always available. See ADR 0010.
export default function CheckoutPage() {
  return <CheckoutClient cardEnabled={isCardPaymentEnabled()} />;
}
