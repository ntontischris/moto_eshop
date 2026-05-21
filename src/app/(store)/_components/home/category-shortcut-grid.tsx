import Link from "next/link";
import Image from "next/image";
import { PHOTO } from "../../_lib/assets";

type ShortcutImageKey = keyof typeof PHOTO | "gloves" | "boots";

export interface ShortcutItem {
  label: string;
  href: string;
  valid: boolean;
  brief?: string;
  imageKey?: ShortcutImageKey;
}

const IMG: Record<ShortcutImageKey, string> = {
  ...PHOTO,
  gloves: PHOTO.apparel,
  boots: PHOTO.editorial,
};

export function CategoryShortcutGrid({ items }: { items: ShortcutItem[] }) {
  return (
    <section className="v3-cat-runway" aria-label="Κατηγορίες προϊόντων">
      <div className="v3-cat-runway-inner">
        <div className="v3-cat-runway-head">
          <div>
            <p className="v3-label">Product families</p>
            <h2>Βρες το κομμάτι που λείπει από το setup σου</h2>
          </div>
          <Link href="/category/eksoplismos-anabath">
            Όλες οι κατηγορίες <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="v3-cat-track" role="list">
          {items.map((it, i) => (
            <Link
              key={it.label}
              href={it.href}
              role="listitem"
              className={`v3-cat-chip${i === 0 ? " is-active" : ""}`}
            >
              <span className="v3-cat-media">
                <Image
                  src={IMG[it.imageKey ?? "editorial"]}
                  alt=""
                  fill
                  sizes="112px"
                  style={{ objectFit: "cover" }}
                />
              </span>
              <span className="v3-cat-label">{it.label}</span>
              {it.brief && <span className="v3-cat-brief">{it.brief}</span>}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
