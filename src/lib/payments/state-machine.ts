/**
 * Pure payment state machine (no I/O), mirroring the `priceOrder` pure-core
 * pattern. It validates the `payment_status` transitions a card payment may
 * take, so illegal moves (e.g. re-paying a paid order, or driving a COD order
 * through card events) are caught and unit-testable. See ADR 0015.
 *
 * Keep this file dependency-free.
 */

export type PaymentStatus = "unpaid" | "paid" | "failed" | "cod";

/** Events emitted by the payment webhook that drive `payment_status`. */
export type PaymentTransition = "confirm" | "fail";

export type TransitionResult =
  | { ok: true; status: PaymentStatus }
  | { ok: false; error: string };

// Allowed transitions. `paid` is terminal; `cod` is set at order creation and
// never participates in card transitions.
const TRANSITIONS: Record<
  PaymentStatus,
  Partial<Record<PaymentTransition, PaymentStatus>>
> = {
  unpaid: { confirm: "paid", fail: "failed" },
  failed: { confirm: "paid", fail: "failed" },
  paid: {},
  cod: {},
};

export function transitionPayment(
  current: PaymentStatus,
  transition: PaymentTransition,
): TransitionResult {
  const next = TRANSITIONS[current]?.[transition];
  if (!next) {
    return {
      ok: false,
      error: `Illegal payment transition: ${current} -[${transition}]-> ?`,
    };
  }
  return { ok: true, status: next };
}
