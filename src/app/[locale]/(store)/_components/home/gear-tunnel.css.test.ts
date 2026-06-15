import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const componentsCss = readFileSync(
  new URL("../../_styles/components.css", import.meta.url),
  "utf8",
);
const tunnelCss = readFileSync(
  new URL("./gear-tunnel.css", import.meta.url),
  "utf8",
);
const tunnelSource = readFileSync(
  new URL("./gear-tunnel.tsx", import.meta.url),
  "utf8",
);
const homePageSource = readFileSync(
  new URL("../../page.tsx", import.meta.url),
  "utf8",
);

// S5c (issue #88, Lever 2): the gear-tunnel section sits 4th on the homepage,
// well below the ~92vh hero, so its `v3-tunnel-*` CSS is carved out of the
// render-blocking monolith into a sheet colocated with the component, and the
// section is loaded via next/dynamic so that sheet code-splits off the home
// critical path. The hero stays critically styled.
describe("gear-tunnel css is carved out of the home-critical sheet", () => {
  it("removes every v3-tunnel rule from the shared components.css", () => {
    // Total containment: no v3-tunnel selector, keyframe, or animation
    // reference may remain on the render-blocking monolith.
    expect(componentsCss).not.toContain("v3-tunnel");
  });

  it("colocates the base + card + progress rules in gear-tunnel.css", () => {
    for (const selector of [
      ".v3-tunnel {",
      ".v3-tunnel-pin {",
      ".v3-tunnel-head {",
      ".v3-tunnel-head h2 {",
      ".v3-tunnel-track {",
      ".v3-tunnel-card {",
      ".v3-tunnel-card-media {",
      ".v3-tunnel-card-mask {",
      ".v3-tunnel-card-mask .v3-lqip {",
      ".v3-tunnel-card-media::after {",
      ".v3-tunnel-card-copy {",
      ".v3-tunnel-card-copy strong {",
      ".v3-tunnel-card-copy em {",
      ".v3-tunnel-progress {",
      ".v3-tunnel-progress-fill {",
    ]) {
      expect(tunnelCss).toContain(selector);
    }
  });

  it("colocates the keyframes and responsive tunnel rules", () => {
    for (const fragment of [
      "@keyframes v3-tunnel-mask-in {",
      "@media (min-width: 900px) and (pointer: fine)",
      "@media (prefers-reduced-motion: reduce)",
    ]) {
      expect(tunnelCss).toContain(fragment);
    }
  });

  it("imports the colocated sheet from the component", () => {
    expect(tunnelSource).toContain("./gear-tunnel.css");
  });

  it("defers the gear-tunnel section via next/dynamic on the home page", () => {
    expect(homePageSource).toContain('import dynamic from "next/dynamic"');
    expect(homePageSource).toContain('./_components/home/gear-tunnel"');
    expect(homePageSource).toContain("dynamic(");
  });
});
