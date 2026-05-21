import type { CSSProperties } from "react";

export type Tone = "neutral" | "tech" | "promo";

interface BadgeProps {
  label: string;
  tone?: Tone;
}

const TONE_STYLES: Record<Tone, CSSProperties> = {
  neutral: {
    background: "rgba(169,170,176,0.12)",
    color: "var(--v3-bone-dim)",
    border: "1px solid rgba(169,170,176,0.18)",
  },
  tech: {
    background: "rgba(47,181,196,0.12)",
    color: "var(--v3-cyan)",
    border: "1px solid rgba(47,181,196,0.22)",
  },
  promo: {
    background: "rgba(225,29,46,0.14)",
    color: "var(--v3-red)",
    border: "1px solid rgba(225,29,46,0.22)",
  },
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "0.68rem",
        fontWeight: 600,
        letterSpacing: 0,
        lineHeight: 1.6,
        whiteSpace: "nowrap",
        fontFamily: "var(--v3-font)",
        ...TONE_STYLES[tone],
      }}
    >
      {label}
    </span>
  );
}
