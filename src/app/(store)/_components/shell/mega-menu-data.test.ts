import { describe, expect, it } from "vitest";
import { MEGA_MENU_CLOSE_DELAY_MS, MEGA_MENU_PANELS } from "./mega-menu-data";

describe("mega menu data", () => {
  it("provides four quick tiles for every desktop panel", () => {
    expect(MEGA_MENU_PANELS).toHaveLength(7);

    for (const panel of MEGA_MENU_PANELS) {
      expect(panel.quickLinks, panel.label).toHaveLength(4);
      expect(panel.quickLinks.every((link) => link.label && link.href)).toBe(
        true,
      );
    }
  });

  it("keeps the dropdown open briefly while moving from the bar into the panel", () => {
    expect(MEGA_MENU_CLOSE_DELAY_MS).toBeGreaterThanOrEqual(140);
    expect(MEGA_MENU_CLOSE_DELAY_MS).toBeLessThanOrEqual(260);
  });
});
