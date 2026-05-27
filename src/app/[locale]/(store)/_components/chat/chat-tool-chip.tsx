"use client";

import styles from "./chat.module.css";

interface Props {
  icon: string;
  label: string;
  detail?: string;
  variant?: "info" | "success" | "warning";
}

export function ChatToolChip({ icon, label, detail, variant = "info" }: Props) {
  const variantClass =
    variant === "success"
      ? styles.toolChipSuccess
      : variant === "warning"
        ? styles.toolChipWarning
        : "";
  return (
    <div className={`${styles.toolChip} ${variantClass}`.trim()} role="status">
      <span aria-hidden="true">{icon}</span>
      <span className={styles.toolChipLabel}>{label}</span>
      {detail && <span className={styles.toolChipDetail}>{detail}</span>}
    </div>
  );
}
