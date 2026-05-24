/* Shared shell for auth screens (login/register) — one styled card, one
   <style> block (single-instance pages, no payload concern). */

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="v3-auth">
      <div className="v3-auth-card">
        <span className="v3-auth-kicker">MotoMarket</span>
        <h1 className="v3-display">{title}</h1>
        {subtitle && <p className="v3-auth-sub">{subtitle}</p>}
        {children}
      </div>
      <style precedence="default">{`
        .v3-auth { min-height: 70vh; display: flex; align-items: center;
          justify-content: center; padding: 60px var(--v3-gutter); }
        .v3-auth-card { width: 100%; max-width: 420px;
          background: var(--v3-surface); border: 1px solid var(--v3-line);
          padding: 36px 32px;
          clip-path: polygon(0 0,100% 0,100% calc(100% - 18px),
            calc(100% - 18px) 100%,0 100%); }
        .v3-auth-kicker { font-family: var(--v3-display); font-weight: 800;
          font-size: .72rem; letter-spacing: .2em; text-transform: uppercase;
          color: var(--v3-red); }
        .v3-auth-card h1 { margin: 8px 0 0; font-size: clamp(1.8rem,5vw,2.6rem);
          font-weight: 900; text-transform: uppercase; transform: skewX(-6deg);
          color: var(--v3-bone); }
        .v3-auth-sub { margin: 8px 0 0; color: var(--v3-bone-dim);
          font-size: .9rem; }
        .v3-auth-form { display: flex; flex-direction: column; gap: 14px;
          margin-top: 26px; }
        .v3-auth-field { display: flex; flex-direction: column; gap: 6px; }
        .v3-auth-field span { font-size: .8rem; color: var(--v3-bone-dim);
          font-weight: 600; }
        .v3-auth-field input { background: var(--v3-graphite);
          border: 1px solid var(--v3-line); border-radius: 8px; padding: 12px;
          color: var(--v3-bone); font-family: var(--v3-font);
          font-size: .92rem; }
        .v3-auth-field input:focus { outline: 2px solid var(--v3-cyan);
          outline-offset: 1px; }
        .v3-auth-terms { display: flex; gap: 8px; align-items: flex-start;
          font-size: .8rem; color: var(--v3-bone-dim); }
        .v3-auth-terms input { margin-top: 2px; }
        .v3-auth-err { margin: 2px 0 0; color: #fff;
          background: var(--v3-red); padding: 10px 12px; border-radius: 8px;
          font-size: .84rem; }
        .v3-auth-ok { margin: 2px 0 0; color: var(--v3-carbon);
          background: var(--v3-green); padding: 10px 12px; border-radius: 8px;
          font-size: .84rem; }
        .v3-auth-submit { display: flex; justify-content: center;
          width: 100%; margin-top: 4px; }
        .v3-auth-submit:disabled { opacity: .6; cursor: progress; }
        .v3-auth-alt { margin: 20px 0 0; font-size: .86rem;
          color: var(--v3-bone-dim); text-align: center; }
        .v3-auth-alt a { color: var(--v3-cyan); text-decoration: none;
          font-weight: 600; }
        .v3-auth-alt a:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
