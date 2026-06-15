import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { LqipImage } from "../fx/lqip-image";
import "./gear-tunnel.css";

/* Gear Tunnel (Velocità S9) — a cinematic horizontal category showcase.

   Server component: renders the full card rail as plain, scrollable markup so
   it works with zero JS (and under reduced-motion) as a swipeable scroll-snap
   rail. The motion engine (motion-engine.ts) finds [data-gear-tunnel] after
   hydration and, only on wide fine-pointer motion-OK devices, pins the section
   and scrubs the track horizontally with inner image parallax + a progress bar.
   Mobile/touch keep this native CSS rail. Card links use the real category
   Clean URLs (ADR 0002). Imagery uses LqipImage for instant blur-up. */

interface TunnelCard {
  label: string;
  href: string;
  brief?: string;
  src: string;
}

export async function GearTunnel({ cards }: { cards: TunnelCard[] }) {
  const t = await getTranslations("home");

  if (cards.length === 0) {
    return null;
  }

  return (
    <section
      className="v3-tunnel"
      aria-label={t("tunnelHeading")}
      data-gear-tunnel
    >
      <div className="v3-tunnel-pin" data-gear-tunnel-pin>
        <div className="v3-tunnel-head">
          <p className="v3-label">{t("tunnelEyebrow")}</p>
          <h2>{t("tunnelHeading")}</h2>
        </div>

        <div className="v3-tunnel-track" data-gear-tunnel-track role="list">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              role="listitem"
              className="v3-tunnel-card"
              data-gear-tunnel-card
              aria-label={t("catSeeLabel", { label: card.label })}
            >
              <span className="v3-tunnel-card-media" aria-hidden="true">
                <span className="v3-tunnel-card-mask" data-gear-tunnel-mask>
                  <LqipImage
                    src={card.src}
                    alt=""
                    sizes="(max-width: 900px) 80vw, 38vw"
                  />
                </span>
              </span>
              <span className="v3-tunnel-card-copy">
                <strong>{card.label}</strong>
                {card.brief && <span>{card.brief}</span>}
                <em>
                  {t("catSeeCategory")} <span aria-hidden="true">→</span>
                </em>
              </span>
            </Link>
          ))}
        </div>

        <div
          className="v3-tunnel-progress"
          aria-hidden="true"
          data-gear-tunnel-progress
        >
          <span className="v3-tunnel-progress-fill" data-gear-tunnel-fill />
        </div>
      </div>
    </section>
  );
}

export type { TunnelCard };
