import { tool } from "ai";
import { z } from "zod/v4";

export const navigateToInputSchema = z.object({
  route: z
    .string()
    .min(1)
    .describe(
      "Storefront route to push, starting with /, e.g. /category/kranh--touring or /product/shoei-rf",
    ),
  locale: z.string().min(2).max(5).optional(),
});

export function isRouteAllowed(route: string): boolean {
  if (!route.startsWith("/")) return false;
  if (route.startsWith("//")) return false;
  if (route.startsWith("/admin")) return false;
  // Block sub-paths of /checkout but allow /checkout itself (entry page).
  if (route.startsWith("/checkout/")) return false;
  return true;
}

/**
 * Client-side tool — no execute defined.
 * Browser's useChat({ onToolCall }) executes it via router.push().
 */
export const navigateToTool = tool({
  description:
    "Navigate the user's browser to a storefront route on their behalf. Use when the user asks 'πάμε στα ...', 'δείξε μου τα κράνη', etc. Cannot navigate to /admin or live checkout steps.",
  inputSchema: navigateToInputSchema,
});
