export interface NavLink {
  label: string;
  href: string;
  badge?: string;
}

export const NAV_LINKS: NavLink[] = [
  { label: "Κράνη", href: "/kranea" },
  { label: "Ενδυμασία", href: "/endymasia" },
  { label: "Μπότες & Γάντια", href: "/mpotes-gantia" },
  { label: "Αξεσουάρ", href: "/axesouar" },
  { label: "Ανταλλακτικά", href: "/antalaktika" },
  { label: "Brands", href: "/brands" },
  { label: "Προσφορές", href: "/prosfores", badge: "Sale" },
];
