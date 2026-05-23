import { Star } from "lucide-react";
import { PROOF_STATS, PROOF_QUOTES } from "../../_lib/social-proof";

export function SocialProof() {
  return (
    <section className="v3-proof" aria-label="Αξιολογήσεις πελατών">
      <div className="v3-proof-inner">
        <div className="v3-proof-head">
          <p className="v3-label">Η εμπιστοσύνη των αναβατών</p>
          <h2 className="v3-display">Χιλιάδες αναβάτες μάς εμπιστεύονται.</h2>
        </div>

        <div className="v3-proof-stats">
          {PROOF_STATS.map((s) => (
            <div key={s.label} className="v3-proof-stat">
              <strong>
                {s.value}
                <span>{s.unit}</span>
              </strong>
              <span className="v3-proof-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="v3-proof-quotes">
          {PROOF_QUOTES.map((q) => (
            <figure key={q.author} className="v3-proof-quote">
              <div className="v3-proof-stars" aria-label="5 στα 5 αστέρια">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <blockquote>{q.body}</blockquote>
              <figcaption>
                {q.author} <span>· via {q.source}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
