"use client";

import { useRef, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceSearchButtonProps {
  onResult: (transcript: string) => void;
  className?: string;
}

type ListeningState = "idle" | "listening" | "error";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionType = any;

function getSpeechRecognition(): SpeechRecognitionType | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function VoiceSearchButton({
  onResult,
  className,
}: VoiceSearchButtonProps) {
  const [state, setState] = useState<ListeningState>("idle");
  const recognitionRef = useRef<SpeechRecognitionType | null>(null);
  const SR = getSpeechRecognition();

  if (!SR) return null;

  const startListening = () => {
    const recognition = new SR();
    recognition.lang = "el-GR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => setState("listening");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setState("idle");
    };
    recognition.onerror = () => setState("error");
    recognition.onend = () =>
      setState((s: ListeningState) => (s === "listening" ? "idle" : s));

    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setState("idle");
  };

  return (
    <button
      type="button"
      aria-label={
        state === "listening" ? "Διακοπή εγγραφής" : "Αναζήτηση με φωνή"
      }
      onClick={state === "listening" ? stopListening : startListening}
      className={cn(
        "flex items-center justify-center rounded-full transition-colors",
        state === "listening"
          ? "animate-pulse text-red-500"
          : state === "error"
            ? "text-zinc-400"
            : "text-zinc-500 hover:text-zinc-700",
        className,
      )}
    >
      {state === "error" ? (
        <MicOff className="size-5" />
      ) : (
        <Mic className="size-5" />
      )}
    </button>
  );
}
