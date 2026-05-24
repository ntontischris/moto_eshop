export interface RecommendationSeed {
  name: string;
  brand: string;
  slug: string;
  categorySlug?: string | null;
}

export interface CartRecommendation {
  title: string;
  reason: string;
  href: string;
  tag: string;
}

const DEFAULT_RECOMMENDATIONS: CartRecommendation[] = [
  {
    title: "Cleaner kit",
    reason: "Κράτα εξοπλισμό και ζελατίνες καθαρά μετά τη βόλτα.",
    href: "/search?q=cleaner",
    tag: "Care",
  },
  {
    title: "Quad Lock setup",
    reason: "Σταθερό κινητό στο cockpit για πόλη και ταξίδι.",
    href: "/search?q=Quad%20Lock",
    tag: "Cockpit",
  },
  {
    title: "Αδιάβροχο layer",
    reason: "Μικρή προσθήκη που σώζει την καθημερινή οδήγηση.",
    href: "/search?q=rain",
    tag: "Weather",
  },
];

function includesAny(text: string, terms: string[]): boolean {
  return terms.some((term) => text.includes(term));
}

function pushUnique(
  list: CartRecommendation[],
  item: CartRecommendation,
): void {
  if (!list.some((existing) => existing.title === item.title)) {
    list.push(item);
  }
}

export function getCartRecommendations(
  cart: RecommendationSeed[],
  limit = 4,
): CartRecommendation[] {
  const recommendations: CartRecommendation[] = [];
  const haystack = cart
    .map((line) =>
      [line.name, line.brand, line.slug, line.categorySlug].filter(Boolean).join(" "),
    )
    .join(" ")
    .toLocaleLowerCase("el-GR");

  if (
    includesAny(haystack, [
      "helmet",
      "κραν",
      "agv",
      "shoei",
      "arai",
      "hjc",
      "shark",
      "nolan",
    ])
  ) {
    pushUnique(recommendations, {
      title: "Pinlock / ζελατίνες",
      reason: "Το πιο φυσικό add-on για κράνος: ορατότητα και anti-fog.",
      href: "/search?q=pinlock",
      tag: "Helmet fit",
    });
    pushUnique(recommendations, {
      title: "Helmet cleaner",
      reason: "Καθαρισμός ζελατίνας και κελύφους χωρίς ρίσκο.",
      href: "/search?q=helmet%20cleaner",
      tag: "Care",
    });
  }

  if (
    includesAny(haystack, [
      "jacket",
      "pants",
      "μπουφαν",
      "παντελον",
      "dainese",
      "rev'it",
      "alpinestars",
      "endysh",
    ])
  ) {
    pushUnique(recommendations, {
      title: "Γάντια που ταιριάζουν",
      reason: "Ολοκληρώνουν το rider kit χωρίς να ανεβάζουν πολύ το καλάθι.",
      href: "/category/endysh--gantia",
      tag: "Rider kit",
    });
    pushUnique(recommendations, {
      title: "Προστασία πλάτης",
      reason: "Η πιο λογική αναβάθμιση για μπουφάν και touring χρήση.",
      href: "/search?q=back%20protector",
      tag: "Protection",
    });
  }

  if (
    includesAny(haystack, [
      "boot",
      "μποτ",
      "sidi",
      "forma",
    ])
  ) {
    pushUnique(recommendations, {
      title: "Technical socks",
      reason: "Καλύτερη άνεση στις μπότες σε καθημερινή και μεγάλη χρήση.",
      href: "/search?q=socks",
      tag: "Comfort",
    });
  }

  if (
    includesAny(haystack, [
      "βαλιτ",
      "case",
      "givi",
      "shad",
      "topcase",
      "top case",
      "eksoplismos-motosikletas",
    ])
  ) {
    pushUnique(recommendations, {
      title: "Βάσεις και πλάτες",
      reason: "Το απαραίτητο ταίριασμα για βαλίτσες και συνεπιβάτη.",
      href: "/search?q=base%20plate",
      tag: "Luggage",
    });
    pushUnique(recommendations, {
      title: "Tank bag / tail bag",
      reason: "Γρήγορος χώρος χωρίς μόνιμη εγκατάσταση.",
      href: "/search?q=tank%20bag",
      tag: "Storage",
    });
  }

  for (const item of DEFAULT_RECOMMENDATIONS) {
    pushUnique(recommendations, item);
  }

  return recommendations.slice(0, limit);
}
