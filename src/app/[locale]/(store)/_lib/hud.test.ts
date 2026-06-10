import { describe, expect, it } from "vitest";
import {
  NEUTRAL_GEAR,
  TOP_GEAR,
  activeSectionIndex,
  gearForSection,
  isStickyCtaVisible,
  scrollProgress,
} from "./hud";

describe("gearForSection", () => {
  it("sits in neutral before any section is active", () => {
    expect(gearForSection(-1)).toBe(NEUTRAL_GEAR);
  });
  it("maps the first section to first gear", () => {
    expect(gearForSection(0)).toBe("1");
  });
  it("shifts up one gear per section", () => {
    expect(gearForSection(3)).toBe("4");
  });
  it("never shifts past the top gear", () => {
    expect(gearForSection(TOP_GEAR)).toBe(String(TOP_GEAR));
    expect(gearForSection(99)).toBe(String(TOP_GEAR));
  });
});

describe("activeSectionIndex", () => {
  const tops = [0, 800, 1600, 2400];
  it("is neutral (-1) before the first section reaches the line", () => {
    expect(activeSectionIndex(tops, -10)).toBe(-1);
  });
  it("returns the last section whose top has crossed the line", () => {
    expect(activeSectionIndex(tops, 0)).toBe(0);
    expect(activeSectionIndex(tops, 1700)).toBe(2);
  });
  it("returns the final section when scrolled to the bottom", () => {
    expect(activeSectionIndex(tops, 9999)).toBe(3);
  });
  it("shifts back down when scrolling up across a boundary", () => {
    expect(activeSectionIndex(tops, 1599)).toBe(1);
  });
  it("is neutral for an empty section list", () => {
    expect(activeSectionIndex([], 500)).toBe(-1);
  });
});

describe("scrollProgress", () => {
  it("is zero at the top and one at the bottom", () => {
    expect(scrollProgress(0, 3000, 1000)).toBe(0);
    expect(scrollProgress(2000, 3000, 1000)).toBe(1);
  });
  it("is linear in between", () => {
    expect(scrollProgress(1000, 3000, 1000)).toBeCloseTo(0.5);
  });
  it("clamps overscroll into [0, 1]", () => {
    expect(scrollProgress(-100, 3000, 1000)).toBe(0);
    expect(scrollProgress(99999, 3000, 1000)).toBe(1);
  });
  it("reports empty when the page fits the viewport", () => {
    expect(scrollProgress(0, 800, 1000)).toBe(0);
  });
});

describe("isStickyCtaVisible", () => {
  const base = {
    scrollY: 1200,
    heroBottom: 700,
    footerTop: 5000,
    viewportHeight: 800,
  };
  it("shows once scrolled past the hero and before the footer", () => {
    expect(isStickyCtaVisible(base)).toBe(true);
  });
  it("stays hidden while still inside the hero", () => {
    expect(isStickyCtaVisible({ ...base, scrollY: 300 })).toBe(false);
  });
  it("hides as the footer scrolls into view", () => {
    expect(isStickyCtaVisible({ ...base, scrollY: 4500 })).toBe(false);
  });
  it("appears exactly at the hero bottom boundary", () => {
    expect(isStickyCtaVisible({ ...base, scrollY: 700 })).toBe(true);
  });
});
