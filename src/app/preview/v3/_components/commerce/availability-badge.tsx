interface AvailabilityBadgeProps {
  stock: number;
}

export function AvailabilityBadge({ stock }: AvailabilityBadgeProps) {
  const available = stock > 0;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "5px",
        fontSize: "0.72rem",
        fontWeight: 600,
        fontFamily: "var(--v3-font)",
        color: available ? "var(--v3-green)" : "var(--v3-bone-dim)",
      }}
    >
      {/* Dot indicator — color as secondary cue, text is primary */}
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: "6px",
          height: "6px",
          borderRadius: "50%",
          background: available ? "var(--v3-green)" : "var(--v3-bone-dim)",
          flexShrink: 0,
        }}
      />
      {available ? "Διαθέσιμο" : "Εξαντλημένο"}
    </span>
  );
}
