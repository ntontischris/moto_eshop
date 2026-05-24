import Image from "next/image";
import { getMyBikeBrands } from "@/lib/queries/categories";
import { BikeSelector } from "./bike-selector";

export async function MyBikeEntry() {
  const brands = await getMyBikeBrands();
  if (brands.length === 0) return null;

  return (
    <section
      className="v3-mb v3-mb--reconstructed"
      id="my-bike"
      aria-label="Bike finder"
    >
      <div className="v3-mb-bg" aria-hidden="true">
        <Image
          src="/mega-menu/category-my-bike.webp"
          alt=""
          fill
          sizes="100vw"
        />
      </div>
      <div className="v3-mb-scrim" aria-hidden="true" />

      <div className="v3-mb-inner">
        <div className="v3-mb-copy">
          <p className="v3-label">Bike finder</p>
          <h2 className="v3-display">Αγόρασε γύρω από τη μηχανή σου.</h2>
          <p>
            Διάλεξε μάρκα & μοντέλο — σου δείχνουμε βαλίτσες, βάσεις, ζελατίνες,
            λιπαντικά και αξεσουάρ που ταιριάζουν ακριβώς στη δική σου.
          </p>
        </div>

        <BikeSelector brands={brands} />
      </div>
    </section>
  );
}
