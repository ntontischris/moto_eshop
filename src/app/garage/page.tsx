import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getBikeMakes,
  getBikeModels,
  getBikeYears,
  getBikeId,
  getUserBikes,
} from "@/lib/queries/bikes";
import { BikeSelector } from "@/components/garage/bike-selector";
import { GarageCard } from "@/components/garage/garage-card";

export const metadata = { title: "Το Γκαράζ μου | MotoMarket" };

export default async function GaragePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/garage");

  const [makes, userBikes] = await Promise.all([
    getBikeMakes(),
    getUserBikes(user.id),
  ]);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 space-y-10">
      <div>
        <h1 className="text-3xl font-bold">Το Γκαράζ μου</h1>
        <p className="mt-1 text-muted-foreground">
          Πρόσθεσε τις μηχανές σου για να βλέπεις συμβατά εξαρτήματα.
        </p>
      </div>

      <BikeSelector
        makes={makes}
        getModels={async (make) => {
          "use server";
          return getBikeModels(make);
        }}
        getYears={async (make, model) => {
          "use server";
          return getBikeYears(make, model);
        }}
        getBikeId={async (make, model, year) => {
          "use server";
          return getBikeId(make, model, year);
        }}
      />

      {userBikes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Οι μηχανές μου</h2>
          {userBikes.map((ub) => (
            <GarageCard
              key={ub.id}
              userBikeId={ub.id}
              make={ub.bike.make}
              model={ub.bike.model}
              year={ub.bike.year}
              isPrimary={ub.is_primary}
            />
          ))}
        </section>
      )}

      {userBikes.length === 0 && (
        <p className="py-8 text-center text-muted-foreground">
          Δεν έχεις προσθέσει μηχανές ακόμα.
        </p>
      )}
    </main>
  );
}
