import Link from "next/link";
import { NAV } from "@/lib/nav-data";

const SERVICE_LINKS = [
  "Αποστολές",
  "Επιστροφές",
  "Εγγύηση",
  "Επικοινωνία",
] as const;

const COMPANY_LINKS = [
  "Σχετικά με εμάς",
  "Καριέρα",
  "Τύπος",
  "Συνεργασίες",
] as const;

const PAYMENT_METHODS = ["Visa", "Mastercard", "IRIS", "Αντικαταβολή"] as const;

const TOP_NAV_ROOTS = NAV.slice(0, 6);

export function Footer() {
  return (
    <>
      <style>{`
        .v3-footer {
          background: var(--v3-graphite);
          border-top: 1px solid var(--v3-line);
          margin-top: auto;
          padding: 48px var(--v3-gutter) 32px;
        }
        .v3-footer-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 40px;
          max-width: 1440px;
          margin: 0 auto 40px;
        }
        .v3-footer-col-title {
          color: var(--v3-bone);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .v3-footer-links {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .v3-footer-links a {
          color: var(--v3-bone-dim);
          font-size: 13px;
          text-decoration: none;
          transition: color .15s;
          display: block;
        }
        .v3-footer-links a:hover { color: var(--v3-bone); }
        .v3-footer-links a:focus-visible {
          outline: 2px solid var(--v3-cyan);
          outline-offset: 2px;
          border-radius: 2px;
        }
        .v3-footer-bottom {
          max-width: 1440px;
          margin: 0 auto;
          border-top: 1px solid var(--v3-line);
          padding-top: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .v3-footer-copyright {
          color: var(--v3-bone-dim);
          font-size: 12px;
        }
        .v3-payment-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .v3-payment-chip {
          background: var(--v3-surface);
          border: 1px solid var(--v3-line);
          border-radius: 6px;
          color: var(--v3-bone-dim);
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
        }
        @media (max-width: 860px) {
          .v3-footer-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 32px;
          }
        }
        @media (max-width: 520px) {
          .v3-footer-grid {
            grid-template-columns: 1fr;
            gap: 28px;
          }
          .v3-footer-bottom {
            flex-direction: column;
            align-items: flex-start;
          }
          /* leave room for mobile nav bar */
          .v3-footer { padding-bottom: 80px; }
        }
      `}</style>

      <footer className="v3-footer">
        <div className="v3-footer-grid">
          {/* Column 1: Categories */}
          <div>
            <div className="v3-footer-col-title">Κατηγορίες</div>
            <ul className="v3-footer-links">
              {TOP_NAV_ROOTS.map((root) => (
                <li key={root.slug}>
                  <Link href={`/preview/v3/category/${root.slug}`}>
                    {root.el}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 2: Service */}
          <div>
            <div className="v3-footer-col-title">Εξυπηρέτηση</div>
            <ul className="v3-footer-links">
              {SERVICE_LINKS.map((label) => (
                <li key={label}>
                  <a href="#">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <div className="v3-footer-col-title">Εταιρεία</div>
            <ul className="v3-footer-links">
              {COMPANY_LINKS.map((label) => (
                <li key={label}>
                  <a href="#">{label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="v3-footer-bottom">
          <span className="v3-footer-copyright">
            © 2026 MotoMarket. Όλα τα δικαιώματα διατηρούνται.
          </span>
          <div
            className="v3-payment-row"
            aria-label="Αποδεκτοί τρόποι πληρωμής"
          >
            {PAYMENT_METHODS.map((method) => (
              <span key={method} className="v3-payment-chip">
                {method}
              </span>
            ))}
          </div>
        </div>
      </footer>
    </>
  );
}
