export interface SubCategory {
  label: string;
  href: string;
}

export interface MenuCategory {
  label: string;
  href: string;
  badge?: string;
  columns: { title: string; items: SubCategory[] }[];
}

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    label: "Εξοπλισμός Αναβάτη",
    href: "/rider-gear",
    columns: [
      {
        title: "Κράνη",
        items: [
          { label: "Full Face", href: "/kranea/full-face" },
          { label: "Flip Up", href: "/kranea/flip-up" },
          { label: "Jet / Open Face", href: "/kranea/jet" },
          { label: "Adventure", href: "/kranea/adventure" },
          { label: "Off Road", href: "/kranea/off-road" },
          { label: "Intercoms", href: "/kranea/intercoms" },
        ],
      },
      {
        title: "Ενδυμασία",
        items: [
          { label: "Leather Suits", href: "/endymasia/leather-suits" },
          { label: "Jackets", href: "/endymasia/jackets" },
          { label: "Παντελόνια", href: "/endymasia/pants" },
          { label: "Γάντια", href: "/endymasia/gloves" },
          { label: "Αδιάβροχα", href: "/endymasia/waterproof" },
          { label: "Θερμικά", href: "/endymasia/thermal" },
          { label: "Προστασίες", href: "/endymasia/protections" },
        ],
      },
      {
        title: "Μπότες",
        items: [
          { label: "Adventure", href: "/mpotes-gantia/adventure" },
          { label: "Touring", href: "/mpotes-gantia/touring" },
          { label: "Racing", href: "/mpotes-gantia/racing" },
          { label: "Urban", href: "/mpotes-gantia/urban" },
        ],
      },
    ],
  },
  {
    label: "Εξοπλισμός Μηχανής",
    href: "/moto-gear",
    columns: [
      {
        title: "Αποσκευές",
        items: [
          { label: "Βαλίτσες", href: "/axesouar/suitcases" },
          { label: "Soft Bags", href: "/axesouar/soft-bags" },
          { label: "Βάσεις", href: "/axesouar/mounting" },
        ],
      },
      {
        title: "Αξεσουάρ",
        items: [
          { label: "Βάσεις Κινητού", href: "/axesouar/phone-mounts" },
          { label: "Κλειδαριές", href: "/axesouar/locks" },
          { label: "Καλύμματα", href: "/axesouar/covers" },
          { label: "Εξατμίσεις", href: "/antalaktika/exhausts" },
          { label: "Φίλτρα", href: "/antalaktika/filters" },
        ],
      },
    ],
  },
  {
    label: "Off-Road",
    href: "/off-road",
    columns: [
      {
        title: "Αναβάτης",
        items: [
          { label: "Κράνη MX", href: "/off-road/helmets" },
          { label: "Ενδυμασία MX", href: "/off-road/clothing" },
          { label: "Μπότες MX", href: "/off-road/boots" },
          { label: "Προστασίες MX", href: "/off-road/protections" },
        ],
      },
      {
        title: "Μηχανή",
        items: [
          { label: "Ανταλλακτικά MX", href: "/off-road/parts" },
          { label: "Αξεσουάρ MX", href: "/off-road/accessories" },
        ],
      },
    ],
  },
  {
    label: "Brands",
    href: "/brands",
    columns: [
      {
        title: "Δημοφιλή",
        items: [
          { label: "AGV", href: "/brands/agv" },
          { label: "Shoei", href: "/brands/shoei" },
          { label: "Dainese", href: "/brands/dainese" },
          { label: "Alpinestars", href: "/brands/alpinestars" },
          { label: "Rev'It", href: "/brands/revit" },
          { label: "Sena", href: "/brands/sena" },
        ],
      },
      {
        title: "Περισσότερα",
        items: [
          { label: "HJC", href: "/brands/hjc" },
          { label: "LS2", href: "/brands/ls2" },
          { label: "Givi", href: "/brands/givi" },
          { label: "Held", href: "/brands/held" },
          { label: "TCX", href: "/brands/tcx" },
          { label: "Forma", href: "/brands/forma" },
        ],
      },
    ],
  },
  {
    label: "Προσφορές",
    href: "/prosfores",
    badge: "Sale",
    columns: [
      {
        title: "Εκπτώσεις",
        items: [
          { label: "Κράνη", href: "/prosfores/kranea" },
          { label: "Ενδυμασία", href: "/prosfores/endymasia" },
          { label: "Μπότες", href: "/prosfores/boots" },
          { label: "Αξεσουάρ", href: "/prosfores/accessories" },
        ],
      },
    ],
  },
];
