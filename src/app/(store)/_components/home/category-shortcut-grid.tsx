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
    </section>
  );
}
