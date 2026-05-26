"use client";

import type { UIMessage } from "ai";
import styles from "./chat.module.css";

interface Props {
  messages: UIMessage[];
}

export function ChatMessages({ messages }: Props) {
  return (
    <div className={styles.messages} role="log" aria-live="polite">
      {messages.length === 0 && (
        <div className={`${styles.bubble} ${styles.bubbleAssistant}`}>
          Γεια! Είμαι ο Πιτ. Τι μηχανή έχεις και τι ψάχνεις;
        </div>
      )}
      {messages.map((m) => {
        const text = m.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("");
        const cls =
          m.role === "user"
            ? `${styles.bubble} ${styles.bubbleUser}`
            : `${styles.bubble} ${styles.bubbleAssistant}`;
        return (
          <div key={m.id} className={cls}>
            {text || (m.role === "assistant" ? "..." : "")}
          </div>
        );
      })}
    </div>
  );
}
