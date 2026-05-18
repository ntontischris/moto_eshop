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
    <div className="v3-utility-bar">
      <LangToggle />
      <nav className="v3-utility-links" aria-label="Βοηθητική πλοήγηση">
        <a href="#">Λογαριασμός</a>
        <a href="#">Λίστα επιθυμιών</a>
        <a href="#">Παρακολούθηση παραγγελίας</a>
        <a href="#">Βοήθεια</a>
      </nav>
    </div>
  );
}
