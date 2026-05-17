"use client";

import { useV3 } from "./v3-provider";

function LangToggle() {
  const { lang, setLang } = useV3();
  return (
    <button
      onClick={() => setLang(lang === "el" ? "en" : "el")}
      aria-label="Εναλλαγή γλώσσας"
      style={{
        background: "none",
        border: "1px solid var(--v3-line)",
        borderRadius: 4,
        color: "var(--v3-bone-dim)",
        cursor: "pointer",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.08em",
        padding: "2px 8px",
        transition: "color .15s, border-color .15s",
      }}
    >
      {lang === "el" ? "EN" : "ΕΛ"}
    </button>
  );
}

export function UtilityBar() {
  return (
    <>
      <style>{`
        .v3-utility-bar {
          background: var(--v3-graphite);
          border-bottom: 1px solid var(--v3-line);
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 var(--v3-gutter);
          font-size: 12px;
          color: var(--v3-bone-dim);
          gap: 12px;
        }
        .v3-utility-links {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        .v3-utility-links a {
          color: var(--v3-bone-dim);
          text-decoration: none;
          font-size: 12px;
          transition: color .15s;
        }
        .v3-utility-links a:hover { color: var(--v3-bone); }
        .v3-utility-links a:focus-visible {
          outline: 2px solid var(--v3-cyan);
          outline-offset: 2px;
          border-radius: 2px;
        }
      `}</style>
      <div className="v3-utility-bar">
        <LangToggle />
        <nav className="v3-utility-links" aria-label="Βοηθητική πλοήγηση">
          <a href="#">Λογαριασμός</a>
          <a href="#">Λίστα επιθυμιών</a>
          <a href="#">Παρακολούθηση παραγγελίας</a>
          <a href="#">Βοήθεια</a>
        </nav>
      </div>
    </>
  );
}
