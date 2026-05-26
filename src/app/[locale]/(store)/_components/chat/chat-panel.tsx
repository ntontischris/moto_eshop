"use client";

import { useChatContext } from "./chat-provider";
import { ChatMessages } from "./chat-messages";
import { ChatComposer } from "./chat-composer";
import styles from "./chat.module.css";

interface Props {
  onClose: () => void;
}

export function ChatPanel({ onClose }: Props) {
  const { chat } = useChatContext();
  const isBusy = chat.status === "submitted" || chat.status === "streaming";

  return (
    <div
      className={styles.panel}
      role="dialog"
      aria-label="Συνομιλία με τον Πιτ"
    >
      <header className={styles.header}>
        <span>Πιτ · online</span>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Κλείσιμο"
          onClick={onClose}
        >
          ✕
        </button>
      </header>
      <ChatMessages messages={chat.messages} />
      <ChatComposer
        disabled={isBusy}
        onSend={(text) => {
          chat.sendMessage({ text });
        }}
      />
    </div>
  );
}
