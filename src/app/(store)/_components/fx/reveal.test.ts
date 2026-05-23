import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
);

describe("reveal wrapper", () => {
  it("keeps homepage content visible even before client animation runs", () => {
    expect(componentsCss).toContain(".v3-reveal {\n  opacity: 1;");
    expect(componentsCss).not.toContain(".v3-reveal {\n  opacity: 0;");
  });
});
