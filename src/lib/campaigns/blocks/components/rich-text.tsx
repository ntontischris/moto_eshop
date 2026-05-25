import type { Block } from "../schema";

type RichText = Extract<Block, { type: "richText" }>;

// Minimal allowlist sanitizer: strips <script>/<style> and inline on* handlers.
// Swap for a vetted sanitizer (e.g. isomorphic-dompurify) in sub-project B if
// richer HTML is needed; A keeps zero new deps.
function sanitize(html: string): string {
  return html
    .replace(/<\/?(script|style)[^>]*>/gi, "")
    .replace(/ on\w+="[^"]*"/gi, "")
    .replace(/ on\w+='[^']*'/gi, "");
}

export function RichTextBlock({ block }: { block: RichText }) {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-10">
      <div
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: sanitize(block.html) }}
      />
    </section>
  );
}
