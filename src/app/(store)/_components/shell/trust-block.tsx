import { CreditCard, Headphones, PackageCheck, RotateCcw, ShieldCheck } from "lucide-react";

const ITEMS = [
  {
    title: "Official supply",
    line: "Γνήσια προϊόντα από επιλεγμένους κατασκευαστές.",
    icon: ShieldCheck,
  },
  {
    title: "Fast delivery",
    line: "Αποστολές 1-3 εργάσιμες σε όλη την Ελλάδα.",
    icon: PackageCheck,
  },
  {
    title: "Fit confidence",
    line: "Αλλαγές μεγέθους για κράνη, μπουφάν, γάντια και μπότες.",
    icon: RotateCcw,
  },
  {
    title: "Secure checkout",
    line: "Καθαρή ροή πληρωμής και ασφαλείς συναλλαγές.",
    icon: CreditCard,
  },
  {
    title: "Rider support",
    line: "Τηλεφωνική βοήθεια για επιλογή προϊόντων.",
    icon: Headphones,
  },
];

export function TrustBlock() {
  return (
    <section className="v3-trust v3-trust--reconstructed" aria-label="Γιατί MotoMarket">
      <div className="v3-trust-head">
        <p className="v3-label">Trust</p>
        <h2 className="v3-display">Αγορά με σιγουριά.</h2>
      </div>
      <div className="v3-trust-grid">
        {ITEMS.map(({ title, line, icon: Icon }) => (
          <div key={title} className="v3-trust-cell">
            <Icon size={26} aria-hidden="true" />
            <h3>{title}</h3>
            <p>{line}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
