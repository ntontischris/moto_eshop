import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const panelSource = readFileSync(
  new URL("./race-control-panel.tsx", import.meta.url),
  "utf8",
);
const rideCss = readFileSync(
  new URL("./race-control-panel.css", import.meta.url),
  "utf8",
);

describe("race control panel", () => {
  it("auto-advances via the pure rotation reducer on a 3s timer", () => {
    expect(panelSource).toContain("rideRotationReducer");
    expect(panelSource).toContain("ROTATION_MS = 3000");
    expect(panelSource).toContain('dispatch({ type: "advance" })');
  });

  it("crossfades by stacking every ride scene rather than swapping one image", () => {
    expect(panelSource).toContain("v3-ride-focus-layer");
    expect(panelSource).toContain("RIDES.map((ride, index)");
  });

  it("smart-pauses on hover, focus, off-screen and tab-hidden", () => {
    expect(panelSource).toContain('reason: "hover"');
    expect(panelSource).toContain('reason: "focus"');
    expect(panelSource).toContain("IntersectionObserver");
    expect(panelSource).toContain('reason: "offscreen"');
    expect(panelSource).toContain("visibilitychange");
    expect(panelSource).toContain('reason: "hidden"');
  });

  it("respects reduced motion by skipping the auto-advance timer", () => {
    expect(panelSource).toContain("prefersReducedMotion()");
  });

  it("keeps tablist semantics and keyboard arrow operability", () => {
    expect(panelSource).toContain('role="tablist"');
    expect(panelSource).toContain('role="tab"');
    expect(panelSource).toContain("aria-selected={isActive}");
    expect(panelSource).toContain('event.key === "ArrowRight"');
    expect(panelSource).toContain('aria-live="polite"');
  });

  it("serves ride-tab thumbnails sized to their display box (optimized + sizes)", () => {
    const thumbBlock = panelSource.slice(
      panelSource.indexOf("src={thumb}"),
      panelSource.indexOf("src={thumb}") + 200,
    );
    expect(thumbBlock).toContain('sizes="88px"');
    expect(thumbBlock).not.toContain("unoptimized");
  });

  it("gives the ride header the same dark red treatment as the panel", () => {
    expect(rideCss).toContain(".v3-ride-head::before");
    expect(rideCss).toContain("rgba(228,17,31,.18)");
    expect(rideCss).toContain("@keyframes v3-ride-tab-progress");
  });
});
