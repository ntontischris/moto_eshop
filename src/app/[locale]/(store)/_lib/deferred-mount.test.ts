import { describe, expect, it, vi } from "vitest";
import { armOnIdleOrInteraction, INTERACTION_EVENTS } from "./deferred-mount";

/* A minimal EventTarget double that records listeners so the test can fire an
   event and assert add/remove bookkeeping. */
function fakeTarget() {
  const listeners = new Map<string, Set<() => void>>();
  return {
    addEventListener: vi.fn((type: string, cb: () => void) => {
      (listeners.get(type) ?? listeners.set(type, new Set()).get(type)!).add(
        cb,
      );
    }),
    removeEventListener: vi.fn((type: string, cb: () => void) => {
      listeners.get(type)?.delete(cb);
    }),
    fire(type: string) {
      for (const cb of [...(listeners.get(type) ?? [])]) cb();
    },
    count(type: string) {
      return listeners.get(type)?.size ?? 0;
    },
  };
}

describe("armOnIdleOrInteraction", () => {
  it("arms on the browser idle path", () => {
    const target = fakeTarget();
    const onArm = vi.fn();
    let idleRun: (() => void) | undefined;
    armOnIdleOrInteraction({
      target,
      scheduleIdle: (run) => {
        idleRun = run;
        return () => {};
      },
      onArm,
    });

    expect(onArm).not.toHaveBeenCalled();
    idleRun?.();
    expect(onArm).toHaveBeenCalledTimes(1);
  });

  it("arms on the first user interaction", () => {
    const target = fakeTarget();
    const onArm = vi.fn();
    armOnIdleOrInteraction({ target, scheduleIdle: () => () => {}, onArm });

    target.fire("pointerdown");
    expect(onArm).toHaveBeenCalledTimes(1);
  });

  it("fires onArm at most once even if idle and interaction both occur", () => {
    const target = fakeTarget();
    const onArm = vi.fn();
    let idleRun: (() => void) | undefined;
    armOnIdleOrInteraction({
      target,
      scheduleIdle: (run) => {
        idleRun = run;
        return () => {};
      },
      onArm,
    });

    target.fire("scroll");
    idleRun?.();
    target.fire("keydown");
    expect(onArm).toHaveBeenCalledTimes(1);
  });

  it("listens for every interaction event and cancels idle once armed", () => {
    const target = fakeTarget();
    const cancelIdle = vi.fn();
    armOnIdleOrInteraction({
      target,
      scheduleIdle: () => cancelIdle,
      onArm: vi.fn(),
    });

    for (const evt of INTERACTION_EVENTS) expect(target.count(evt)).toBe(1);

    target.fire("pointerdown");
    expect(cancelIdle).toHaveBeenCalledTimes(1);
    for (const evt of INTERACTION_EVENTS) expect(target.count(evt)).toBe(0);
  });

  it("disposer removes all listeners and cancels idle when never armed", () => {
    const target = fakeTarget();
    const cancelIdle = vi.fn();
    const dispose = armOnIdleOrInteraction({
      target,
      scheduleIdle: () => cancelIdle,
      onArm: vi.fn(),
    });

    dispose();
    expect(cancelIdle).toHaveBeenCalledTimes(1);
    for (const evt of INTERACTION_EVENTS) expect(target.count(evt)).toBe(0);
  });
});
