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
    <>
      <style>{`
        .v3-mega-bar {
          background: var(--v3-graphite);
          border-bottom: 1px solid var(--v3-line);
          position: sticky;
          top: 77px; /* height of header */
          z-index: 190;
        }
        .v3-mega-inner {
          display: flex;
          align-items: center;
          gap: 2px;
          padding: 0 var(--v3-gutter);
          max-width: 1440px;
          margin: 0 auto;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .v3-mega-inner::-webkit-scrollbar { display: none; }
        .v3-mm-root-item { position: relative; }
        .v3-mm-root-btn, .v3-mm-root-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          color: var(--v3-bone-dim);
          cursor: pointer;
          font-family: var(--v3-font);
          font-size: 13px;
          font-weight: 500;
          padding: 14px 12px;
          text-decoration: none;
          white-space: nowrap;
          transition: color .15s;
        }
        .v3-mm-root-btn:hover, .v3-mm-root-link:hover,
        .v3-mm-root-btn.is-open { color: var(--v3-bone); }
        .v3-mm-root-btn:focus-visible, .v3-mm-root-link:focus-visible {
          outline: 2px solid var(--v3-cyan);
          outline-offset: -2px;
          border-radius: 4px;
        }
        .v3-mm-sale { color: var(--v3-red) !important; font-weight: 700; }
        .v3-mm-chevron {
          font-size: 10px;
          transition: transform .15s;
        }
        .v3-mm-root-btn.is-open .v3-mm-chevron { transform: rotate(180deg); }
        .v3-mm-panel {
          position: absolute;
          top: 100%;
          left: 0;
          min-width: 560px;
          max-width: 900px;
          background: var(--v3-surface);
          border: 1px solid var(--v3-line);
          border-top: none;
          border-radius: 0 0 var(--v3-radius) var(--v3-radius);
          box-shadow: var(--v3-shadow);
          overflow: hidden;
          z-index: 191;
          animation: v3-mm-in .14s ease both;
        }
        @keyframes v3-mm-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .v3-mm-panel { animation: none; }
          .v3-mm-chevron { transition: none; }
        }
        .v3-mm-panel-inner {
          display: flex;
          flex-wrap: wrap;
          gap: 0;
          padding: 24px 20px;
        }
        .v3-mm-col {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 160px;
          padding: 0 20px 16px 0;
        }
        .v3-mm-col-head {
          color: var(--v3-bone);
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--v3-line);
          margin-bottom: 4px;
          display: block;
        }
        .v3-mm-col-head:hover { color: var(--v3-cyan); }
        .v3-mm-col-head:focus-visible {
          outline: 2px solid var(--v3-cyan);
          outline-offset: 2px;
          border-radius: 2px;
        }
        .v3-mm-l3-link {
          color: var(--v3-bone-dim);
          font-size: 12px;
          text-decoration: none;
          padding: 3px 0;
          transition: color .12s;
          display: block;
        }
        .v3-mm-l3-link:hover { color: var(--v3-bone); }
        .v3-mm-l3-link:focus-visible {
          outline: 2px solid var(--v3-cyan);
          outline-offset: 2px;
          border-radius: 2px;
        }
        .v3-mm-more { color: var(--v3-cyan); font-style: italic; }
        @media (max-width: 860px) { .v3-mega-bar { display: none; } }
      `}</style>

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
    </>
  );
}
