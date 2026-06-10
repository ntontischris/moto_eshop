"use client";

import { useEffect, useRef, useState } from "react";
import { Bike, ShoppingBag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { isStickyCtaVisible } from "../../_lib/hud";

/* MobileCtaBar — mobile-only sticky mini-CTA (hidden >=861px via CSS). It floats
   just above the bottom mobile nav, appears once the visitor scrolls past the
   hero, and hides again as the footer comes into view so it never covers the
   footer. Both actions are real links with labels (not decorative). Reserved
   space avoids CLS; safe-area insets keep it clear of the home indicator.
   Entrance animation is dropped under reduced-motion (CSS). */

const HERO_SELECTOR = "[data-hero-entrance]";
const FOOTER_SELECTOR = ".v3-footer";

export function MobileCtaBar({
  shopLabel,
  bikeLabel,
}: {
  shopLabel: string;
  bikeLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  const rafRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia("(max-width: 860px)").matches) return;

    const hero = document.querySelector<HTMLElement>(HERO_SELECTOR);
    const footer = document.querySelector<HTMLElement>(FOOTER_SELECTOR);

    const update = () => {
      rafRef.current = 0;
      const heroBottom = hero
        ? hero.offsetTop + hero.offsetHeight
        : window.innerHeight;
      const footerTop = footer
        ? footer.offsetTop
        : document.documentElement.scrollHeight;
      setVisible(
        isStickyCtaVisible({
          scrollY: window.scrollY,
          heroBottom,
          footerTop,
          viewportHeight: window.innerHeight,
        }),
      );
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className={`v3-cta-bar${visible ? " is-visible" : ""}`}
      data-visible={visible}
      aria-hidden={!visible}
    >
      <Link
        href="/category/eksoplismos-anabath"
        className="v3-cta-bar-btn v3-cta-bar-btn--primary"
        tabIndex={visible ? undefined : -1}
      >
        <ShoppingBag size={18} aria-hidden="true" />
        <span>{shopLabel}</span>
      </Link>
      <a
        href="#my-bike"
        className="v3-cta-bar-btn v3-cta-bar-btn--ghost"
        tabIndex={visible ? undefined : -1}
      >
        <Bike size={18} aria-hidden="true" />
        <span>{bikeLabel}</span>
      </a>
    </div>
  );
}
