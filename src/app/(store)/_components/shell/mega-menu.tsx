"use client";

import Link from "next/link";
import { useRef, useState, useCallback, useEffect } from "react";
import { NAV } from "@/lib/nav-data";
import type { NavRoot, NavL2 } from "@/lib/nav-data";

const MAX_L3 = 7;

function L2Column({ l2 }: { l2: NavL2 }) {
  const visible = l2.children.slice(0, MAX_L3);
  const overflow = l2.children.length - MAX_L3;

  return (
    <div className="v3-mm-col">
      <Link href={`/category/${l2.slug}`} className="v3-mm-col-head">
        {l2.el}
      </Link>
      {visible.map((l3) => (
        <Link
          key={l3.slug}
          href={`/category/${l3.slug}`}
          className="v3-mm-l3-link"
        >
          {l3.el}
        </Link>
      ))}
      {overflow > 0 && (
        <Link
          href={`/category/${l2.slug}`}
          className="v3-mm-l3-link v3-mm-more"
        >
          +{overflow} ακόμη
        </Link>
      )}
    </div>
  );
}

function RootItem({
  root,
  isOpen,
  onOpen,
  onClose,
}: {
  root: NavRoot;
  isOpen: boolean;
  onOpen(): void;
  onClose(): void;
}) {
  const hasPanel = !root.sale && root.children.length > 0;

  if (!hasPanel) {
    return (
      <Link
        href={`/category/${root.slug}`}
        className={`v3-mm-root-link${root.sale ? " v3-mm-sale" : ""}`}
      >
        {root.el}
      </Link>
    );
  }

  return (
    <div
      className="v3-mm-root-item"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        className={`v3-mm-root-btn${isOpen ? " is-open" : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        onFocus={onOpen}
        onClick={() => (isOpen ? onClose() : onOpen())}
      >
        {root.el}
        <span className="v3-mm-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {/* Panel content is mounted ONLY when open — keeps the full NAV tree
          (hundreds of nodes) out of the SSR HTML / RSC payload / hydration
          on every page. NAV is already in the JS bundle (static import). */}
      {isOpen && (
        <div className="v3-mm-panel" role="region">
          <div className="v3-mm-panel-inner">
            {root.children.map((l2) => (
              <L2Column key={l2.slug} l2={l2} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function MegaMenu() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => setOpenSlug(null), []);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose]);

  // Close when focus leaves the bar
  useEffect(() => {
    function onFocusOut(e: FocusEvent) {
      if (barRef.current && !barRef.current.contains(e.relatedTarget as Node)) {
        handleClose();
      }
    }
    const el = barRef.current;
    el?.addEventListener("focusout", onFocusOut);
    return () => el?.removeEventListener("focusout", onFocusOut);
  }, [handleClose]);

  return (
    <nav className="v3-mega-bar" aria-label="Κύρια πλοήγηση" ref={barRef}>
      <div className="v3-mega-inner">
        {NAV.map((root) => (
          <RootItem
            key={root.slug}
            root={root}
            isOpen={openSlug === root.slug}
            onOpen={() => setOpenSlug(root.slug)}
            onClose={handleClose}
          />
        ))}
      </div>
    </nav>
  );
}
