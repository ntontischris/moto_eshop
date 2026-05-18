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
    <footer className="v3-footer">
      <div className="v3-footer-grid">
        {/* Column 1: Categories */}
        <div>
          <div className="v3-footer-col-title">Κατηγορίες</div>
          <ul className="v3-footer-links">
            {TOP_NAV_ROOTS.map((root) => (
              <li key={root.slug}>
                <Link href={`/category/${root.slug}`}>{root.el}</Link>
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
        <div className="v3-payment-row" aria-label="Αποδεκτοί τρόποι πληρωμής">
          {PAYMENT_METHODS.map((method) => (
            <span key={method} className="v3-payment-chip">
              {method}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
