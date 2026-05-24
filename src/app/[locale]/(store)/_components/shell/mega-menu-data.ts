export type MegaMenuLink = {
  label: string;
  href: string;
  meta?: string;
};

export type MegaMenuColumn = {
  title: string;
  links: MegaMenuLink[];
};

export type MegaMenuPanel = {
  key: string;
  label: string;
  href: string;
  eyebrow: string;
  title: string;
  image: string;
  accent?: boolean;
  quickLinks: MegaMenuLink[];
  columns: MegaMenuColumn[];
};

export const MEGA_MENU_CLOSE_DELAY_MS = 180;

export const MEGA_MENU_PANELS = [
  {
    key: "rider",
    label: "Εξοπλισμός αναβάτη",
    href: "/category/eksoplismos-anabath",
    eyebrow: "Rider categories",
    title: "Κράνη, ένδυση, μπότες και αξεσουάρ αναβάτη.",
    image: "/mega-menu/category-rider-gear.webp",
    quickLinks: [
      { label: "Full Face", href: "/category/kranh-endoep-nies-kameres--full-face", meta: "Sport / touring" },
      { label: "Μπουφάν", href: "/category/endysh--mpoyfan", meta: "Textile / leather" },
      { label: "Γάντια", href: "/category/endysh--gantia", meta: "Racing / urban" },
      { label: "Μπότες", href: "/category/eksoplismos-anabath--mpotes", meta: "Street / racing" },
    ],
    columns: [
      {
        title: "Κράνη",
        links: [
          { label: "Full Face Κράνη", href: "/category/kranh-endoep-nies-kameres--full-face" },
          { label: "Flip up Κράνη", href: "/category/kranh-endoep-nies-kameres--flip-up" },
          { label: "Jet Κράνη", href: "/category/kranh-endoep-nies-kameres--jet" },
          { label: "Adventure Κράνη", href: "/category/kranh-endoep-nies-kameres--adventure" },
          { label: "Off Road Κράνη", href: "/category/kranh-endoep-nies-kameres--off-road" },
        ],
      },
      {
        title: "Ένδυση",
        links: [
          { label: "Δερμάτινες φόρμες", href: "/category/endysh--dermatines-formes" },
          { label: "Μπουφάν", href: "/category/endysh--mpoyfan" },
          { label: "Παντελόνια", href: "/category/endysh--pantelonia" },
          { label: "Γάντια", href: "/category/endysh--gantia" },
          { label: "Αδιάβροχα", href: "/category/endysh--adiabroxa" },
        ],
      },
      {
        title: "Μπότες & αξεσουάρ",
        links: [
          { label: "Adventure Μπότες", href: "/category/eksoplismos-anabath--mpotes" },
          { label: "Touring Μπότες", href: "/category/eksoplismos-anabath--mpotes" },
          { label: "Racing Μπότες", href: "/category/mpotes--racing-mpotes" },
          { label: "Urban Μπότες - Sneakers", href: "/category/mpotes--urban-mpotes-sneakers" },
          { label: "Αξεσουάρ αναβάτη", href: "/category/eksoplismos-anabath--aksesoyar-anabath" },
        ],
      },
    ],
  },
  {
    key: "bike",
    label: "Εξοπλισμός μοτοσικλέτας",
    href: "/category/eksoplismos-motosikletas",
    eyebrow: "Bike equipment",
    title: "Βαλίτσες, βάσεις, προστασία και setup μηχανής.",
    image: "/mega-menu/category-bike-equipment.webp",
    quickLinks: [
      { label: "Βαλίτσες", href: "/category/eksoplismos-motosikletas--balitses", meta: "Top / side" },
      { label: "Soft bags", href: "/category/eksoplismos-motosikletas--soft-bags", meta: "Tank / tail" },
      { label: "Βάσεις κινητών", href: "/category/eksoplismos-motosikletas--baseis-kinhton", meta: "Phone cockpit" },
      { label: "Ζελατίνες", href: "/category/eksoplismos-motosikletas--zelatines", meta: "Wind control" },
    ],
    columns: [
      {
        title: "Βαλίτσες & soft bags",
        links: [
          { label: "Κεντρικές βαλίτσες", href: "/category/balitses--kentrikes-balitses" },
          { label: "Πλαϊνές βαλίτσες", href: "/category/balitses--plaines-balitses" },
          { label: "Tank bags", href: "/category/soft-bags--tank-bags" },
          { label: "Σάκοι ουράς", href: "/category/soft-bags--sakoi-oyras" },
          { label: "Συστήματα προσαρμογής", href: "/category/eksoplismos-motosikletas--systhmata-prosarmoghs" },
        ],
      },
      {
        title: "Αξεσουάρ",
        links: [
          { label: "Βάσεις κινητών", href: "/category/eksoplismos-motosikletas--baseis-kinhton" },
          { label: "Αντικλεπτικά - Κλειδαριές", href: "/category/eksoplismos-motosikletas--antikleptika" },
          { label: "Προστατευτικά μοτοσικλέτας", href: "/category/eksoplismos-motosikletas--prostateytika-motosikletas" },
          { label: "Καλύμματα μοτοσικλέτας", href: "/category/eksoplismos-motosikletas--kalymmata-motosikletas" },
          { label: "Ζελατίνες", href: "/category/eksoplismos-motosikletas--zelatines" },
        ],
      },
      {
        title: "Service setup",
        links: [
          { label: "Εξατμίσεις", href: "/category/eksoplismos-motosikletas--eksatmiseis" },
          { label: "Φίλτρα", href: "/category/eksoplismos-motosikletas--filtra" },
          { label: "Αναβατόρια - Ορθοστάτες", href: "/category/eksoplismos-motosikletas--anabatoria-orthostates-motolift" },
          { label: "Καρίνες - Mudguards - χούφτες", href: "/category/eksoplismos-motosikletas--karines-mudguards-xoyftes" },
          { label: "Πλάτες moto", href: "/category/eksoplismos-motosikletas--plates-moto" },
        ],
      },
    ],
  },
  {
    key: "offroad",
    label: "Off-Road",
    href: "/category/off-road",
    eyebrow: "MX-Enduro",
    title: "Off-road αναβάτης και μοτοσικλέτα για χώμα.",
    image: "/mega-menu/category-off-road.webp",
    quickLinks: [
      { label: "MX κράνη", href: "/category/off-road-anabaths--kranh-mx-enduro", meta: "Enduro ready" },
      { label: "Μπότες", href: "/category/off-road-anabaths--mpotes", meta: "Trail protection" },
      { label: "Προστασίες", href: "/category/off-road-anabaths--prostasies-off-road", meta: "Armor / chest" },
      { label: "Πλαστικά", href: "/category/off-road-motosikleta--plastika-merh", meta: "Bike parts" },
    ],
    columns: [
      {
        title: "Off-Road αναβάτης",
        links: [
          { label: "Κράνη MX-Enduro", href: "/category/off-road-anabaths--kranh-mx-enduro" },
          { label: "Ένδυση MX-Enduro", href: "/category/off-road-anabaths--endysh-off-road" },
          { label: "Γάντια MX-Enduro", href: "/category/off-road-anabaths--gantia" },
          { label: "Μπότες MX-Enduro", href: "/category/off-road-anabaths--mpotes" },
          { label: "Προστασίες", href: "/category/off-road-anabaths--prostasies-off-road" },
        ],
      },
      {
        title: "Αξεσουάρ αναβάτη",
        links: [
          { label: "Τσάντες - Σακίδια - Μπανάνες", href: "/category/off-road-anabaths--tsantes-sakidia" },
          { label: "Αξεσουάρ - μάσκες", href: "/category/off-road-anabaths--aksesoyar-maskes" },
          { label: "Κάλτσες - Υποστήριξη αρθρώσεων", href: "/category/off-road-anabaths--kaltses-yposthriksh-arthroseon" },
          { label: "Κολάρα λαιμού", href: "/category/off-road-anabaths--kolara-laimoy" },
          { label: "Αδιάβροχα MX-Enduro", href: "/category/off-road-anabaths--adiabroxa-mx-enduro" },
        ],
      },
      {
        title: "Off-Road μοτοσικλέτα",
        links: [
          { label: "Πλαστικά μέρη", href: "/category/off-road-motosikleta--plastika-merh" },
          { label: "Προστασίες χεριών - Χούφτες", href: "/category/off-road-motosikleta--prostasies-xerion-xoyftes" },
          { label: "Εξαρτήματα - Αξεσουάρ", href: "/category/off-road-motosikleta--eksarthmata-aksesoyar" },
        ],
      },
    ],
  },
  {
    key: "cycling",
    label: "ΠΟΔΗΛΑΤΙΚΑ/e-Bike",
    href: "/category/podhlatika",
    eyebrow: "Cycling & e-Bike",
    title: "Ποδηλατικός εξοπλισμός, ένδυση και αξεσουάρ.",
    image: "/mega-menu/category-cycling-ebike.webp",
    quickLinks: [
      { label: "Κράνη", href: "/category/podhlatika--podhlatika-kranh", meta: "City / MTB" },
      { label: "Παπούτσια", href: "/category/podhlatika--podhlatika-papoytsia", meta: "Ride fit" },
      { label: "Γάντια", href: "/category/podhlatikh-endysh--podhlatika-gantia", meta: "Grip control" },
      { label: "Αξεσουάρ", href: "/category/podhlatika--aksesoyar-podhlatoy", meta: "Bike setup" },
    ],
    columns: [
      {
        title: "Εξοπλισμός ποδηλάτη",
        links: [
          { label: "Ποδηλατικά κράνη", href: "/category/podhlatika--podhlatika-kranh" },
          { label: "Ποδηλατικά παπούτσια", href: "/category/podhlatika--podhlatika-papoytsia" },
          { label: "Προστασίες ποδηλάτη", href: "/category/podhlatika--prostasies-podhlath" },
          { label: "Αξεσουάρ ποδηλάτη", href: "/category/podhlatika--aksesoyar-podhlath" },
        ],
      },
      {
        title: "Ποδηλατική ένδυση",
        links: [
          { label: "Ποδηλατικές μπλούζες", href: "/category/podhlatikh-endysh--podhlatikes-mployzes" },
          { label: "Ποδηλατικά παντελόνια", href: "/category/podhlatikh-endysh--podhlatika-pantelonia" },
          { label: "Ποδηλατικά γάντια", href: "/category/podhlatikh-endysh--podhlatika-gantia" },
          { label: "Κάλτσες", href: "/category/podhlatikh-endysh--kaltses" },
        ],
      },
      {
        title: "Αξεσουάρ",
        links: [
          { label: "Σακίδια - Μπανάνες ποδηλάτη", href: "/category/aksesoyar-podhlath--sakidia-mpananes-podhlath" },
          { label: "Μάσκες - Γυαλιά ποδηλασίας", href: "/category/aksesoyar-podhlath--maskes-gyalia-podhlasias" },
          { label: "Αξεσουάρ ποδηλάτου", href: "/category/podhlatika--aksesoyar-podhlatoy" },
          { label: "Αντικλεπτικά ποδηλάτου", href: "/category/podhlatika--antikleptika-podhlatoy" },
        ],
      },
    ],
  },
  {
    key: "lubricants",
    label: "Λιπαντικά",
    href: "/category/lipantika",
    eyebrow: "Service essentials",
    title: "Λάδια, chain lubes, fork oils και χημικά.",
    image: "/mega-menu/category-lubricants.webp",
    quickLinks: [
      { label: "Moto 4T", href: "/category/lipantika--moto-4t", meta: "Engine oil" },
      { label: "Moto 2T", href: "/category/lipantika--moto-2t", meta: "Two stroke" },
      { label: "Chain lubes", href: "/category/lipantika--chain-lubes", meta: "Chain care" },
      { label: "Chemicals", href: "/category/lipantika--chemicals", meta: "Clean / protect" },
    ],
    columns: [
      {
        title: "Λάδια",
        links: [
          { label: "Moto 4T", href: "/category/lipantika--moto-4t" },
          { label: "Moto 2T", href: "/category/lipantika--moto-2t" },
          { label: "Scooter", href: "/category/lipantika--scooter" },
          { label: "Fork oils", href: "/category/lipantika--fork-oils" },
        ],
      },
      {
        title: "Συντήρηση",
        links: [
          { label: "Chain lubes", href: "/category/lipantika--chain-lubes" },
          { label: "Chemicals", href: "/category/lipantika--chemicals" },
        ],
      },
      {
        title: "Γρήγορη επιλογή",
        links: [
          { label: "Όλα τα λιπαντικά", href: "/category/lipantika" },
          { label: "Service basket", href: "/category/lipantika" },
          { label: "Bike Finder", href: "#my-bike" },
        ],
      },
    ],
  },
  {
    key: "mybike",
    label: "My Bike",
    href: "/category/my-bike",
    eyebrow: "Find by motorcycle",
    title: "Βρες εξοπλισμό με βάση τη μάρκα της μηχανής.",
    image: "/mega-menu/category-my-bike.webp",
    quickLinks: [
      { label: "Honda", href: "/category/my-bike--honda", meta: "Popular fitment" },
      { label: "Yamaha", href: "/category/my-bike--yamaha", meta: "Popular fitment" },
      { label: "BMW", href: "/category/my-bike--bmw", meta: "Touring / adventure" },
      { label: "KTM", href: "/category/my-bike--ktm", meta: "Street / off-road" },
    ],
    columns: [
      {
        title: "Brands A-K",
        links: [
          { label: "Aprilia", href: "/category/my-bike--aprilia" },
          { label: "Benelli", href: "/category/my-bike--benelli" },
          { label: "BMW", href: "/category/my-bike--bmw" },
          { label: "CF Moto", href: "/category/my-bike--cf-moto" },
          { label: "Ducati", href: "/category/my-bike--ducati" },
          { label: "Gilera", href: "/category/my-bike--gilera" },
          { label: "Honda", href: "/category/my-bike--honda" },
          { label: "Husqvarna", href: "/category/my-bike--husqvarna" },
        ],
      },
      {
        title: "Brands K-P",
        links: [
          { label: "Kawasaki", href: "/category/my-bike--kawasaki" },
          { label: "Keeway", href: "/category/my-bike--keeway" },
          { label: "KTM", href: "/category/my-bike--ktm" },
          { label: "Kymco", href: "/category/my-bike--kymco" },
          { label: "MBK", href: "/category/my-bike--mbk" },
          { label: "Moto Guzzi", href: "/category/my-bike--moto-guzzi" },
          { label: "Peugeot", href: "/category/my-bike--peugeot" },
          { label: "Piaggio", href: "/category/my-bike--piaggio" },
        ],
      },
      {
        title: "Brands Q-Z",
        links: [
          { label: "QJ Motor", href: "/category/my-bike--qj-motor" },
          { label: "Royal Enfield", href: "/category/my-bike--royal-enfield" },
          { label: "Suzuki", href: "/category/my-bike--suzuki" },
          { label: "SYM", href: "/category/my-bike--sym" },
          { label: "Triumph", href: "/category/my-bike--triumph" },
          { label: "Yamaha", href: "/category/my-bike--yamaha" },
          { label: "Voge", href: "/category/my-bike--voge" },
          { label: "Zontes", href: "/category/my-bike--zontes" },
        ],
      },
    ],
  },
  {
    key: "offers",
    label: "ΠΡΟΣΦΟΡΕΣ",
    href: "/category/prosfores",
    eyebrow: "Live deals",
    title: "Προσφορές σε κράνη, ένδυση, μπότες και MX-Enduro.",
    image: "/mega-menu/category-offers.webp",
    accent: true,
    quickLinks: [
      { label: "Κράνη", href: "/category/prosfores--kranh", meta: "Full face / jet" },
      { label: "Ένδυση", href: "/category/prosfores--endysh", meta: "Jackets / pants" },
      { label: "Μπότες", href: "/category/prosfores--mpotes", meta: "Last sizes" },
      { label: "MX-Enduro", href: "/category/prosfores--mx-enduro", meta: "Off-road deals" },
    ],
    columns: [
      {
        title: "Κράνη",
        links: [
          { label: "Full Face", href: "/category/kranh--full-face" },
          { label: "Flip Up", href: "/category/kranh--flip-up" },
          { label: "Jet", href: "/category/kranh--jet" },
          { label: "Off Road", href: "/category/kranh--off-road" },
        ],
      },
      {
        title: "Ένδυση",
        links: [
          { label: "Μπουφάν", href: "/category/prosfores--endysh" },
          { label: "Γάντια", href: "/category/prosfores--endysh" },
          { label: "Παντελόνια", href: "/category/prosfores--endysh" },
          { label: "Δερμάτινες Φόρμες", href: "/category/prosfores--endysh" },
          { label: "Μπότες", href: "/category/prosfores--mpotes" },
        ],
      },
      {
        title: "MX / MTB / Extras",
        links: [
          { label: "MX-Enduro", href: "/category/prosfores--mx-enduro" },
          { label: "ΜΤΒ", href: "/category/prosfores--mtb" },
          { label: "Αξεσουάρ Αναβάτη", href: "/category/prosfores--aksesoyar-anabath" },
          { label: "Αξεσουάρ Μοτοσυκλέτας", href: "/category/prosfores--aksesoyar-motosykletas" },
        ],
      },
    ],
  },
] satisfies MegaMenuPanel[];
