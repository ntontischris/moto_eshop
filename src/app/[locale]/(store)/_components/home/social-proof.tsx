import { Star, ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PROOF_STATS, PROOF_QUOTES } from "../../_lib/social-proof";

function Stars({ label }: { label: string }) {
  return (
    <div className="v3-proof-stars" aria-label={label}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={13} fill="currentColor" strokeWidth={0} />
      ))}
    </div>
  );
}

export async function SocialProof() {
  const t = await getTranslations("home");
  // Duplicate the quotes so the marquee can loop seamlessly.
  const ticker = [...PROOF_QUOTES, ...PROOF_QUOTES];

  return (
    <section className="v3-proof" aria-label={t("socialReviews")}>
      <div className="v3-proof-inner">
        <div className="v3-proof-head">
          <p className="v3-label">{t("socialKicker")}</p>
          <h2 className="v3-display">
            {t("socialHeading1")}
            <br />
            <em>{t("socialHeading2")}</em>
          </h2>
        </div>

        <div className="v3-proof-scores">
          {PROOF_STATS.map((s) => {
            const isRating = s.unit === "★";
            const inner = (
              <>
                {isRating && (
                  <span className="v3-proof-score-stars" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    ))}
                  </span>
                )}
                <strong className="v3-proof-score-value">
                  {s.value}
                  {!isRating && <span>{s.unit}</span>}
                </strong>
                <span className="v3-proof-score-meta">
                  <span className="v3-proof-score-src">{s.source}</span>
                  <span className="v3-proof-score-label">{s.label}</span>
                </span>
                {s.href && (
                  <span className="v3-proof-score-cta">
                    {t("socialSeeReviews")}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </span>
                )}
              </>
            );
            return s.href ? (
              <a
                key={s.source}
                className="v3-proof-score is-link"
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                {inner}
              </a>
            ) : (
              <div key={s.source} className="v3-proof-score">
                {inner}
              </div>
            );
          })}
        </div>
      </div>

      <div className="v3-proof-ticker">
        <div className="v3-proof-track">
          {ticker.map((q, i) => (
            <a
              key={`${q.author}-${i}`}
              className="v3-proof-quote"
              href={q.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-hidden={i >= PROOF_QUOTES.length ? true : undefined}
              tabIndex={i >= PROOF_QUOTES.length ? -1 : undefined}
            >
              <Stars label={t("socialStars")} />
              <blockquote>{q.body}</blockquote>
              <figcaption>
                <span className="v3-proof-quote-author">{q.author}</span>
                <span className="v3-proof-quote-src">
                  via {q.source}
                  <ArrowUpRight size={12} aria-hidden="true" />
                </span>
              </figcaption>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
