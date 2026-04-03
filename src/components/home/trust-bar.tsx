import { Truck, Shield, Clock, Star, type LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/container";

const ICON_MAP: Record<string, LucideIcon> = {
  truck: Truck,
  shield: Shield,
  clock: Clock,
  star: Star,
};

interface TrustBarProps {
  items: { icon: string; label: string; detail: string }[];
}

export const TrustBar = ({ items }: TrustBarProps) => (
  <section className="border-y border-border-default bg-bg-surface py-6">
    <Container>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-8">
        {items.map(({ icon, label, detail }) => {
          const Icon = ICON_MAP[icon] ?? Star;
          return (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-teal/10">
                <Icon className="h-5 w-5 text-brand-teal" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  {label}
                </p>
                <p className="text-xs text-text-muted">{detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  </section>
);
