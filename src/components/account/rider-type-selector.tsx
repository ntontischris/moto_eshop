"use client";

import { cn } from "@/lib/utils";

type RiderType = "beginner" | "intermediate" | "advanced" | "professional";

interface RiderOption {
  value: RiderType;
  label: string;
  description: string;
}

const RIDER_OPTIONS: RiderOption[] = [
  { value: "beginner", label: "Αρχάριος", description: "Νέος στη μοτοσυκλέτα" },
  {
    value: "intermediate",
    label: "Ενδιάμεσος",
    description: "Μερικά χρόνια εμπειρία",
  },
  {
    value: "advanced",
    label: "Προχωρημένος",
    description: "Πολλά χρόνια εμπειρία",
  },
  {
    value: "professional",
    label: "Επαγγελματίας",
    description: "Αγώνες ή επαγγελματική χρήση",
  },
];

interface RiderTypeSelectorProps {
  value: RiderType | null;
  onChange: (value: RiderType) => void;
  disabled?: boolean;
}

export function RiderTypeSelector({
  value,
  onChange,
  disabled = false,
}: RiderTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {RIDER_OPTIONS.map((option) => {
        const isSelected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all",
              "hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              isSelected
                ? "border-foreground bg-accent"
                : "border-border bg-background text-muted-foreground",
              disabled && "cursor-not-allowed opacity-50",
            )}
            aria-pressed={isSelected}
          >
            <span
              className={cn(
                "text-sm font-semibold",
                isSelected ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {option.label}
            </span>
            <span className="text-xs leading-tight text-muted-foreground">
              {option.description}
            </span>
          </button>
        );
      })}
    </div>
  );
}
