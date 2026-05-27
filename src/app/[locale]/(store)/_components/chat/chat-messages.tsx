"use client";

import type { UIMessage } from "ai";
import { ChatProductCarousel } from "./chat-product-carousel";
import { ChatProductCompare } from "./chat-product-compare";
import { ChatToolChip } from "./chat-tool-chip";
import type { ShowProductCardsResult } from "@/lib/chat/tools/show-product-cards";
import type { CompareProductsResult } from "@/lib/chat/tools/compare-products";
import type { AddToCartResult } from "@/lib/chat/tools/add-to-cart";
import styles from "./chat.module.css";

interface Props {
  messages: UIMessage[];
  onAddToCart?: (productId: string) => void;
}

// ai@6 ToolUIPart shape:
//   part.type  === `tool-${toolName}`  (e.g. "tool-showProductCards")
//   part.state === 'input-streaming' | 'input-available' | 'output-available' | 'output-error'
//   part.output exists only when state === 'output-available'
function partToolName(part: UIMessage["parts"][number]): string | null {
  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    return part.type.slice("tool-".length);
  }
  return null;
}

function partOutput(part: UIMessage["parts"][number]): unknown {
  const p = part as unknown as { state?: string; output?: unknown };
  if (p.state === "output-available") return p.output ?? null;
  return null;
}

export function ChatMessages({ messages, onAddToCart }: Props) {
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

        const bubbleClass =
          m.role === "user"
            ? `${styles.bubble} ${styles.bubbleUser}`
            : `${styles.bubble} ${styles.bubbleAssistant}`;

        return (
          <div key={m.id} className={styles.messageGroup}>
            {text && <div className={bubbleClass}>{text}</div>}

            {m.role === "assistant" &&
              m.parts.map((part, idx) => {
                const toolName = partToolName(part);
                if (!toolName) return null;
                const output = partOutput(part);

                if (toolName === "showProductCards" && output) {
                  const o = output as ShowProductCardsResult;
                  return (
                    <ChatProductCarousel
                      key={`${m.id}-${idx}`}
                      products={o.products}
                      notFound={o.notFound}
                      onAddToCart={onAddToCart}
                    />
                  );
                }

                if (toolName === "compareProducts" && output) {
                  const o = output as CompareProductsResult;
                  return (
                    <ChatProductCompare
                      key={`${m.id}-${idx}`}
                      products={o.products}
                      fields={o.fields}
                    />
                  );
                }

                if (toolName === "navigateTo" && output) {
                  const o = output as {
                    ok: boolean;
                    route?: string;
                    error?: string;
                  };
                  return (
                    <ChatToolChip
                      key={`${m.id}-${idx}`}
                      icon="📍"
                      label={o.ok ? "Πήγα στο:" : "Δεν μπόρεσα να πάω:"}
                      detail={o.ok ? o.route : o.error}
                      variant={o.ok ? "success" : "warning"}
                    />
                  );
                }

                if (toolName === "applyFilters" && output) {
                  const o = output as {
                    ok: boolean;
                    appliedKeys?: string[];
                    error?: string;
                  };
                  return (
                    <ChatToolChip
                      key={`${m.id}-${idx}`}
                      icon="🔧"
                      label={o.ok ? "Φίλτρα:" : "Δεν εφάρμοσα φίλτρα:"}
                      detail={o.ok ? o.appliedKeys?.join(", ") : o.error}
                      variant={o.ok ? "success" : "warning"}
                    />
                  );
                }

                if (toolName === "addToCart" && output) {
                  const o = output as AddToCartResult;
                  return (
                    <ChatToolChip
                      key={`${m.id}-${idx}`}
                      icon="🛒"
                      label={o.success ? "Καλάθι:" : "Δεν μπήκε στο καλάθι:"}
                      detail={
                        o.success
                          ? `${o.cartItemCount ?? "?"} προϊόντα στο καλάθι`
                          : o.error
                      }
                      variant={o.success ? "success" : "warning"}
                    />
                  );
                }

                // searchProducts / getProductDetails / checkStock / handoffToHuman
                // are internal — results are not surfaced to the user directly.
                return null;
              })}
          </div>
        );
      })}
    </div>
  );
}
