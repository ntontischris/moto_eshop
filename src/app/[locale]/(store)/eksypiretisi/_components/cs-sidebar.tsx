"use client";

import { Link, usePathname } from "@/i18n/navigation";

/** Customer-service section navigation — the left sidebar shared by every
 *  /eksypiretisi/* page. Mirrors the legacy motomarket-shop.gr left submenu,
 *  in the v3 "Industrial Race" style. */

type CsLink = { href: string; label: string };

const SERVICE_LINKS: CsLink[] = [
  {
    href: "/eksypiretisi/apostoles-epistrofes",
    label: "Αποστολές & Επιστροφές",
  },
  { href: "/eksypiretisi/tropoi-pliromis", label: "Τρόποι Πληρωμής" },
  { href: "/eksypiretisi/eggyisi", label: "Εγγύηση" },
  { href: "/eksypiretisi/odigos-megethon", label: "Οδηγός Μεγεθών" },
  { href: "/eksypiretisi/kranos-asfaleia", label: "Κράνος & Ασφάλεια" },
  { href: "/eksypiretisi/syntirisi", label: "Συντήρηση Εξοπλισμού" },
];

const LEGAL_LINKS: CsLink[] = [
  { href: "/eksypiretisi/oroi-proypotheseis", label: "Όροι & Προϋποθέσεις" },
  { href: "/eksypiretisi/politiki-aporritou", label: "Πολιτική Απορρήτου" },
  { href: "/eksypiretisi/cookies", label: "Πολιτική Cookies" },
];

const COMPANY_LINKS: CsLink[] = [
  { href: "/etaireia", label: "Η Εταιρεία" },
  { href: "/epikoinonia", label: "Επικοινωνία" },
];

function LinkGroup({
  title,
  links,
  pathname,
}: {
  title: string;
  links: CsLink[];
  pathname: string;
}) {
  return (
    <div className="cs-nav-group">
      <p className="cs-nav-title v3-label">{title}</p>
      <ul className="cs-nav-list">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={active ? "cs-nav-link is-active" : "cs-nav-link"}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function CustomerServiceSidebar() {
  const pathname = usePathname();
  return (
    <nav className="cs-nav" aria-label="Εξυπηρέτηση πελατών">
      <LinkGroup
        title="Εξυπηρέτηση"
        links={SERVICE_LINKS}
        pathname={pathname}
      />
      <LinkGroup title="Νομικά" links={LEGAL_LINKS} pathname={pathname} />
      <LinkGroup title="Εταιρεία" links={COMPANY_LINKS} pathname={pathname} />
    </nav>
  );
}
