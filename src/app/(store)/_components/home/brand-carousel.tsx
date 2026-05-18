/* BrandCarousel — CSS-only marquee of carried brand wordmarks (text, no logo
   assets). Animation pauses under prefers-reduced-motion. */

const BRANDS = [
  "AGV",
  "Shoei",
  "Arai",
  "Caberg",
  "Nolan",
  "HJC",
  "Shark",
  "LS2",
  "Dainese",
  "Alpinestars",
  "Rev'it",
  "Sidi",
  "TCX",
  "Givi",
  "Shad",
  "Quad Lock",
  "Motul",
  "Castrol",
];

export function BrandCarousel() {
  const row = [...BRANDS, ...BRANDS];
  return (
    <section className="v3-bc" aria-label="Brands">
      <div className="v3-bc-mask">
        <ul className="v3-bc-track">
          {row.map((b, i) => (
            <li key={`${b}-${i}`}>{b}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
