import { describe, expect, it } from "vitest";
import { getAvailabilityState } from "./availability";

describe("availability", () => {
  it("treats zero stock products as orderable backorder items", () => {
    expect(getAvailabilityState(0)).toEqual({
      badgeLabel: "Κατόπιν παραγγελίας",
      detailLabel: "Κατόπιν παραγγελίας",
      ctaLabel: "Προσθήκη στο καλάθι",
      isImmediate: false,
      isOrderable: true,
    });
  });

  it("treats positive stock products as immediately available", () => {
    expect(getAvailabilityState(3)).toEqual({
      badgeLabel: "Διαθέσιμο",
      detailLabel: "Άμεσα διαθέσιμο",
      ctaLabel: "Προσθήκη στο καλάθι",
      isImmediate: true,
      isOrderable: true,
    });
  });
});
