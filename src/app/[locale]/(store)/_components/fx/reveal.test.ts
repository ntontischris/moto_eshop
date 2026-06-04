import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Normalise CRLF→LF so the string assertions are deterministic across OS
// (Windows checkouts use CRLF via git autocrlf; CI/Linux uses LF).
const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");

describe("reveal wrapper", () => {
  it("keeps homepage content visible even before client animation runs", () => {
    expect(componentsCss).toContain(".v3-reveal {\n  opacity: 1;");
    expect(componentsCss).not.toContain(".v3-reveal {\n  opacity: 0;");
  });
});
