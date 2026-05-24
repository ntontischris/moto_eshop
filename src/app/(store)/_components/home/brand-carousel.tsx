/* eslint-disable @next/next/no-img-element -- decorative static brand logos in a marquee; plain <img> avoids per-logo intrinsic-size plumbing and is lighter than 32 optimizer entries */

type Brand = { name: string; slug: string };

const BRANDS: Brand[] = [
  { name: "AGV", slug: "agv" },
  { name: "Shoei", slug: "shoei" },
  { name: "Arai", slug: "arai" },
  { name: "Caberg", slug: "caberg" },
  { name: "Nolan", slug: "nolan" },
  { name: "HJC", slug: "hjc" },
  { name: "Shark", slug: "shark" },
  { name: "Dainese", slug: "dainese" },
  { name: "Alpinestars", slug: "alpinestars" },
  { name: "Rev'it", slug: "revit" },
  { name: "Sidi", slug: "sidi" },
  { name: "Givi", slug: "givi" },
  { name: "Shad", slug: "shad" },
  { name: "Quad Lock", slug: "quadlock" },
  { name: "Motul", slug: "motul" },
  { name: "Castrol", slug: "castrol" },
];

export function BrandCarousel() {
  const row = [...BRANDS, ...BRANDS];

  return (
    <section className="v3-bc v3-bc--reconstructed" aria-label="Brands">
      <div className="v3-bc-head">
        <p className="v3-label">Official brands</p>
        <span>
          Επιλεγμένοι κατασκευαστές για rider gear, bike setup και service.
        </span>
      </div>
      <div className="v3-bc-mask">
        <ul className="v3-bc-track">
          {row.map((b, i) => {
            const clone = i >= BRANDS.length;
            return (
              <li key={`${b.slug}-${i}`} className="v3-bc-plate">
                <img
                  src={`/brands/gear/${b.slug}.png`}
                  alt={clone ? "" : b.name}
                  aria-hidden={clone || undefined}
                  loading="lazy"
                  decoding="async"
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
