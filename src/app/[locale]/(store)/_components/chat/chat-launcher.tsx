"use client";

import { useChatContext } from "./chat-provider";
import { ChatPanel } from "./chat-panel";
import {
  suppressAutoOpenFor24h,
  usePageViewCounter,
} from "./use-page-view-counter";
import styles from "./chat.module.css";

export function ChatLauncher() {
  const { isOpen, open, close } = useChatContext();

  usePageViewCounter({ onAutoOpenTrigger: open });

  return (
    <>
      {!isOpen && (
        <button
          type="button"
          className={styles.launcher}
          aria-label="Άνοιξε τη συνομιλία με τον Πιτ"
          onClick={open}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M21 12a8 8 0 0 1-12.83 6.4L3 20l1.5-4.5A8 8 0 1 1 21 12Z"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
      {isOpen && (
        <ChatPanel
          onClose={() => {
            suppressAutoOpenFor24h();
            close();
          }}
        />
      )}
    </>
  );
}
