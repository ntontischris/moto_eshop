import { CustomerServiceSidebar } from "./_components/cs-sidebar";

/** Shared shell for the "Εξυπηρέτηση Πελατών" section: a left sidebar nav
 *  + content column, in the v3 "Industrial Race" surface. Pages render their
 *  own <article className="cs-article">. */
export default function CustomerServiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="cs-shell">
      <div className="cs-inner">
        <aside className="cs-aside">
          <CustomerServiceSidebar />
        </aside>
        <div className="cs-main">{children}</div>
      </div>
      <CsStyles />
    </div>
  );
}

function CsStyles() {
  return (
    <style precedence="default">{`
      .cs-shell { padding: 28px var(--v3-gutter) 96px; }
      .cs-inner { max-width: 1180px; margin: 0 auto;
        display: grid; grid-template-columns: 250px 1fr; gap: clamp(24px, 4vw, 56px);
        align-items: start; }

      /* sidebar */
      .cs-aside { position: sticky; top: 96px; }
      .cs-nav { display: flex; flex-direction: column; gap: 26px; }
      .cs-nav-group { display: flex; flex-direction: column; gap: 10px; }
      .cs-nav-title { color: var(--v3-bone-dim); margin: 0;
        padding-bottom: 8px; border-bottom: 1px solid var(--v3-line); }
      .cs-nav-list { list-style: none; margin: 0; padding: 0;
        display: flex; flex-direction: column; gap: 2px; }
      .cs-nav-link { display: block; text-decoration: none;
        padding: 9px 12px; border-left: 2px solid transparent;
        color: var(--v3-bone-dim); font-size: .92rem; font-weight: 600;
        border-radius: 0 var(--v3-radius) var(--v3-radius) 0;
        transition: color .14s ease, background .14s ease, border-color .14s ease; }
      .cs-nav-link:hover { color: var(--v3-bone); background: var(--v3-surface); }
      .cs-nav-link.is-active { color: var(--v3-bone);
        background: var(--v3-surface-2); border-left-color: var(--v3-red); }
      .cs-nav-link:focus-visible { outline: 2px solid var(--v3-cyan);
        outline-offset: 2px; }

      /* content */
      .cs-main { min-width: 0; }
      .cs-article { color: var(--v3-bone-dim); max-width: 760px; }
      .cs-article h1 { margin: 0 0 8px; color: var(--v3-bone);
        font-family: var(--v3-display); font-weight: 900; line-height: .95;
        text-transform: uppercase; transform: skewX(-6deg);
        font-size: clamp(1.9rem, 5vw, 3rem); }
      .cs-lead { color: var(--v3-bone); font-size: 1.05rem;
        margin: 0 0 28px; max-width: 60ch; }
      .cs-article h2 { color: var(--v3-bone); font-family: var(--v3-display);
        font-weight: 800; text-transform: uppercase; letter-spacing: .01em;
        font-size: 1.18rem; margin: 34px 0 12px; }
      .cs-article h3 { color: var(--v3-bone); font-weight: 800;
        font-size: 1rem; margin: 22px 0 8px; }
      .cs-article p { line-height: 1.7; margin: 0 0 14px; }
      .cs-article a { color: var(--v3-cyan); text-decoration: none; }
      .cs-article a:hover { text-decoration: underline; }
      .cs-article ul { margin: 0 0 16px; padding-left: 20px;
        line-height: 1.7; }
      .cs-article li { margin-bottom: 6px; }
      .cs-article strong { color: var(--v3-bone); font-weight: 700; }
      /* verbatim body — preserves source line breaks */
      .cs-prose { white-space: pre-line; line-height: 1.7; }
      .cs-note { border-left: 2px solid var(--v3-cyan);
        background: var(--v3-surface); padding: 12px 16px; margin: 18px 0;
        border-radius: 0 var(--v3-radius) var(--v3-radius) 0;
        font-size: .92rem; }
      .cs-updated { margin-top: 40px; padding-top: 16px;
        border-top: 1px solid var(--v3-line); font-size: .82rem;
        color: var(--v3-bone-dim); }

      @media (max-width: 880px) {
        .cs-inner { grid-template-columns: 1fr; gap: 28px; }
        .cs-aside { position: static; }
        .cs-nav { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
      }
    `}</style>
  );
}
