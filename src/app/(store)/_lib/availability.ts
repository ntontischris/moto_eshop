export interface AvailabilityState {
  badgeLabel: string;
  detailLabel: string;
  ctaLabel: string;
  isImmediate: boolean;
  isOrderable: boolean;
}

export function getAvailabilityState(stock: number): AvailabilityState {
  if (stock > 0) {
    return {
      badgeLabel: "Διαθέσιμο",
      detailLabel: "Άμεσα διαθέσιμο",
      ctaLabel: "Προσθήκη στο καλάθι",
      isImmediate: true,
      isOrderable: true,
    };
  }

  if (stock === 0) {
    return {
      badgeLabel: "Κατόπιν παραγγελίας",
      detailLabel: "Κατόπιν παραγγελίας",
      ctaLabel: "Προσθήκη στο καλάθι",
      isImmediate: false,
      isOrderable: true,
    };
  }

  return {
    badgeLabel: "Μη διαθέσιμο",
    detailLabel: "Μη διαθέσιμο",
    ctaLabel: "Μη διαθέσιμο",
    isImmediate: false,
    isOrderable: false,
  };
}
