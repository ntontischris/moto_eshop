"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const PANELS = [
  {
    key: "ride",
    label: "Shop by ride",
    href: "/category/eksoplismos-anabath",
    eyebrow: "Activity selector",
    title: "Διάλεξε χρήση και πήγαινε κατευθείαν στα σωστά προϊόντα.",
    columns: [
      {
        title: "Riding style",
        links: [
          ["Racing / Sport", "/category/racing-gear"],
          ["Touring", "/category/eksoplismos-motosikletas"],
          ["Adventure", "/category/off-road"],
          ["Urban / Scooter", "/category/eksoplismos-anabath"],
          ["Rain / Winter", "/search?q=waterproof"],
        ],
      },
      {
        title: "Fast kits",
        links: [
          ["Track day kit", "/search?q=racing%20gloves"],
          ["Daily commute", "/search?q=jet%20helmet"],
          ["Long trip", "/search?q=top%20case"],
          ["Cold weather", "/search?q=thermal"],
        ],
      },
      {
        title: "Fit help",
        links: [
          ["ECE 22.06 κράνη", "/search?q=ECE%2022.06"],
          ["Waterproof gear", "/search?q=waterproof"],
          ["Leather jackets", "/search?q=leather%20jacket"],
          ["Phone cockpit", "/search?q=Quad%20Lock"],
        ],
      },
    ],
  },
  {
    key: "gear",
    label: "Εξοπλισμός",
    href: "/category/eksoplismos-anabath",
    eyebrow: "Rider gear",
    title: "Κράνη, μπουφάν, γάντια και μπότες με καθαρή επιλογή.",
    columns: [
      {
        title: "Αναβάτης",
        links: [
          ["Κράνη", "/category/eksoplismos-anabath"],
          ["Μπουφάν", "/category/endysh--mpoyfan"],
          ["Γάντια", "/category/endysh--gantia"],
          ["Μπότες", "/category/endysh--mpotes"],
        ],
      },
      {
        title: "Protection",
        links: [
          ["Προστασίες", "/search?q=protector"],
          ["Αδιάβροχα", "/search?q=rain"],
          ["Base layers", "/search?q=thermal"],
          ["Racing gear", "/category/racing-gear"],
        ],
      },
      {
        title: "Top brands",
        links: [
          ["AGV", "/search?q=AGV"],
          ["Dainese", "/search?q=Dainese"],
          ["Alpinestars", "/search?q=Alpinestars"],
          ["Sidi", "/search?q=Sidi"],
        ],
      },
    ],
  },
  {
    key: "bike",
    label: "Μοτοσυκλέτα",
    href: "/category/eksoplismos-motosikletas",
    eyebrow: "Bike setup",
    title: "Αξεσουάρ, service και λύσεις για τη μηχανή σου.",
    columns: [
      {
        title: "Αξεσουάρ",
        links: [
          ["Βαλίτσες", "/category/eksoplismos-motosikletas"],
          ["Ζελατίνες", "/category/eksoplismos-motosikletas--zelatines"],
          ["Βάσεις", "/category/eksoplismos-motosikletas"],
          ["Quad Lock", "/search?q=Quad%20Lock"],
        ],
      },
      {
        title: "Service",
        links: [
          ["Λιπαντικά", "/category/lipantika"],
          ["Chain care", "/category/lipantika--chain-lubes"],
          ["Chemicals", "/category/lipantika--chemicals"],
          ["Moto 4T", "/category/lipantika--moto-4t"],
        ],
      },
      {
        title: "Brands",
        links: [
          ["Givi", "/search?q=Givi"],
          ["Shad", "/search?q=Shad"],
          ["Motul", "/search?q=Motul"],
          ["Castrol", "/search?q=Castrol"],
        ],
      },
    ],
  },
  {
    key: "brands",
    label: "Brands",
    href: "/brands",
    eyebrow: "Official selection",
    title: "Αγόρασε με βάση το brand που εμπιστεύεσαι.",
    columns: [
      {
        title: "Rider",
        links: [
          ["AGV", "/search?q=AGV"],
          ["Dainese", "/search?q=Dainese"],
          ["Alpinestars", "/search?q=Alpinestars"],
          ["Shoei", "/search?q=Shoei"],
        ],
      },
      {
        title: "Bike",
        links: [
          ["Givi", "/search?q=Givi"],
          ["Shad", "/search?q=Shad"],
          ["Puig", "/search?q=Puig"],
          ["Brembo", "/search?q=Brembo"],
        ],
      },
      {
        title: "Service",
        links: [
          ["Motul", "/search?q=Motul"],
          ["Castrol", "/search?q=Castrol"],
          ["Liqui Moly", "/search?q=Liqui%20Moly"],
          ["NGK", "/search?q=NGK"],
        ],
      },
    ],
  },
  {
    key: "offers",
    label: "Προσφορές",
    href: "/category/prosfores",
    eyebrow: "Live deals",
    title: "Γρήγορες επιλογές με τιμή που βγάζει νόημα.",
    accent: true,
    columns: [
      {
        title: "Deals",
        links: [
          ["Όλες οι προσφορές", "/category/prosfores"],
          ["Κράνη σε προσφορά", "/category/eksoplismos-anabath"],
          ["Μπουφάν σε προσφορά", "/category/endysh--mpoyfan"],
          ["Αξεσουάρ σε προσφορά", "/category/aksesoyar"],
        ],
      },
      {
        title: "Quick buy",
        links: [
          ["Νέες αφίξεις", "/category/eksoplismos-anabath"],
          ["Best sellers", "/category/eksoplismos-anabath"],
          ["Bike Finder", "#my-bike"],
          ["Brands", "/brands"],
        ],
      },
      {
        title: "Under pressure",
        links: [
          ["Last sizes", "/category/prosfores"],
          ["Outlet gear", "/category/prosfores"],
          ["Weekend ride", "/search?q=touring"],
          ["Service basket", "/category/lipantika"],
        ],
      },
    ],
  },
] as const;

