import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const panelSource = readFileSync(
  new URL("./race-control-panel.tsx", import.meta.url),
  "utf8",
);
const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
);

describe("race control panel", () => {
  it("auto-advances the selected ride every three seconds", () => {
    expect(panelSource).toContain("setInterval");
    expect(panelSource).toContain("3000");
    expect(panelSource).toContain("(current + 1) % RIDES.length");
  });

  it("pauses auto-advance while the rider is interacting", () => {
    expect(panelSource).toContain("isAutoPaused");
    expect(panelSource).toContain("onMouseEnter={() => setIsAutoPaused(true)}");
    expect(panelSource).toContain("onMouseLeave={() => setIsAutoPaused(false)}");
    expect(panelSource).toContain("onFocusCapture={() => setIsAutoPaused(true)}");
    expect(panelSource).toContain("onBlurCapture=");
  });

  it("gives the ride header the same dark red treatment as the panel", () => {
    expect(componentsCss).toContain(".v3-ride-head::before");
    expect(componentsCss).toContain("rgba(228,17,31,.18)");
    expect(componentsCss).toContain("@keyframes v3-ride-tab-progress");
  });
});
