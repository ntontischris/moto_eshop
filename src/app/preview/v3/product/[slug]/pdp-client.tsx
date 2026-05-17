"use client";

import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/queries/products";
import { ProductGallery } from "../../_components/pdp/product-gallery";
import { BuyBox } from "../../_components/pdp/buy-box";

type Tab = "desc" | "specs" | "ship";

export function PDPClient({
  product,
  related,
}: {
  product: Product;
  related: React.ReactNode;
}) {
  const [tab, setTab] = useState<Tab>("desc");
  const specEntries = Object.entries(product.specs ?? {});

  return (
    <div className="v3-pdp">
      <nav className="v3-pdp-bc" aria-label="Breadcrumb">
        <Link href="/preview/v3">Αρχική</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/preview/v3/category/${product.category_slug}`}>
          {product.category_name}
        </Link>
        <span aria-hidden="true">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="v3-pdp-top">
        <ProductGallery images={product.images} name={product.name} />
        <BuyBox product={product} />
      </div>

      <div className="v3-pdp-tabs" id="size-guide">
        <div className="v3-pdp-tablist" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "desc"}
            className={tab === "desc" ? "is-on" : ""}
            onClick={() => setTab("desc")}
          >
            Περιγραφή
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "specs"}
            className={tab === "specs" ? "is-on" : ""}
            onClick={() => setTab("specs")}
          >
            Χαρακτηριστικά
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "ship"}
            className={tab === "ship" ? "is-on" : ""}
            onClick={() => setTab("ship")}
          >
            Αποστολή & Επιστροφές
          </button>
        </div>

        <div className="v3-pdp-panel" role="tabpanel">
          {tab === "desc" && (
            <p className="v3-pdp-desc">
              {product.description || "Δεν υπάρχει διαθέσιμη περιγραφή."}
            </p>
          )}
          {tab === "specs" &&
            (specEntries.length > 0 ? (
              <table className="v3-pdp-specs">
                <tbody>
                  {specEntries.map(([k, v]) => (
                    <tr key={k}>
                      <th scope="row">{k}</th>
                      <td>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="v3-pdp-desc">
                Δεν υπάρχουν καταχωρημένα χαρακτηριστικά.
              </p>
            ))}
          {tab === "ship" && (
            <ul className="v3-pdp-ship">
              <li>Παράδοση 1–3 εργάσιμες ημέρες σε όλη την Ελλάδα.</li>
              <li>Δωρεάν αλλαγή μεγέθους εντός 14 ημερών.</li>
              <li>Δυνατότητα παραλαβής από το φυσικό κατάστημα.</li>
              <li>Ασφαλείς, κρυπτογραφημένες πληρωμές.</li>
            </ul>
          )}
        </div>
      </div>

      <section className="v3-pdp-rel" aria-label="Παρόμοια προϊόντα">
        <h2>Παρόμοια κράνη</h2>
        <div className="v3-pdp-rel-grid">{related}</div>
      </section>

      <style precedence="default">{`
        .v3-pdp { max-width: 1320px; margin: 0 auto;
          padding: 28px var(--v3-gutter) 80px; }
        .v3-pdp-bc { display: flex; flex-wrap: wrap; gap: 8px;
          font-size: .82rem; color: var(--v3-bone-dim); margin-bottom: 22px; }
        .v3-pdp-bc a { color: var(--v3-bone-dim); text-decoration: none; }
        .v3-pdp-bc a:hover { color: var(--v3-bone); }
        .v3-pdp-top { display: grid; grid-template-columns: 1fr 1fr;
          gap: 48px; align-items: start; }
        .v3-pdp-tabs { margin-top: 64px;
          border-top: 1px solid var(--v3-line); padding-top: 24px; }
        .v3-pdp-tablist { display: flex; flex-wrap: wrap; gap: 6px;
          margin-bottom: 22px; }
        .v3-pdp-tablist button {
          padding: 11px 20px; cursor: pointer; background: none;
          border: 0; border-bottom: 2px solid transparent;
          color: var(--v3-bone-dim); font-family: var(--v3-display);
          font-weight: 800; font-size: .92rem; text-transform: uppercase;
          letter-spacing: .04em;
        }
        .v3-pdp-tablist button.is-on {
          color: var(--v3-bone); border-bottom-color: var(--v3-red);
        }
        .v3-pdp-desc { margin: 0; max-width: 760px; line-height: 1.6;
          color: var(--v3-bone-dim); }
        .v3-pdp-specs { width: 100%; max-width: 720px;
          border-collapse: collapse; }
        .v3-pdp-specs th, .v3-pdp-specs td {
          text-align: left; padding: 12px 14px; font-size: .88rem;
          border-bottom: 1px solid var(--v3-line);
        }
        .v3-pdp-specs th { color: var(--v3-bone-dim); font-weight: 600;
          width: 40%; }
        .v3-pdp-specs td { color: var(--v3-bone); }
        .v3-pdp-ship { margin: 0; padding-left: 18px;
          color: var(--v3-bone-dim); line-height: 1.9; }
        .v3-pdp-rel { margin-top: 72px; }
        .v3-pdp-rel h2 { margin: 0 0 26px;
          font-family: var(--v3-display);
          font-size: clamp(1.8rem, 4.4vw, 3rem); font-weight: 900;
          color: var(--v3-bone); text-transform: uppercase;
          transform: skewX(-6deg); }
        .v3-pdp-rel-grid { display: grid;
          grid-template-columns: repeat(4, 1fr); gap: 18px; }
        .v3-pdp :focus-visible { outline: 2px solid var(--v3-cyan);
          outline-offset: 2px; }
        @media (max-width: 900px) {
          .v3-pdp-top { grid-template-columns: 1fr; gap: 32px; }
          .v3-pdp-rel-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .v3-pdp-rel-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
