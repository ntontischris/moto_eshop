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
        <Link href="/">Αρχική</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/category/${product.category_slug}`}>
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
    </div>
  );
}
