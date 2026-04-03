import Link from "next/link";
import { Bike, Globe, Camera, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Container } from "@/components/layout/container";
import { Separator } from "@/components/ui/separator";

interface FooterProps {
  categoryTree: {
    id: string;
    slug: string;
    name: string;
    children: { id: string; slug: string; name: string }[];
  }[];
}

const FOOTER_LINKS = {
  help: {
    title: "Εξυπηρέτηση",
    links: [
      { label: "Επικοινωνία", href: "/contact" },
      { label: "Αποστολές & Επιστροφές", href: "/shipping" },
      { label: "Συχνές Ερωτήσεις", href: "/faq" },
      { label: "Εγγύηση", href: "/warranty" },
      { label: "Οδηγός Μεγεθών", href: "/size-guide" },
    ],
  },
  company: {
    title: "Εταιρεία",
    links: [
      { label: "Σχετικά με εμάς", href: "/about" },
      { label: "Καριέρα", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Πολιτική Απορρήτου", href: "/privacy" },
      { label: "Όροι Χρήσης", href: "/terms" },
    ],
  },
};

const SOCIAL_LINKS = [
  { label: "Facebook", href: "https://facebook.com", icon: Globe },
  { label: "Instagram", href: "https://instagram.com", icon: Camera },
  { label: "YouTube", href: "https://youtube.com", icon: Play },
];

export const Footer = ({ categoryTree }: FooterProps) => {
  const shopLinks = categoryTree.map((cat) => ({
    label: cat.name,
    href: `/${cat.slug}`,
  }));

  return (
    <footer className="border-t border-border-default bg-bg-surface">
      <Container>
        {/* Main footer grid */}
        <div className="grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand column */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Bike className="h-6 w-6 text-brand-red" />
              <span className="text-lg font-bold text-text-primary">
                Moto<span className="text-brand-red">Market</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-text-secondary">
              Το μεγαλύτερο online κατάστημα εξοπλισμού μοτοσυκλέτας στην
              Ελλάδα. Κορυφαίες μάρκες, χαμηλές τιμές, γρήγορη αποστολή.
            </p>
            {/* Social links */}
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-border-default text-text-secondary transition-colors hover:border-brand-red hover:text-brand-red"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Categories column (dynamic) */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
              Κατηγορίες
            </h3>
            <ul className="flex flex-col gap-2">
              {shopLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-text-secondary transition-colors hover:text-brand-red"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Static link columns */}
          {Object.entries(FOOTER_LINKS).map(([key, { title, links }]) => (
            <div key={key} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
                {title}
              </h3>
              <ul className="flex flex-col gap-2">
                {links.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-sm text-text-secondary transition-colors hover:text-brand-red"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="bg-bg-elevated" />

        {/* Newsletter */}
        <div className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-text-primary">
              Εγγραφή στο Newsletter
            </h3>
            <p className="mt-1 text-sm text-text-secondary">
              Λάβε πρώτος τις νέες προσφορές και προϊόντα.
            </p>
          </div>
          <form className="flex gap-2 sm:w-96" action="#">
            <Input
              type="email"
              placeholder="email@example.com"
              className="border-border-default bg-bg-elevated text-text-primary placeholder:text-text-muted"
              aria-label="Email για newsletter"
            />
            <Button type="submit" variant="default" className="shrink-0">
              Εγγραφή
            </Button>
          </form>
        </div>

        <Separator className="bg-bg-elevated" />

        {/* Bottom bar */}
        <div className="flex flex-col gap-2 py-6 text-center text-xs text-text-muted sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p>&copy; 2026 MotoMarket. Όλα τα δικαιώματα διατηρούνται.</p>
          <p>Κατασκευή με αγάπη για τους μοτοσυκλιστές της Ελλάδας.</p>
        </div>
      </Container>
    </footer>
  );
};
