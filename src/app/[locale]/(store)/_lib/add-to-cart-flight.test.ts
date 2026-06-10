import { describe, it, expect } from "vitest";
import {
  nextMorphState,
  canStartAdd,
  arcControlPoint,
  arcFlightPath,
  flightScale,
  type CartMorphState,
} from "./add-to-cart-flight";

describe("nextMorphState", () => {
  it("walks the happy path idle → pending → success", () => {
    let state: CartMorphState = "idle";
    state = nextMorphState(state, "press");
    expect(state).toBe("pending");
    state = nextMorphState(state, "resolve");
    expect(state).toBe("success");
    state = nextMorphState(state, "reset");
    expect(state).toBe("idle");
  });

  it("walks the failure path idle → pending → error → idle", () => {
    let state: CartMorphState = "idle";
    state = nextMorphState(state, "press");
    state = nextMorphState(state, "reject");
    expect(state).toBe("error");
    expect(nextMorphState(state, "reset")).toBe("idle");
  });

  it("ignores resolve/reject that did not follow a press", () => {
    expect(nextMorphState("idle", "resolve")).toBe("idle");
    expect(nextMorphState("success", "reject")).toBe("success");
  });

  it("re-pressing while pending stays pending (double-tap safe)", () => {
    expect(nextMorphState("pending", "press")).toBe("pending");
  });
});

describe("canStartAdd", () => {
  it("allows a new add from any settled state", () => {
    expect(canStartAdd("idle")).toBe(true);
    expect(canStartAdd("success")).toBe(true);
    expect(canStartAdd("error")).toBe(true);
  });

  it("blocks a new add while a request is pending", () => {
    expect(canStartAdd("pending")).toBe(false);
  });
});

describe("arcControlPoint", () => {
  it("sits at the horizontal midpoint", () => {
    const c = arcControlPoint({ x: 0, y: 100 }, { x: 200, y: 100 });
    expect(c.x).toBe(100);
  });

  it("lifts above the higher (smaller-y) endpoint", () => {
    const c = arcControlPoint({ x: 0, y: 100 }, { x: 400, y: 40 });
    // span 400 * 0.4 = 160 lift, above the higher endpoint y=40 → -120.
    expect(c.y).toBe(40 - 160);
  });

  it("clamps the lift for very short hops to a visible minimum", () => {
    const c = arcControlPoint({ x: 0, y: 0 }, { x: 10, y: 0 });
    expect(c.y).toBe(-60);
  });

  it("clamps the lift for very long hops to a maximum", () => {
    const c = arcControlPoint({ x: 0, y: 0 }, { x: 2000, y: 0 });
    expect(c.y).toBe(-220);
  });
});

describe("arcFlightPath", () => {
  it("starts at the origin and ends at the target", () => {
    const origin = { x: 10, y: 200 };
    const target = { x: 300, y: 80 };
    const path = arcFlightPath(origin, target, 12);
    expect(path[0]).toEqual(origin);
    expect(path.at(-1)).toEqual(target);
  });

  it("produces steps+1 points", () => {
    expect(arcFlightPath({ x: 0, y: 0 }, { x: 100, y: 0 }, 8)).toHaveLength(9);
  });

  it("arcs above the straight line at the midpoint", () => {
    const path = arcFlightPath({ x: 0, y: 100 }, { x: 200, y: 100 }, 2);
    // The middle sample should be lifted above the y=100 baseline.
    expect(path[1].y).toBeLessThan(100);
  });

  it("collapses to the two endpoints when steps < 1", () => {
    const path = arcFlightPath({ x: 0, y: 0 }, { x: 50, y: 50 }, 0);
    expect(path).toHaveLength(2);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[1]).toEqual({ x: 50, y: 50 });
  });
});

describe("flightScale", () => {
  it("is full size at the start and a dot at the end", () => {
    expect(flightScale(0)).toBe(1);
    expect(flightScale(1)).toBeCloseTo(0.2);
  });

  it("clamps progress outside 0..1", () => {
    expect(flightScale(-1)).toBe(1);
    expect(flightScale(2)).toBeCloseTo(0.2);
  });
});
