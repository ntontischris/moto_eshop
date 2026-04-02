import { Truck, Shield, Lock, Star } from "lucide-react";
import { Container } from "@/components/layout/container";

const TRUST_ITEMS = [
  { icon: Truck, label: "Δωρεάν Αποστολή", detail: "Για αγορές άνω των 80€" },
  { icon: Shield, label: "Εγγύηση", detail: "Σε όλα τα προϊόντα" },
  { icon: Lock, label: "Ασφαλείς Πληρωμές", detail: "SSL & 3D Secure" },
  { icon: Star, label: "5000+ Reviews", detail: "Από ικανοποιημένους πελάτες" },
];

export const TrustBar = () => (
  <section className="border-y border-border-default bg-bg-surface py-6">
    <Container>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
        {TRUST_ITEMS.map(({ icon: Icon, label, detail }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
              <Icon className="h-5 w-5 text-brand-red" />
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
