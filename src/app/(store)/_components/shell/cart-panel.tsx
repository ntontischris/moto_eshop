"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { useV3 } from "./v3-provider";
import { cartLineKey } from "./v3-provider";

export function CartPanel() {
  const { cart, cartOpen, setCartOpen } = useV3();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<Element | null>(null);

  // Capture the element that had focus before the panel opened
  useEffect(() => {
    if (cartOpen) {
      returnFocusRef.current = document.activeElement;
      // Move focus into the dialog after paint
      const id = setTimeout(() => closeRef.current?.focus(), 50);
      return () => clearTimeout(id);
    } else {
      // Restore focus to the trigger element when panel closes
      if (returnFocusRef.current instanceof HTMLElement) {
        returnFocusRef.current.focus();
      }
      returnFocusRef.current = null;
    }
  }, [cartOpen]);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (!cartOpen) return;

      if (e.key === "Escape") {
        setCartOpen(false);
        return;
      }

      if (e.key === "Tab" && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            "button:not([disabled]), a, [tabindex]:not([tabindex='-1'])",
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
    [cartOpen, setCartOpen],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  if (!cartOpen) return null;

  return (
    <div
      role="dialog"
      aria-label="Καλάθι αγορών"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      {/* backdrop */}
      <div
        onClick={() => setCartOpen(false)}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,.6)",
        }}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        style={{
          position: "relative",
          width: "min(420px, 100vw)",
          background: "var(--v3-surface)",
          borderLeft: "1px solid var(--v3-line)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "var(--v3-shadow)",
          overflowY: "auto",
        }}
      >
        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--v3-line)",
          }}
        >
          <span
            style={{ fontWeight: 700, fontSize: 16, color: "var(--v3-bone)" }}
          >
            Καλάθι
          </span>
          <button
            ref={closeRef}
            onClick={() => setCartOpen(false)}
            aria-label="Κλείσιμο καλαθιού"
            style={{
              background: "none",
              border: "none",
              color: "var(--v3-bone-dim)",
              cursor: "pointer",
              fontSize: 22,
              lineHeight: 1,
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        {/* body */}
        <div style={{ flex: 1, padding: "20px" }}>
          {cart.length === 0 ? (
            <p
              style={{
                color: "var(--v3-bone-dim)",
                textAlign: "center",
                marginTop: 40,
              }}
            >
              Το καλάθι είναι άδειο
            </p>
          ) : (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              {cart.map((line) => (
                <li
                  key={cartLineKey(line)}
                  style={{
                    display: "flex",
                    gap: 12,
                    borderBottom: "1px solid var(--v3-line)",
                    paddingBottom: 16,
                  }}
                >
                  {line.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={line.image}
                      alt={line.name}
                      width={64}
                      height={64}
                      style={{
                        objectFit: "cover",
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "var(--v3-bone)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {line.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--v3-bone-dim)",
                        marginTop: 2,
                      }}
                    >
                      {line.brand}
                    </div>
                    {line.size && (
                      <div
                        style={{ fontSize: 11, color: "var(--v3-bone-dim)" }}
                      >
                        Μέγεθος: {line.size}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 6,
                      }}
                    >
                      <span
                        style={{ fontSize: 12, color: "var(--v3-bone-dim)" }}
                      >
                        × {line.qty}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "var(--v3-bone)",
                        }}
                      >
                        {(line.price * line.qty).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* footer */}
        <div
          style={{
            padding: "16px 20px",
            borderTop: "1px solid var(--v3-line)",
          }}
        >
          <Link
            href="/cart"
            onClick={() => setCartOpen(false)}
            className="v3-btn-primary"
            style={{
              width: "100%",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            Δες καλάθι &amp; ολοκλήρωση
          </Link>
        </div>
      </div>
    </div>
  );
}
