import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { NAV } from "@/lib/nav-data";
import { navLabel } from "@/lib/nav-i18n";

const TOP_NAV_ROOTS = NAV.slice(0, 6);

export async function Footer() {
  const t = await getTranslations("shell");
  const locale = await getLocale();

  const SERVICE_LINKS = [
    {
      key: "serviceShipping",
      label: t("serviceShipping"),
      href: "/eksypiretisi/apostoles-epistrofes",
    },
    {
      key: "serviceReturns",
      label: t("serviceReturns"),
      href: "/eksypiretisi/apostoles-epistrofes",
    },
    {
      key: "serviceWarranty",
      label: t("serviceWarranty"),
      href: "/eksypiretisi/eggyisi",
    },
    { key: "serviceContact", label: t("serviceContact"), href: "/epikoinonia" },
  ] as const;

  const COMPANY_LINKS = [
    { key: "companyAbout", label: t("companyAbout"), href: "/etaireia" },
    { key: "companyCareers", label: t("companyCareers"), href: "#" },
    { key: "companyPress", label: t("companyPress"), href: "#" },
    { key: "companyPartners", label: t("companyPartners"), href: "#" },
  ] as const;

  const PAYMENT_METHODS = [
    "Visa",
    "Mastercard",
    "IRIS",
    t("footerCod"),
  ] as const;

  return (
    <footer className="v3-footer">
      <div className="v3-footer-grid">
        {/* Column 1: Categories */}
        <div>
          <div className="v3-footer-col-title">{t("footerCategories")}</div>
          <ul className="v3-footer-links">
            {TOP_NAV_ROOTS.map((root) => (
              <li key={root.slug}>
                <Link href={`/${root.path}`}>{navLabel(root.el, locale)}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 2: Service */}
        <div>
          <div className="v3-footer-col-title">{t("footerService")}</div>
          <ul className="v3-footer-links">
            {SERVICE_LINKS.map(({ key, label, href }) => (
              <li key={key}>
                <Link href={href}>{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Company */}
        <div>
          <div className="v3-footer-col-title">{t("footerCompany")}</div>
          <ul className="v3-footer-links">
            {COMPANY_LINKS.map(({ key, label, href }) => (
              <li key={key}>
                {href === "#" ? (
                  <a href="#">{label}</a>
                ) : (
                  <Link href={href}>{label}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="v3-footer-bottom">
        <span className="v3-footer-copyright">{t("footerCopyright")}</span>
        <div className="v3-payment-row" aria-label={t("footerPayments")}>
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
