import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { reportError } from "./report-error";

describe("reportError", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => vi.restoreAllMocks());

  it("returns a non-empty event id", () => {
    const id = reportError(new Error("boom"));
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("logs the error message and context", () => {
    reportError(new Error("boom"), { where: "checkout" });
    expect(console.error).toHaveBeenCalledTimes(1);
    const arg = vi.mocked(console.error).mock.calls[0][1] as Record<
      string,
      unknown
    >;
    expect(arg.message).toBe("boom");
    expect((arg.context as Record<string, unknown>).where).toBe("checkout");
  });

  it("never throws on a non-Error value", () => {
    expect(() => reportError("just a string")).not.toThrow();
  });
});
