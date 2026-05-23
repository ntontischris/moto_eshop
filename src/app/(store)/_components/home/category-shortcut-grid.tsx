import Link from "next/link";
import Image from "next/image";

type ShortcutImageKey =
  | "helmet"
  | "apparel"
  | "gloves"
  | "boots"
  | "topCase"
  | "exhaust"
  | "helmetFront"
  | "tyre"
  | "editorial";

export interface ShortcutItem {
  label: string;
  href: string;
  valid: boolean;
  brief?: string;
  imageKey?: ShortcutImageKey;
}

const IMG: Record<ShortcutImageKey, string> = {
  helmet: "/category-atelier/helmets.webp",
  apparel: "/category-atelier/jackets.webp",
  gloves: "/category-atelier/gloves.webp",
  boots: "/category-atelier/boots.webp",
  topCase: "/category-atelier/luggage.webp",
  exhaust: "/category-atelier/service.webp",
  helmetFront: "/category-atelier/phone-mount.webp",
  tyre: "/category-atelier/off-road.webp",
  editorial: "/category-atelier/helmets.webp",
};

const TILE_CLASSES = [
  "v3-cat-tile--wide",
  "v3-cat-tile--tall",
  "",
  "",
  "v3-cat-tile--wide",
  "",
  "",
] as const;

export function CategoryShortcutGrid({ items }: { items: ShortcutItem[] }) {
  const [spotlight, ...wallItems] = items;

  if (!spotlight) {
    return null;
  }

  return (
    <section className="v3-cat-runway" aria-label="Κατηγορίες προϊόντων">
      <div className="v3-cat-runway-inner v3-cat-atelier">
        <div className="v3-cat-runway-head">
          <div>
            <p className="v3-label">Product families</p>
            <h2>Βρες το κομμάτι που λείπει από το setup σου</h2>
          </div>
          <Link href="/category/eksoplismos-anabath">
            Όλες οι κατηγορίες <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="v3-cat-atelier-grid">
          <Link
            className="v3-cat-spotlight"
            href={spotlight.href}
            aria-label={`Δες ${spotlight.label}`}
          >
            <span className="v3-cat-spotlight-media" aria-hidden="true">
              <Image
                src={IMG[spotlight.imageKey ?? "editorial"]}
                alt=""
                fill
                sizes="(max-width: 920px) 100vw, 44vw"
              />
              <span className="v3-cat-spotlight-shade" />
            </span>
            <span className="v3-cat-spotlight-copy">
              <span className="v3-cat-eyebrow">Start here</span>
              <strong>{spotlight.label}</strong>
              {spotlight.brief && <span>{spotlight.brief}</span>}
              <em>
                Δες κατηγορία <span aria-hidden="true">→</span>
              </em>
            </span>
          </Link>

          <div className="v3-cat-wall" role="list">
            {wallItems.map((item, index) => (
              <Link
                key={item.label}
                href={item.href}
                role="listitem"
                className={`v3-cat-tile ${TILE_CLASSES[index] ?? ""}`.trim()}
              >
                <span className="v3-cat-tile-media" aria-hidden="true">
                  <Image
                    src={IMG[item.imageKey ?? "editorial"]}
                    alt=""
                    fill
                    sizes="(max-width: 920px) 46vw, 18vw"
                  />
                </span>
                <span className="v3-cat-tile-shade" />
                <span className="v3-cat-tile-copy">
                  <strong>{item.label}</strong>
                  {item.brief && <span>{item.brief}</span>}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="v3-cat-status" aria-label="MotoMarket category status">
          <span>
            <strong>Rider gear</strong> κράνη, μπουφάν, γάντια
          </span>
          <span>
            <strong>Bike gear</strong> βαλίτσες, βάσεις, cockpit
          </span>
          <span>
            <strong>Service</strong> λάδια, chain care, αναλώσιμα
          </span>
        </div>
      </div>
    </section>
  );
}
