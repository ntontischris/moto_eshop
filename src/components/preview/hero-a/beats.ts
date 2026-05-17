import type { ReactNode } from "react";

export interface BeatCta {
  label: string;
  href: string;
  variant?: "primary" | "ghost";
}

export interface Beat {
  /** Progress range [fadeIn, fadeOut] within the section (0..1). */
  range: [number, number];
  position: "center" | "left" | "right";
  eyebrow: string;
  title: ReactNode;
  body: string;
  ctas: BeatCta[];
}
