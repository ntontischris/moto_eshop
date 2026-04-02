import { Truck, Shield, Clock, Star } from "lucide-react";
import { Container } from "@/components/layout/container";

const TRUST_ITEMS = [
  { icon: Truck, label: "Δωρεάν Αποστολή", detail: "Για αγορές άνω των 50€" },
  {
    icon: Shield,
    label: "Επίσημος Αντιπρόσωπος",
    detail: "Εγγυημένα προϊόντα",
  },
  { icon: Clock, label: "Άμεση Αποστολή", detail: "Σε 1 εργάσιμη ημέρα" },
  { icon: Star, label: "5000+ Reviews", detail: "Ικανοποιημένοι πελάτες" },
];

export const TrustBar = () => (
  <section className="border-y border-border-default bg-bg-surface py-6">
    <Container>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
        {TRUST_ITEMS.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-teal/10">
              <Icon className="h-5 w-5 text-brand-teal" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">{label}</p>
              <p className="text-xs text-text-muted">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Container>
  </section>
);
