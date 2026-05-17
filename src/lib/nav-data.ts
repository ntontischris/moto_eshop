/* Auto-generated from the CLEAN Supabase category tree (post-reparent).
   Mirrors real motomarket-shop.gr taxonomy. 3 levels for the mega menu;
   my-bike stops at brand level. Regenerate via %TEMP%/gen_nav2.py after
   category tree changes. Slugs match /category/[slug] routes. */

export type NavL3 = { slug: string; el: string };
export type NavL2 = { slug: string; el: string; children: NavL3[] };
export type NavRoot = {
  slug: string;
  el: string;
  en: string;
  sale?: boolean;
  children: NavL2[];
};

export const NAV: NavRoot[] = [
  {
    slug: "eksoplismos-anabath",
    el: "Εξοπλισμός αναβάτη",
    en: "Rider Gear",
    children: [
      {
        slug: "eksoplismos-anabath--endysh",
        el: "Ένδυση",
        children: [
          { slug: "endysh--adiabroxa", el: "Αδιάβροχα" },
          { slug: "endysh--gantia", el: "Γάντια" },
          { slug: "endysh--gileka", el: "Γιλέκα" },
          { slug: "endysh--dermatines-formes", el: "Δερμάτινες Φόρμες" },
          { slug: "endysh--diafora", el: "Διάφορα" },
          { slug: "endysh--isothermika", el: "Ισοθερμικά" },
          { slug: "endysh--mployzakia", el: "Μπλουζάκια" },
          { slug: "endysh--mpoyfan", el: "Μπουφάν" },
          { slug: "endysh--pantelonia", el: "Παντελόνια" },
          { slug: "endysh--prostasies-aksesoyar", el: "Προστασίες - Αξεσουάρ" },
        ],
      },
      {
        slug: "eksoplismos-anabath--aksesoyar-anabath",
        el: "Αξεσουάρ αναβάτη",
        children: [
          { slug: "aksesoyar-anabath--gyalia", el: "Γυαλιά" },
          { slug: "aksesoyar-anabath--diafora", el: "Διάφορα" },
          { slug: "aksesoyar-anabath--thhkes-mprelok", el: "Θήκες - Μπρελόκ" },
          { slug: "aksesoyar-anabath--kalymmata-podion-xerion-koybertes", el: "Καλύμματα ποδιών & χεριών - Κουβέρτες" },
          { slug: "aksesoyar-anabath--prostasies-laimoy-balaclava", el: "Προστασίες λαιμού - Balaclava" },
          { slug: "aksesoyar-anabath--sakidia-tsantakia-mpananes", el: "Σακίδια – Τσαντάκια - Μπανάνες" },
          { slug: "aksesoyar-anabath--synthrhsh-eksoplismoy", el: "Συντήρηση εξοπλισμού" },
          { slug: "aksesoyar-anabath--yfasmatines-maskes", el: "Υφασμάτινες μάσκες" },
        ],
      },
      {
        slug: "eksoplismos-anabath--kranh-endoep-nies-kameres",
        el: "Κράνη-Ενδοεπ/νίες-Κάμερες",
        children: [
          { slug: "kranh-endoep-nies-kameres--adventure", el: "Adventure" },
          { slug: "kranh-endoep-nies-kameres--custom-retro", el: "Custom - Retro" },
          { slug: "kranh-endoep-nies-kameres--flip-up", el: "Flip up" },
          { slug: "kranh-endoep-nies-kameres--full-face", el: "Full Face" },
          { slug: "kranh-endoep-nies-kameres--jet", el: "Jet" },
          { slug: "kranh-endoep-nies-kameres--off-road", el: "Off Road" },
          { slug: "kranh-endoep-nies-kameres--aksesoyar-antallaktika", el: "Αξεσουάρ - Ανταλλακτικά" },
          { slug: "kranh-endoep-nies-kameres--endoepikoinonies-bluetooth-gps", el: "Ενδοεπικοινωνίες - Bluetooth - GPS" },
        ],
      },
      {
        slug: "eksoplismos-anabath--mpotes",
        el: "Μπότες",
        children: [
          { slug: "mpotes--off-road", el: "Off Road" },
          { slug: "mpotes--racing-mpotes", el: "Racing μπότες" },
          { slug: "mpotes--street", el: "Street" },
          { slug: "mpotes--urban-mpotes-sneakers", el: "Urban μπότες - Sneakers" },
          { slug: "mpotes--aksesoyar-gia-mpotes", el: "Αξεσουάρ για μπότες" },
        ],
      },
      {
        slug: "eksoplismos-anabath--paidika",
        el: "Παιδικά",
        children: [
          { slug: "paidika--endysh-prostasies", el: "Ένδυση - Προστασίες" },
          { slug: "paidika--kranh", el: "Κράνη" },
        ],
      },
    ],
  },
  {
    slug: "eksoplismos-motosikletas",
    el: "Εξοπλισμός μοτοσικλέτας",
    en: "Bike Equipment",
    children: [
      {
        slug: "eksoplismos-motosikletas--soft-bags",
        el: "Soft bags",
        children: [
          { slug: "soft-bags--tank-bags", el: "Tank bags" },
          { slug: "soft-bags--sakoi-scooter", el: "Σάκοι scooter" },
          { slug: "soft-bags--sakoi-oyras", el: "Σάκοι ουράς" },
          { slug: "soft-bags--sakoi-plainoi", el: "Σάκοι πλαϊνοί" },
        ],
      },
      {
        slug: "eksoplismos-motosikletas--anabatoria-orthostates-motolift",
        el: "Αναβατόρια - Ορθοστάτες - Motolift",
        children: [],
      },
      {
        slug: "eksoplismos-motosikletas--antikleptika",
        el: "Αντικλεπτικά",
        children: [],
      },
      {
        slug: "eksoplismos-motosikletas--baseis-kinhton",
        el: "Βάσεις κινητών",
        children: [
          { slug: "baseis-kinhton--baseis-kinhton", el: "Βάσεις κινητών" },
          { slug: "baseis-kinhton--eksarthmata", el: "Εξαρτήματα" },
        ],
      },
      {
        slug: "eksoplismos-motosikletas--balitses",
        el: "Βαλίτσες",
        children: [
          { slug: "balitses--aksesoyar-antallaktika", el: "Αξεσουάρ - Ανταλλακτικά" },
          { slug: "balitses--kentrikes-balitses", el: "Κεντρικές βαλίτσες" },
          { slug: "balitses--plaines-balitses", el: "Πλαϊνές βαλίτσες" },
        ],
      },
      {
        slug: "eksoplismos-motosikletas--eksarthmata-aksesoyar",
        el: "Εξαρτήματα - Αξεσουάρ",
        children: [
          { slug: "eksarthmata-aksesoyar--kalymmata-rezerboyar", el: "Καλύμματα ρεζερβουάρ" },
          { slug: "eksarthmata-aksesoyar--loipa-aksesoyar", el: "Λοιπά αξεσουάρ" },
          { slug: "eksarthmata-aksesoyar--othones-plohghshs", el: "Οθόνες πλοήγησης" },
          { slug: "eksarthmata-aksesoyar--fotismos", el: "Φωτισμός" },
          { slug: "eksarthmata-aksesoyar--xeirolabes-prostasies-ntepozitoy-aytokollhta", el: "Χειρολαβές - Προστασίες ντεποζίτου - Αυτοκόλλητα" },
        ],
      },
      {
        slug: "eksoplismos-motosikletas--eksatmiseis",
        el: "Εξατμίσεις",
        children: [],
      },
      {
        slug: "eksoplismos-motosikletas--zelatines",
        el: "Ζελατίνες",
        children: [],
      },
      {
        slug: "eksoplismos-motosikletas--kalymmata-motosikletas",
        el: "Καλύμματα μοτοσικλέτας",
        children: [],
      },
      {
        slug: "eksoplismos-motosikletas--kalymmata-podion-xerion",
        el: "Καλύμματα ποδιών & χεριών",
        children: [
          { slug: "kalymmata-podion-xerion--kalymmata-podion-koybertes", el: "Καλύμματα ποδιών - Κουβέρτες" },
          { slug: "kalymmata-podion-xerion--kalymmata-xerion-xoyftes", el: "Καλύμματα χεριών - Χούφτες" },
        ],
      },
      {
        slug: "eksoplismos-motosikletas--karines-mudguards-xoyftes",
        el: "Καρίνες - Mudguards - χούφτες",
        children: [],
      },
      {
        slug: "eksoplismos-motosikletas--plates-moto",
        el: "Πλάτες moto",
        children: [],
      },
      {
        slug: "eksoplismos-motosikletas--prostateytika-motosikletas",
        el: "Προστατευτικά μοτοσικλέτας",
        children: [],
      },
      {
        slug: "eksoplismos-motosikletas--systhmata-prosarmoghs",
        el: "Συστήματα προσαρμογής",
        children: [
          { slug: "systhmata-prosarmoghs--gia-kentrikes-balitses", el: "Για κεντρικές βαλίτσες" },
          { slug: "systhmata-prosarmoghs--gia-plaines-balitses", el: "Για πλαϊνές βαλίτσες" },
          { slug: "systhmata-prosarmoghs--gia-rezerboyar", el: "Για ρεζερβουάρ" },
          { slug: "systhmata-prosarmoghs--gia-sakoys", el: "Για σάκους" },
        ],
      },
      {
        slug: "eksoplismos-motosikletas--filtra",
        el: "Φίλτρα",
        children: [],
      },
    ],
  },
  {
    slug: "off-road",
    el: "Off-Road",
    en: "Off-Road",
    children: [
      {
        slug: "off-road--off-road-anabaths",
        el: "Off-Road αναβάτης",
        children: [
          { slug: "off-road-anabaths--endysh-off-road", el: "Ένδυση Off Road" },
          { slug: "off-road-anabaths--adiabroxa-mx-enduro", el: "Αδιάβροχα MX-Enduro" },
          { slug: "off-road-anabaths--aksesoyar-maskes", el: "Αξεσουάρ - μάσκες" },
          { slug: "off-road-anabaths--gantia", el: "Γάντια" },
          { slug: "off-road-anabaths--kaltses-yposthriksh-arthroseon", el: "Κάλτσες - Υποστήριξη αρθρώσεων" },
          { slug: "off-road-anabaths--kolara-laimoy", el: "Κολάρα λαιμού" },
          { slug: "off-road-anabaths--kranh-mx-enduro", el: "Κράνη MX-Enduro" },
          { slug: "off-road-anabaths--mpotes", el: "Μπότες" },
          { slug: "off-road-anabaths--prostasies-off-road", el: "Προστασίες Off Road" },
          { slug: "off-road-anabaths--tsantes-sakidia", el: "Τσάντες - Σακίδια" },
        ],
      },
      {
        slug: "off-road--off-road-motosikleta",
        el: "Off-Road μοτοσικλέτα",
        children: [
          { slug: "off-road-motosikleta--eksarthmata-aksesoyar", el: "Εξαρτήματα - Αξεσουάρ" },
          { slug: "off-road-motosikleta--plastika-merh", el: "Πλαστικά μέρη" },
          { slug: "off-road-motosikleta--prostasies-xerion-xoyftes", el: "Προστασίες χεριών - Χούφτες" },
        ],
      },
    ],
  },
  {
    slug: "podhlatika",
    el: "ΠΟΔΗΛΑΤΙΚΑ",
    en: "Cycling",
    children: [
      {
        slug: "podhlatika--antikleptika-podhlatoy",
        el: "Αντικλεπτικά ποδηλάτου",
        children: [],
      },
      {
        slug: "podhlatika--aksesoyar-podhlath",
        el: "Αξεσουάρ ποδηλάτη",
        children: [
          { slug: "aksesoyar-podhlath--maskes-gyalia-podhlasias", el: "Μάσκες - Γυαλιά ποδηλασίας" },
          { slug: "aksesoyar-podhlath--sakidia-mpananes-podhlath", el: "Σακίδια - Μπανάνες ποδηλάτη" },
        ],
      },
      {
        slug: "podhlatika--aksesoyar-podhlatoy",
        el: "Αξεσουάρ ποδηλάτου",
        children: [],
      },
      {
        slug: "podhlatika--podhlatika-kranh",
        el: "Ποδηλατικά κράνη",
        children: [],
      },
      {
        slug: "podhlatika--podhlatika-papoytsia",
        el: "Ποδηλατικά παπούτσια",
        children: [],
      },
      {
        slug: "podhlatika--podhlatikh-endysh",
        el: "Ποδηλατική ένδυση",
        children: [
          { slug: "podhlatikh-endysh--kaltses", el: "Κάλτσες" },
          { slug: "podhlatikh-endysh--podhlatika-gantia", el: "Ποδηλατικά γάντια" },
          { slug: "podhlatikh-endysh--podhlatika-pantelonia", el: "Ποδηλατικά παντελόνια" },
          { slug: "podhlatikh-endysh--podhlatikes-mployzes", el: "Ποδηλατικές μπλούζες" },
        ],
      },
      {
        slug: "podhlatika--prostasies-podhlath",
        el: "Προστασίες ποδηλάτη",
        children: [],
      },
    ],
  },
  {
    slug: "lipantika",
    el: "Λιπαντικά",
    en: "Lubricants",
    children: [
      {
        slug: "lipantika--chain-lubes",
        el: "Chain lubes",
        children: [],
      },
      {
        slug: "lipantika--chemicals",
        el: "Chemicals",
        children: [],
      },
      {
        slug: "lipantika--fork-oils",
        el: "Fork oils",
        children: [],
      },
      {
        slug: "lipantika--moto-2t",
        el: "Moto 2T",
        children: [],
      },
      {
        slug: "lipantika--moto-4t",
        el: "Moto 4T",
        children: [],
      },
      {
        slug: "lipantika--scooter",
        el: "Scooter",
        children: [],
      },
    ],
  },
  {
    slug: "my-bike",
    el: "My Βike",
    en: "My Bike",
    children: [
      {
        slug: "my-bike--aprilia",
        el: "Aprilia",
        children: [],
      },
      {
        slug: "my-bike--bmw",
        el: "BMW",
        children: [],
      },
      {
        slug: "my-bike--benelli",
        el: "Benelli",
        children: [],
      },
      {
        slug: "my-bike--cf-moto",
        el: "CF Moto",
        children: [],
      },
      {
        slug: "my-bike--ducati",
        el: "Ducati",
        children: [],
      },
      {
        slug: "my-bike--gilera",
        el: "Gilera",
        children: [],
      },
      {
        slug: "my-bike--honda",
        el: "Honda",
        children: [],
      },
      {
        slug: "my-bike--husqvarna",
        el: "Husqvarna",
        children: [],
      },
      {
        slug: "my-bike--ktm",
        el: "KTM",
        children: [],
      },
      {
        slug: "my-bike--kawasaki",
        el: "Kawasaki",
        children: [],
      },
      {
        slug: "my-bike--keeway",
        el: "Keeway",
        children: [],
      },
      {
        slug: "my-bike--kove",
        el: "Kove",
        children: [],
      },
      {
        slug: "my-bike--kymco",
        el: "Kymco",
        children: [],
      },
      {
        slug: "my-bike--mbk",
        el: "MBK",
        children: [],
      },
      {
        slug: "my-bike--morbidelli",
        el: "MORBIDELLI",
        children: [],
      },
      {
        slug: "my-bike--moto-morini",
        el: "MOTO MORINI",
        children: [],
      },
      {
        slug: "my-bike--moto-guzzi",
        el: "Moto Guzzi",
        children: [],
      },
      {
        slug: "my-bike--peugeot",
        el: "Peugeot",
        children: [],
      },
      {
        slug: "my-bike--piaggio",
        el: "Piaggio",
        children: [],
      },
      {
        slug: "my-bike--qj-motor",
        el: "QJ Motor",
        children: [],
      },
      {
        slug: "my-bike--royal-enfield",
        el: "Royal Enfield",
        children: [],
      },
      {
        slug: "my-bike--sym",
        el: "SYM",
        children: [],
      },
      {
        slug: "my-bike--suzuki",
        el: "Suzuki",
        children: [],
      },
      {
        slug: "my-bike--triumph",
        el: "Triumph",
        children: [],
      },
      {
        slug: "my-bike--voge",
        el: "Voge",
        children: [],
      },
      {
        slug: "my-bike--yamaha",
        el: "Yamaha",
        children: [],
      },
      {
        slug: "my-bike--zontes",
        el: "Zontes",
        children: [],
      },
    ],
  },
  {
    slug: "prosfores",
    el: "ΠΡΟΣΦΟΡΕΣ",
    en: "Offers",
    sale: true,
    children: [
      {
        slug: "prosfores--mx-enduro",
        el: "MX-Enduro",
        children: [
          { slug: "mx-enduro--mx-enduro-endysh", el: "MX-Enduro Ένδυση" },
          { slug: "mx-enduro--mx-enduro-gantia", el: "MX-Enduro Γάντια" },
          { slug: "mx-enduro--mx-enduro-kranh", el: "MX-Enduro Κράνη" },
          { slug: "mx-enduro--mx-enduro-maskes", el: "MX-Enduro Μάσκες" },
          { slug: "mx-enduro--mx-enduro-mpotes", el: "MX-Enduro Μπότες" },
          { slug: "mx-enduro--mx-enduro-prostasia", el: "MX-Enduro Προστασία" },
        ],
      },
      {
        slug: "prosfores--endysh",
        el: "Ένδυση",
        children: [],
      },
      {
        slug: "prosfores--aksesoyar-anabath",
        el: "Αξεσουάρ Αναβάτη",
        children: [],
      },
      {
        slug: "prosfores--aksesoyar-motosykletas",
        el: "Αξεσουάρ Μοτοσυκλέτας",
        children: [],
      },
      {
        slug: "prosfores--kranh",
        el: "Κράνη",
        children: [
          { slug: "kranh--flip-up", el: "Flip Up" },
          { slug: "kranh--full-face", el: "Full Face" },
          { slug: "kranh--jet", el: "Jet" },
          { slug: "kranh--off-road", el: "Off Road" },
        ],
      },
      {
        slug: "prosfores--mtb",
        el: "ΜΤΒ",
        children: [
          { slug: "mtb--mtb-aksesoyar", el: "MTB Αξεσουάρ" },
          { slug: "mtb--mtb-prostateytika", el: "MTB Προστατευτικά" },
          { slug: "mtb--mtb-endysh", el: "ΜΤΒ Ένδυση" },
          { slug: "mtb--mtb-kranh", el: "ΜΤΒ Κράνη" },
        ],
      },
      {
        slug: "prosfores--mpotes",
        el: "Μπότες",
        children: [],
      },
    ],
  },
];
