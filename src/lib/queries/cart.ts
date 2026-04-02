import { createClient } from "@/lib/supabase/server";

interface ProductImage {
  url: string;
  alt: string;
  position: number;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  size: string | null;
  color: string | null;
  product_name: string;
  product_slug: string;
  product_image_url: string;
  product_image_alt: string;
  product_stock: number;
  category_slug: string;
}

export interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const supabase = await createClient();

  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id, user_id, session_id, created_at, updated_at")
    .eq("id", cartId)
    .single();

  if (cartError || !cart) return null;

  const { data: items, error: itemsError } = await supabase
    .from("cart_items")
    .select(
      `
      id, cart_id, product_id, quantity, unit_price, size, color,
      products ( name, slug, stock, images, categories ( slug ) )
    `,
    )
    .eq("cart_id", cartId);

  if (itemsError) return null;

  const cartItems: CartItem[] = (items ?? []).map((item) => {
    const product = item.products as unknown as {
      name: string;
      slug: string;
      stock: number;
      images: ProductImage[];
      categories: { slug: string } | null;
    };
    const sortedImages = [...(product.images ?? [])].sort(
      (a, b) => a.position - b.position,
    );
    const primaryImage = sortedImages[0];

    return {
      id: item.id,
      cart_id: item.cart_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      size: item.size,
      color: item.color,
      product_name: product.name,
      product_slug: product.slug,
      product_image_url:
        primaryImage?.url ?? "/images/placeholder-product.webp",
      product_image_alt: primaryImage?.alt ?? product.name,
      product_stock: product.stock,
      category_slug: product.categories?.slug ?? "",
    };
  });

  return { ...cart, items: cartItems };
}

export async function getCartByUserId(userId: string): Promise<Cart | null> {
  const supabase = await createClient();

  const { data: cart } = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!cart) return null;
  return getCart(cart.id);
}

export async function getCartItemCount(cartId: string): Promise<number> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("cart_id", cartId);

  if (!data) return 0;
  return data.reduce((sum, item) => sum + item.quantity, 0);
}
