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
      <style precedence="default">{`
        .v3-bc {
          padding: 40px var(--v3-gutter); border-top: 1px solid var(--v3-line);
          overflow: hidden;
        }
        .v3-bc-mask { max-width: 1320px; margin: 0 auto; overflow: hidden; }
        .v3-bc-track {
          display: flex; gap: 48px; list-style: none; margin: 0; padding: 0;
          width: max-content; animation: v3-bc-scroll 38s linear infinite;
        }
        .v3-bc-track li {
          font-weight: 800; font-size: 1.15rem; letter-spacing: .04em;
          color: var(--v3-bone-dim); white-space: nowrap; opacity: .8;
        }
        @keyframes v3-bc-scroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .v3-bc-track { animation: none; flex-wrap: wrap; width: auto; }
        }
      `}</style>
    </section>
  );
}
