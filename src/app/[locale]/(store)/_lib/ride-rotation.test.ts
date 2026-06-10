import { describe, expect, it } from "vitest";
import {
  createRideRotationState,
  isRotationRunning,
  nextRideIndex,
  rideRotationReducer,
  type RideRotationState,
} from "./ride-rotation";

const TOTAL = 6;
const reduce = rideRotationReducer(TOTAL);

describe("nextRideIndex", () => {
  it("advances to the following ride", () => {
    expect(nextRideIndex(0, TOTAL)).toBe(1);
    expect(nextRideIndex(4, TOTAL)).toBe(5);
  });

  it("wraps from the last ride back to the first", () => {
    expect(nextRideIndex(TOTAL - 1, TOTAL)).toBe(0);
  });
});

describe("rideRotationReducer", () => {
  it("starts running on the first ride with no pauses", () => {
    const state = createRideRotationState();
    expect(state.activeIndex).toBe(0);
    expect(isRotationRunning(state)).toBe(true);
  });

  it("advance moves to the next index and loops", () => {
    let state = createRideRotationState(TOTAL - 1);
    state = reduce(state, { type: "advance" });
    expect(state.activeIndex).toBe(0);
  });

  it("select jumps to the chosen ride", () => {
    const state = reduce(createRideRotationState(), {
      type: "select",
      index: 3,
    });
    expect(state.activeIndex).toBe(3);
  });

  it("select returns the same reference when already active (no rerender churn)", () => {
    const state = createRideRotationState(2);
    expect(reduce(state, { type: "select", index: 2 })).toBe(state);
  });

  it("pauses while a reason is active and resumes when cleared", () => {
    let state: RideRotationState = createRideRotationState();
    state = reduce(state, { type: "pause", reason: "hover" });
    expect(isRotationRunning(state)).toBe(false);
    state = reduce(state, { type: "resume", reason: "hover" });
    expect(isRotationRunning(state)).toBe(true);
  });

  it("stays paused while another reason is still active", () => {
    let state = createRideRotationState();
    state = reduce(state, { type: "pause", reason: "hover" });
    state = reduce(state, { type: "pause", reason: "offscreen" });
    state = reduce(state, { type: "resume", reason: "hover" });
    expect(isRotationRunning(state)).toBe(false);
    state = reduce(state, { type: "resume", reason: "offscreen" });
    expect(isRotationRunning(state)).toBe(true);
  });

  it("pausing an already-paused reason is idempotent (same reference)", () => {
    const state = reduce(createRideRotationState(), {
      type: "pause",
      reason: "hidden",
    });
    expect(reduce(state, { type: "pause", reason: "hidden" })).toBe(state);
  });

  it("resuming an inactive reason is a no-op (same reference)", () => {
    const state = createRideRotationState();
    expect(reduce(state, { type: "resume", reason: "focus" })).toBe(state);
  });
});
