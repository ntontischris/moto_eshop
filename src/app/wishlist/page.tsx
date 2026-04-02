import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUserWishlist } from "@/lib/queries/wishlist";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/ui/price-display";
import { WishlistButton } from "@/components/wishlist/wishlist-button";

export const metadata = { title: "Αγαπημένα | MotoMarket" };

export default async function WishlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/wishlist");

  const items = await getUserWishlist(user.id);

  if (items.length === 0) {
    return (
      <main className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
        <Heart className="mb-4 h-16 w-16 text-muted-foreground/30" />
        <h1 className="text-2xl font-bold">Δεν έχεις αγαπημένα ακόμα</h1>
        <p className="mt-2 text-muted-foreground">
          Πρόσθεσε προϊόντα στα αγαπημένα σου πατώντας το εικονίδιο καρδιάς.
        </p>
        <Button render={<Link href="/" />} className="mt-6">
          Ξεκίνα τις αγορές
        </Button>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Αγαπημένα ({items.length})</h1>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="group relative flex flex-col rounded-lg border bg-card transition-shadow hover:shadow-md"
          >
            <Link
              href={`/${item.product.category_slug}/${item.product.slug}`}
              className="relative aspect-square overflow-hidden rounded-t-lg"
            >
              <Image
                src={item.product.primary_image_url}
                alt={item.product.primary_image_alt}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
              {item.product.stock <= 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-gray-900">
                    Εξαντλημένο
                  </span>
                </div>
              )}
            </Link>
            <WishlistButton
              productId={item.product_id}
              initialWishlisted={true}
              isLoggedIn={true}
              className="absolute right-2 top-2 bg-white/80 backdrop-blur-sm"
            />
            <div className="flex flex-1 flex-col gap-1.5 p-3">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {item.product.brand}
              </span>
              <Link
                href={`/${item.product.category_slug}/${item.product.slug}`}
                className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
              >
                {item.product.name}
              </Link>
              <div className="mt-auto pt-2">
                <PriceDisplay
                  price={item.product.price}
                  compareAtPrice={item.product.compare_at_price}
                  size="sm"
                />
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
