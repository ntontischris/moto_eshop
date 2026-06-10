import { describe, expect, it } from "vitest";
import {
  endOfLocalDay,
  formatCountdown,
  timeRemaining,
} from "./offers-countdown";

describe("endOfLocalDay", () => {
  it("snaps to 23:59:59.999 of the same local day", () => {
    const end = endOfLocalDay(new Date(2026, 5, 10, 9, 30, 0));
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
    expect(end.getDate()).toBe(10);
  });
});

describe("timeRemaining", () => {
  it("breaks the gap into whole hours, minutes and seconds", () => {
    const now = new Date(2026, 5, 10, 21, 30, 45);
    const end = new Date(2026, 5, 10, 23, 59, 59);
    expect(timeRemaining(now, end)).toEqual({
      hours: 2,
      minutes: 29,
      seconds: 14,
      expired: false,
    });
  });

  it("clamps to zero and flags expired once the deadline passes", () => {
    const now = new Date(2026, 5, 10, 23, 59, 59);
    const end = new Date(2026, 5, 10, 23, 0, 0);
    expect(timeRemaining(now, end)).toEqual({
      hours: 0,
      minutes: 0,
      seconds: 0,
      expired: true,
    });
  });

  it("is exactly expired at the deadline instant", () => {
    const at = new Date(2026, 5, 10, 23, 59, 59);
    expect(timeRemaining(at, at).expired).toBe(true);
  });
});

describe("formatCountdown", () => {
  it("zero-pads each segment to two digits", () => {
    expect(
      formatCountdown({ hours: 2, minutes: 9, seconds: 5, expired: false }),
    ).toBe("02:09:05");
  });

  it("renders 00:00:00 when expired", () => {
    expect(
      formatCountdown({ hours: 0, minutes: 0, seconds: 0, expired: true }),
    ).toBe("00:00:00");
  });

  it("keeps a stable width across ticks (tabular contract)", () => {
    const a = formatCountdown({
      hours: 1,
      minutes: 2,
      seconds: 3,
      expired: false,
    });
    const b = formatCountdown({
      hours: 12,
      minutes: 34,
      seconds: 56,
      expired: false,
    });
    expect(a.length).toBe(b.length);
  });
});
