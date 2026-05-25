"use client";

import { Link } from "@/i18n/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { NAV } from "@/lib/nav-data";
import type { NavRoot } from "@/lib/nav-data";
import { navLabel } from "@/lib/nav-i18n";
import { useV3 } from "./v3-provider";
import { LanguageSwitcher } from "./language-switcher";

interface CategoryDrawerProps {
  open: boolean;
  onClose(): void;
}

export function CategoryDrawer({ open, onClose }: CategoryDrawerProps) {
  const t = useTranslations("shell");
  const locale = useLocale();
  const { mode, toggleMode } = useV3();
  const [expanded, setExpanded] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setExpanded(null);
    onClose();
  }, [onClose]);

  // Focus-on-open
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => closeRef.current?.focus(), 50);
    return () => clearTimeout(id);
  }, [open]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") handleClose();
      // Basic focus trap
      if (e.key === "Tab" && drawerRef.current) {
        const focusable = Array.from(
          drawerRef.current.querySelectorAll<HTMLElement>(
            "button, a, [tabindex]:not([tabindex='-1'])",
          ),
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [open, handleClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          aria-hidden="true"
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.7)",
            zIndex: 498,
          }}
        />
      )}

      <div
        ref={drawerRef}
        role="dialog"
        aria-label={t("categoriesLabel")}
        aria-modal="true"
        aria-hidden={!open}
        style={{
          position: "fixed",
          inset: 0,
          bottom: 60,
          background: "var(--v3-surface)",
          zIndex: 499,
          overflowY: "auto",
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .2s ease",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--v3-line)",
            position: "sticky",
            top: 0,
            background: "var(--v3-graphite)",
          }}
        >
          <span style={{ fontWeight: 700, color: "var(--v3-bone)" }}>
            {t("categoriesLabel")}
          </span>
          <button
            ref={closeRef}
            onClick={handleClose}
            aria-label={t("categoriesLabel")}
            style={{
              background: "none",
              border: "none",
              color: "var(--v3-bone-dim)",
              cursor: "pointer",
              fontSize: 22,
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        <div className="v3-drawer-settings">
          <button
            type="button"
            className="v3-drawer-theme"
            onClick={toggleMode}
            aria-label={
              mode === "dark" ? t("headerLightMode") : t("headerDarkMode")
            }
          >
            {mode === "dark" ? (
              <Sun size={16} aria-hidden="true" />
            ) : (
              <Moon size={16} aria-hidden="true" />
            )}
            <span>{mode === "dark" ? "Light" : "Dark"}</span>
          </button>
          <LanguageSwitcher onSwitch={handleClose} />
        </div>

        <ul style={{ listStyle: "none", margin: 0, padding: "8px 0" }}>
          {NAV.map((root: NavRoot) => (
            <li key={root.slug}>
              <button
                onClick={() =>
                  setExpanded(expanded === root.slug ? null : root.slug)
                }
                aria-expanded={expanded === root.slug}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid var(--v3-line)",
                  color: root.sale ? "var(--v3-red)" : "var(--v3-bone)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontFamily: "var(--v3-font)",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "14px 20px",
                  textAlign: "left",
                }}
              >
                {navLabel(root.el, locale)}
                {root.children.length > 0 && (
                  <span style={{ fontSize: 12, color: "var(--v3-bone-dim)" }}>
                    {expanded === root.slug ? "▴" : "▾"}
                  </span>
                )}
              </button>

              {expanded === root.slug && root.children.length > 0 && (
                <ul
                  style={{
                    listStyle: "none",
                    margin: 0,
                    padding: "0 0 8px 0",
                    background: "var(--v3-carbon)",
                  }}
                >
                  {root.children.map((l2) => (
                    <li key={l2.slug}>
                      <Link
                        href={`/category/${l2.slug}`}
                        onClick={handleClose}
                        style={{
                          display: "block",
                          color: "var(--v3-bone-dim)",
                          textDecoration: "none",
                          fontSize: 13,
                          padding: "10px 20px 10px 32px",
                          borderBottom: "1px solid var(--v3-line)",
                        }}
                      >
                        {navLabel(l2.el, locale)}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