type PanelKey = (typeof PANELS)[number]["key"];

export function MegaMenu() {
  const [open, setOpen] = useState<PanelKey>(PANELS[0].key);
  const active = PANELS.find((panel) => panel.key === open) ?? PANELS[0];

  return (
    <nav
      className="v3-mega-bar v3-mega-bar--reconstructed"
      aria-label="Κύρια πλοήγηση"
      onMouseLeave={() => setOpen(PANELS[0].key)}
    >
      <div className="v3-mega-inner">
        <div className="v3-mega-tabs" role="menubar">
          {PANELS.map((panel) => (
            <button
              key={panel.key}
              type="button"
              className={`v3-mega-tab${open === panel.key ? " is-open" : ""}${
                "accent" in panel && panel.accent ? " is-accent" : ""
              }`}
              aria-expanded={open === panel.key}
              onMouseEnter={() => setOpen(panel.key)}
              onFocus={() => setOpen(panel.key)}
              onClick={() => setOpen(panel.key)}
            >
              {panel.label}
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="v3-mega-quick">
          <Link href="/category/racing-gear">Racing</Link>
          <Link href="#my-bike">Bike Finder</Link>
        </div>
      </div>

      <div className="v3-mega-panel">
        <div className="v3-mega-panel-inner">
          <Link href={active.href} className="v3-mega-feature">
            <span>{active.eyebrow}</span>
            <strong>{active.title}</strong>
            <em>Άνοιγμα συλλογής →</em>
          </Link>
          <div className="v3-mega-columns">
            {active.columns.map((column) => (
              <div key={column.title} className="v3-mega-col">
                <h3>{column.title}</h3>
                {column.links.map(([label, href]) => (
                  <Link key={label} href={href}>
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
