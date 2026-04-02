import { CartProvider } from "./cart-context";
import { getCartId } from "./cookie";
import { getCartItemCount } from "@/lib/queries/cart";

export async function CartProviderServer({
  children,
}: {
  children: React.ReactNode;
}) {
  const cartId = await getCartId();
  const count = cartId ? await getCartItemCount(cartId) : 0;

  return <CartProvider initialCount={count}>{children}</CartProvider>;
}
