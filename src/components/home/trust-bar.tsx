import { Truck, RotateCcw, BadgeCheck, ShieldCheck } from "lucide-react";

interface TrustItem {
  icon: string;
  label: string;
  detail: string;
}

const DEFAULTS: TrustItem[] = [
  {
    icon: "truck",
    label: "Δωρεάν αποστολή",
    detail: "Για παραγγελίες άνω των €50",
  },
  { icon: "rotate", label: "30 ημέρες επιστροφή", detail: "Χωρίς ερωτήσεις" },
  { icon: "badge", label: "100% αυθεντικά", detail: "Επίσημοι αντιπρόσωποι" },
  {
    icon: "shield",
    label: "Εγγύηση τιμής",
    detail: "Βρες το φθηνότερα; Σου επιστρέφουμε",
  },
];

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  truck: Truck,
  rotate: RotateCcw,
  badge: BadgeCheck,
  shield: ShieldCheck,
};

export function TrustBar({ items }: { items: TrustItem[] }) {
  const list = items.length > 0 ? items : DEFAULTS;
  return (
    <section className="border-y border-neutral-800 bg-[#0a0a0a]">
      <div className="container mx-auto grid grid-cols-2 gap-px bg-neutral-800 md:grid-cols-4">
        {list.map((it) => {
          const Icon = ICONS[it.icon] ?? BadgeCheck;
          return (
            <div
              key={it.label}
              className="group flex items-center gap-3 bg-[#0a0a0a] px-4 py-5 transition hover:bg-neutral-900"
            >
              <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-full bg-brand-red/10 text-brand-red transition group-hover:bg-brand-red group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold uppercase tracking-wide text-white">
                  {it.label}
                </p>
                <p className="truncate text-xs text-neutral-400">{it.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
