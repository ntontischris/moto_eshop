"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { MEGA_MENU_CLOSE_DELAY_MS, MEGA_MENU_PANELS } from "./mega-menu-data";

type PanelKey = (typeof MEGA_MENU_PANELS)[number]["key"];

export function MegaMenu() {
  const [open, setOpen] = useState<PanelKey>(MEGA_MENU_PANELS[0].key);
  const [isExpanded, setIsExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const active =
    MEGA_MENU_PANELS.find((panel) => panel.key === open) ?? MEGA_MENU_PANELS[0];

  function clearCloseTimer() {
    if (!closeTimer.current) return;
    clearTimeout(closeTimer.current);
    closeTimer.current = null;
  }

  function openMenu(panelKey?: PanelKey) {
    clearCloseTimer();
    if (panelKey) setOpen(panelKey);
    setIsExpanded(true);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setIsExpanded(false);
      setOpen(MEGA_MENU_PANELS[0].key);
      closeTimer.current = null;
    }, MEGA_MENU_CLOSE_DELAY_MS);
  }

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  return (
    <nav
      className={`v3-mega-bar v3-mega-bar--reconstructed${
        isExpanded ? " is-expanded" : ""
      }`}
      aria-label="Κύρια πλοήγηση"
      onMouseEnter={() => openMenu()}
      onMouseLeave={scheduleClose}
      onFocus={() => openMenu()}
    >
      <div className="v3-mega-inner">
        <div className="v3-mega-tabs" role="menubar">
          {MEGA_MENU_PANELS.map((panel) => (
            <button
              key={panel.key}
              type="button"
              className={`v3-mega-tab${open === panel.key ? " is-open" : ""}${
                panel.accent ? " is-accent" : ""
              }`}
              aria-expanded={open === panel.key}
              onMouseEnter={() => openMenu(panel.key)}
              onFocus={() => openMenu(panel.key)}
              onClick={() => openMenu(panel.key)}
            >
              {panel.label}
              <ChevronDown size={14} aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="v3-mega-quick">
          <Link href="/category/prosfores">Προσφορές</Link>
          <Link href="#my-bike">Bike Finder</Link>
        </div>
      </div>

      <div className="v3-mega-panel" onMouseEnter={() => openMenu(open)}>
        <div className="v3-mega-panel-inner">
          <Link href={active.href} className="v3-mega-feature">
            <Image
              key={active.image}
              src={active.image}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 420px"
              className="v3-mega-feature-img"
              loading="lazy"
              fetchPriority="low"
              unoptimized
            />
            <span className="v3-mega-feature-shade" aria-hidden="true" />
            <span className="v3-mega-feature-content">
              <span>{active.eyebrow}</span>
              <strong>{active.title}</strong>
              <em>
                Άνοιγμα κατηγορίας <ArrowRight size={15} aria-hidden="true" />
              </em>
            </span>
          </Link>

          <div className="v3-mega-content">
            <div className="v3-mega-shortcuts" aria-label="Γρήγορες επιλογές">
              {active.quickLinks.map((link) => (
                <Link key={link.label} href={link.href} className="v3-mega-shortcut">
                  <strong>{link.label}</strong>
                  {link.meta && <span>{link.meta}</span>}
                </Link>
              ))}
            </div>

            <div className="v3-mega-columns">
              {active.columns.map((column) => (
                <div key={column.title} className="v3-mega-col">
                  <h3>{column.title}</h3>
                  {column.links.map((link) => (
                    <Link key={link.label} href={link.href}>
                      {link.label}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
