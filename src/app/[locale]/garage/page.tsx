import "../(store)/_styles/tokens.css";
import "./garage.css";
import { Suspense } from "react";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
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

export default function GaragePage() {
  return (
    <Suspense fallback={<GarageFallback />}>
      <GarageContent />
    </Suspense>
  );
}

async function GarageContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    const locale = await getLocale();
    return redirect({ href: "/login?next=/garage", locale });
  }

  const [makes, userBikes] = await Promise.all([
    getBikeMakes(),
    getUserBikes(user.id),
  ]);

  return (
    <div className="v3-root" data-v3>
      <main className="v3-garage">
        <div className="v3-garage-head">
          <h1>Το Γκαράζ μου</h1>
          <p>Πρόσθεσε τις μηχανές σου για να βλέπεις συμβατά εξαρτήματα.</p>
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
          <section className="v3-garage-list">
            <h2>Οι μηχανές μου</h2>
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
          <p className="v3-garage-empty">Δεν έχεις προσθέσει μηχανές ακόμα.</p>
        )}

        {/* S-4.1 add/remove bikes mounts here — inert reserved slot, no data wiring */}
        <section
          className="v3-garage-slot"
          data-garage-bike-slot
          data-reserved-feature="S-4.1"
          aria-hidden="true"
          hidden
        />
      </main>
    </div>
  );
}

function GarageFallback() {
  return (
    <div className="v3-root" data-v3>
      <main className="v3-garage" aria-hidden="true">
        <div className="v3-garage-head">
          <div className="v3-garage-skel" style={{ height: 40, width: 220 }} />
          <div
            className="v3-garage-skel"
            style={{ height: 16, width: "100%", maxWidth: 420, marginTop: 12 }}
          />
        </div>
        <div className="v3-garage-skel" style={{ height: 220 }} />
      </main>
    </div>
  );
}
