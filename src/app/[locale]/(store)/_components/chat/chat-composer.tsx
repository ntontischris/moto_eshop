"use client";

import { useState, type FormEvent } from "react";
import styles from "./chat.module.css";

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export function ChatComposer({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  }

  return (
    <form className={styles.composer} onSubmit={submit}>
      <input
        type="text"
        className={styles.input}
        placeholder="Γράψε στον Πιτ..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        aria-label="Πληκτρολόγησε μήνυμα"
      />
      <button
        type="submit"
        className={styles.sendBtn}
        disabled={disabled || !value.trim()}
      >
        Στείλε
      </button>
    </form>
  );
}
