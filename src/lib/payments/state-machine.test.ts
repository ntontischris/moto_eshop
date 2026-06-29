import { describe, it, expect } from "vitest";
import { transitionPayment } from "./state-machine";

describe("transitionPayment (pure payment state machine)", () => {
  it("moves unpaid -> paid on a confirm", () => {
    const res = transitionPayment("unpaid", "confirm");
    expect(res).toEqual({ ok: true, status: "paid" });
  });

  it("moves unpaid -> failed on a fail", () => {
    const res = transitionPayment("unpaid", "fail");
    expect(res).toEqual({ ok: true, status: "failed" });
  });

  it("allows a later retry: failed -> paid on a confirm", () => {
    const res = transitionPayment("failed", "confirm");
    expect(res).toEqual({ ok: true, status: "paid" });
  });

  it("rejects re-paying an already paid order (paid is terminal)", () => {
    const res = transitionPayment("paid", "confirm");
    expect(res.ok).toBe(false);
  });

  it("rejects un-paying a paid order", () => {
    const res = transitionPayment("paid", "fail");
    expect(res.ok).toBe(false);
  });

  it("rejects card transitions on a COD order", () => {
    const res = transitionPayment("cod", "confirm");
    expect(res.ok).toBe(false);
  });
});
