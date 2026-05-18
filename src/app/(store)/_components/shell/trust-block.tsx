/* TrustBlock — static reassurance band (Server Component). Only true claims. */

const ITEMS: { title: string; line: string; icon: React.ReactNode }[] = [
  {
    title: "Γρήγορη αποστολή",
    line: "Παράδοση 1–3 εργάσιμες σε όλη την Ελλάδα.",
    icon: (
      <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7zM7 19a2 2 0 100-4 2 2 0 000 4zM18 19a2 2 0 100-4 2 2 0 000 4z" />
    ),
  },
  {
    title: "Επίσημοι προμηθευτές",
    line: "Γνήσια προϊόντα από εξουσιοδοτημένα brands.",
    icon: <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />,
  },
  {
    title: "Αλλαγές & επιστροφές",
    line: "Εύκολη αλλαγή μεγέθους εντός 14 ημερών.",
    icon: (
      <path d="M4 9a8 8 0 0114-5l2 2M20 15a8 8 0 01-14 5l-2-2M4 4v6h6M20 20v-6h-6" />
    ),
  },
  {
    title: "Ασφαλείς πληρωμές",
    line: "Κρυπτογραφημένες συναλλαγές, πολλαπλοί τρόποι.",
    icon: <path d="M6 10V8a6 6 0 0112 0v2M5 10h14v10H5zM12 14v3" />,
  },
  {
    title: "Παραλαβή από κατάστημα",
    line: "Δυνατότητα παραλαβής από το φυσικό κατάστημα.",
    icon: (
      <path d="M4 9l1-5h14l1 5M4 9h16v11H4zM4 9a3 3 0 006 0 3 3 0 006 0 3 3 0 004 0M10 20v-5h4v5" />
    ),
  },
];

export function TrustBlock() {
  return (
    <section className="v3-trust" aria-label="Γιατί MotoMarket">
      <div className="v3-trust-grid">
        {ITEMS.map((it) => (
          <div key={it.title} className="v3-trust-cell">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {it.icon}
            </svg>
            <h3>{it.title}</h3>
            <p>{it.line}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
