import { tool } from "ai";
import { z } from "zod/v4";
import { Resend } from "resend";

export const handoffToHumanInputSchema = z.object({
  reason: z
    .string()
    .min(3)
    .describe("Short, one-line reason for escalation, e.g. 'custom order'"),
  summary: z
    .string()
    .min(10)
    .describe(
      "2-5 sentence summary of what the customer wants, in the customer's own language plus a Greek note if different.",
    ),
});

export interface HandoffResult {
  delivered: boolean;
  to?: string;
  error?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const handoffToHumanTool = tool({
  description:
    "Escalate to a human salesperson by email. Use this when the user asks for something outside the product catalog (custom orders, legal/warranty disputes, medical/fit questions beyond standard sizing) or explicitly asks for a human. Always confirm to the user after calling.",
  inputSchema: handoffToHumanInputSchema,
  execute: async ({ reason, summary }): Promise<HandoffResult> => {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.CHAT_HANDOFF_TO ?? "sales@motomarket-shop.gr";
    // Sender is configurable so installs without a verified Resend domain
    // can fall back to Resend's shared onboarding sender. Override via
    // CHAT_FROM_EMAIL once a custom domain is verified.
    const from =
      process.env.CHAT_FROM_EMAIL ?? "Πιτ (AI) <onboarding@resend.dev>";

    if (!apiKey) {
      return {
        delivered: false,
        error: "Email handoff is not configured (RESEND_API_KEY missing).",
      };
    }

    try {
      const resend = new Resend(apiKey);
      const { data, error } = await resend.emails.send({
        from,
        to: [to],
        subject: `[Πιτ] Handoff — ${reason}`,
        html: `<h3>Νέο handoff από τον Πιτ</h3>
<p><strong>Λόγος:</strong> ${escapeHtml(reason)}</p>
<h4>Σύνοψη:</h4>
<pre style="white-space:pre-wrap;font-family:system-ui,sans-serif">${escapeHtml(summary)}</pre>
<p><em>Απάντησε στον πελάτη όσο πιο σύντομα γίνεται.</em></p>`,
      });

      void data;
      if (error) return { delivered: false, error: error.message };
      return { delivered: true, to };
    } catch (err) {
      return {
        delivered: false,
        error: (err as Error).message,
      };
    }
  },
});
