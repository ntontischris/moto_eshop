export const searchableAttributes = [
  "name",
  "brand",
  "category_name",
  "description",
  "sku",
];

export const filterableAttributes = [
  "brand_slug",
  "category_slug",
  "price",
  "rating",
  "in_stock",
  "certification",
  "rider_type",
];

export const sortableAttributes = ["price", "rating", "created_at", "name"];

export const synonyms: Record<string, string[]> = {
  κράνος: ["helmet", "casque", "krano"],
  κράνη: ["helmets", "κράνος"],
  γάντια: ["gloves", "gantia"],
  γάντι: ["glove", "γάντια"],
  μπουφάν: ["jacket"],
  προστατευτικό: ["protective", "protector"],
  μπότες: ["boots", "mpotes"],
  μπότα: ["boot", "μπότες"],
  παντελόνι: ["pants", "trousers", "panteloni"],
  ενδοεπικοινωνία: ["intercom", "bluetooth", "endoepikoinonia"],
  λάστιχο: ["tyre", "tire", "lastixo"],
  λάστιχα: ["tyres", "tires", "λάστιχο"],
  λάδι: ["oil", "ladi"],
  φρένο: ["brake", "freno"],
  φρένα: ["brakes", "φρένο"],
  αλυσίδα: ["chain", "alisida"],
  kranos: ["κράνος", "helmet"],
  gantia: ["γάντια", "gloves"],
  mpotes: ["μπότες", "boots"],
  lastixo: ["λάστιχο", "tyre", "tire"],
};

export const typoTolerance = {
  enabled: true,
  minWordSizeForTypos: {
    oneTypo: 4,
    twoTypos: 8,
  },
  disableOnWords: [] as string[],
  disableOnAttributes: ["sku"],
};

export const pagination = {
  maxTotalHits: 10000,
};
