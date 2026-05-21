const BRANDS = [
  "AGV",
  "Shoei",
  "Arai",
  "Caberg",
  "Nolan",
  "HJC",
  "Shark",
  "Dainese",
  "Alpinestars",
  "Rev'it",
  "Sidi",
  "Givi",
  "Shad",
  "Quad Lock",
  "Motul",
  "Castrol",
];

export function BrandCarousel() {
  const row = [...BRANDS, ...BRANDS];

  return (
    <section className="v3-bc v3-bc--reconstructed" aria-label="Brands">
      <div className="v3-bc-head">
        <p className="v3-label">Official brands</p>
        <span>Επιλεγμένοι κατασκευαστές για rider gear, bike setup και service.</span>
      </div>
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
