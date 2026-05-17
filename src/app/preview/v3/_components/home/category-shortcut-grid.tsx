import Link from "next/link";
import Image from "next/image";
import { PHOTO } from "../../_lib/assets";

/* CategoryShortcutGrid — image tiles using existing photography. First tile
   is intentionally oversized (grid-breaking). next/image with fixed
   aspect-ratio boxes → zero CLS; below-the-fold so lazy by default. */

export interface ShortcutItem {
  label: string;
  href: string;
  valid: boolean;
}

const IMG: Record<string, string> = {
  Κράνη: PHOTO.helmet,
  Μπουφάν: PHOTO.apparel,
  Γάντια: PHOTO.apparel,
  Μπότες: PHOTO.editorial,
  Βαλίτσες: PHOTO.topCase,
  Λιπαντικά: PHOTO.exhaust,
  "Quad Lock": PHOTO.helmetFront,
  "Off-road": PHOTO.tyre,
};

export function CategoryShortcutGrid({ items }: { items: ShortcutItem[] }) {
  return (
    <section className="v3-sc" aria-label="Κατηγορίες">
      <div className="v3-sc-inner">
        <div className="v3-sc-head">
          <h2 className="v3-display">
            Κατηγορίες<span className="v3-sc-dot">.</span>
          </h2>
          <p className="v3-label">Διάλεξε κατηγορία</p>
        </div>
        <div className="v3-sc-grid">
          {items.map((it, i) => (
            <Link
              key={it.label}
              href={it.href}
              className={`v3-sc-tile${i === 0 ? " v3-sc-tile--big" : ""}${
                it.valid ? "" : " v3-sc-tile--soft"
              }`}
            >
              <Image
                src={IMG[it.label] ?? PHOTO.editorial}
                alt=""
                fill
                sizes="(max-width:900px) 50vw, 25vw"
                style={{ objectFit: "cover" }}
              />
              <span className="v3-sc-shade" aria-hidden="true" />
              <span className="v3-sc-meta">
                <span className="v3-sc-label v3-display">{it.label}</span>
                <span className="v3-sc-go" aria-hidden="true">
                  Δες →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
      <style precedence="default">{`
        .v3-sc { padding: clamp(64px, 9vw, 110px) var(--v3-gutter); }
        .v3-sc-inner { max-width: 1340px; margin: 0 auto; }
        .v3-sc-head {
          display: flex; align-items: flex-end; justify-content: space-between;
          margin-bottom: 30px; gap: 20px;
        }
        .v3-sc-head h2 {
          margin: 0; font-size: clamp(2rem, 5vw, 3.4rem); font-weight: 900;
          color: var(--v3-bone); transform: skewX(-6deg);
        }
        .v3-sc-dot { color: var(--v3-red); }
        .v3-sc-head p { margin: 0 0 6px; color: var(--v3-bone-dim); }
        .v3-sc-grid {
          display: grid; grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 220px; gap: 12px;
        }
        .v3-sc-tile {
          position: relative; overflow: hidden; text-decoration: none;
          border: 1px solid var(--v3-line);
          clip-path: polygon(0 0,100% 0,100% calc(100% - 16px),
            calc(100% - 16px) 100%,0 100%);
          transition: border-color .18s;
        }
        .v3-sc-tile--big { grid-column: span 2; grid-row: span 2; }
        .v3-sc-tile img {
          object-fit: cover;
          transition: transform .5s cubic-bezier(.2,.7,.2,1);
        }
        .v3-sc-tile:hover img { transform: scale(1.06); }
        .v3-sc-tile:hover { border-color: var(--v3-red); }
        .v3-sc-shade {
          position: absolute; inset: 0;
          background: linear-gradient(0deg, rgba(8,9,11,.86) 0 6%,
            rgba(8,9,11,.32) 46%, rgba(8,9,11,.12) 100%);
        }
        .v3-sc-meta {
          position: absolute; left: 0; right: 0; bottom: 0;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px; gap: 12px;
        }
        .v3-sc-label {
          color: var(--v3-bone); font-weight: 900;
          text-transform: uppercase; letter-spacing: -0.01em;
          font-size: clamp(1rem, 2.4vw, 1.7rem);
        }
        .v3-sc-tile--big .v3-sc-label { font-size: clamp(1.6rem,4vw,3rem); }
        .v3-sc-go {
          font-family: var(--v3-display); font-weight: 800;
          text-transform: uppercase; letter-spacing: .08em;
          font-size: .8rem; color: var(--v3-red);
          opacity: 0; transform: translateX(-6px);
          transition: opacity .2s, transform .2s;
        }
        .v3-sc-tile:hover .v3-sc-go { opacity: 1; transform: none; }
        .v3-sc-tile:focus-visible {
          outline: 2px solid var(--v3-cyan); outline-offset: 3px;
        }
        .v3-sc-tile--soft { filter: grayscale(.5) opacity(.7); }
        @media (prefers-reduced-motion: reduce) {
          .v3-sc-tile img, .v3-sc-go { transition: none; }
          .v3-sc-tile:hover img { transform: none; }
          .v3-sc-go { opacity: 1; transform: none; }
        }
        @media (max-width: 900px) {
          .v3-sc-grid { grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: 170px; }
          .v3-sc-tile--big { grid-column: span 2; grid-row: span 1;
            min-height: 240px; }
        }
        @media (max-width: 520px) {
          .v3-sc-grid { grid-template-columns: 1fr; grid-auto-rows: 150px; }
          .v3-sc-tile--big { grid-column: span 1; }
        }
      `}</style>
    </section>
  );
}
