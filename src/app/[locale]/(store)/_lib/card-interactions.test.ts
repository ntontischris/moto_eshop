import { describe, it, expect } from "vitest";
import {
  canRunCardInteractions,
  tiltTransform,
  tiltRestTransform,
  odometerColumns,
} from "./card-interactions";

describe("canRunCardInteractions", () => {
  it("runs only on a fine pointer without reduced-motion", () => {
    expect(
      canRunCardInteractions({
        hasFinePointer: true,
        prefersReducedMotion: false,
      }),
    ).toBe(true);
  });

  it("never runs on a coarse (touch) pointer", () => {
    expect(
      canRunCardInteractions({
        hasFinePointer: false,
        prefersReducedMotion: false,
      }),
    ).toBe(false);
  });

  it("never runs under reduced-motion, even on a fine pointer", () => {
    expect(
      canRunCardInteractions({
        hasFinePointer: true,
        prefersReducedMotion: true,
      }),
    ).toBe(false);
  });
});

describe("tiltTransform", () => {
  it("is neutral at the card centre", () => {
    expect(tiltTransform(0.5, 0.5)).toBe(
      "perspective(900px) rotateX(0.00deg) rotateY(0.00deg) translateZ(12px)",
    );
  });

  it("leans toward the cursor (top-left tilts up and left)", () => {
    expect(tiltTransform(0, 0)).toBe(
      "perspective(900px) rotateX(7.00deg) rotateY(-7.00deg) translateZ(12px)",
    );
  });

  it("clamps out-of-bounds pointer positions to the card edges", () => {
    expect(tiltTransform(2, -1)).toBe(tiltTransform(1, 0));
  });

  it("rests flat with no lift", () => {
    expect(tiltRestTransform()).toBe(
      "perspective(900px) rotateX(0deg) rotateY(0deg)",
    );
  });
});

describe("odometerColumns", () => {
  it("rolls each digit up through the requested number of steps", () => {
    const [col] = odometerColumns("5", 3);
    expect(col.isDigit).toBe(true);
    expect(col.roll).toEqual(["2", "3", "4", "5"]);
  });

  it("wraps the roll around 0-9 for low target digits", () => {
    const [col] = odometerColumns("1", 3);
    expect(col.roll).toEqual(["8", "9", "0", "1"]);
  });

  it("lands instantly (single frame) when steps is zero", () => {
    const [col] = odometerColumns("7", 0);
    expect(col.roll).toEqual(["7"]);
  });

  it("treats negative/fractional steps as instant", () => {
    expect(odometerColumns("7", -2)[0].roll).toEqual(["7"]);
    expect(odometerColumns("7", 0.9)[0].roll).toEqual(["7"]);
  });

  it("passes non-digit characters through with an empty roll", () => {
    const cols = odometerColumns("1,€", 2);
    expect(cols.map((c) => c.char)).toEqual(["1", ",", "€"]);
    expect(cols[1]).toMatchObject({ isDigit: false, roll: [] });
    expect(cols[2]).toMatchObject({ isDigit: false, roll: [] });
  });

  it("preserves the formatted string in column order", () => {
    const cols = odometerColumns("199,00 €", 1);
    expect(cols.map((c) => c.char).join("")).toBe("199,00 €");
  });
});
