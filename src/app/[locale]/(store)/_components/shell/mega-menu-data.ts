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
    href: "/eksoplismos-anabath",
    eyebrow: "Rider categories",
    title: "Κράνη, ένδυση, μπότες και αξεσουάρ αναβάτη.",
    image: "/mega-menu/category-rider-gear.webp",
    quickLinks: [
      { label: "Full Face", href: "/eksoplismos-anabath/kranh-endoep-nies-kameres/full-face", meta: "Sport / touring" },
      { label: "Μπουφάν", href: "/eksoplismos-anabath/endysh/mpoyfan", meta: "Textile / leather" },
      { label: "Γάντια", href: "/eksoplismos-anabath/endysh/gantia", meta: "Racing / urban" },
      { label: "Μπότες", href: "/eksoplismos-anabath/mpotes", meta: "Street / racing" },
    ],
    columns: [
      {
        title: "Κράνη",
        links: [
          { label: "Full Face Κράνη", href: "/eksoplismos-anabath/kranh-endoep-nies-kameres/full-face" },
          { label: "Flip up Κράνη", href: "/eksoplismos-anabath/kranh-endoep-nies-kameres/flip-up" },
          { label: "Jet Κράνη", href: "/eksoplismos-anabath/kranh-endoep-nies-kameres/jet" },
          { label: "Adventure Κράνη", href: "/eksoplismos-anabath/kranh-endoep-nies-kameres/adventure" },
          { label: "Off Road Κράνη", href: "/eksoplismos-anabath/kranh-endoep-nies-kameres/off-road" },
        ],
      },
      {
        title: "Ένδυση",
        links: [
          { label: "Δερμάτινες φόρμες", href: "/eksoplismos-anabath/endysh/dermatines-formes" },
          { label: "Μπουφάν", href: "/eksoplismos-anabath/endysh/mpoyfan" },
          { label: "Παντελόνια", href: "/eksoplismos-anabath/endysh/pantelonia" },
          { label: "Γάντια", href: "/eksoplismos-anabath/endysh/gantia" },
          { label: "Αδιάβροχα", href: "/eksoplismos-anabath/endysh/adiabroxa" },
        ],
      },
      {
        title: "Μπότες & αξεσουάρ",
        links: [
          { label: "Adventure Μπότες", href: "/eksoplismos-anabath/mpotes" },
          { label: "Touring Μπότες", href: "/eksoplismos-anabath/mpotes" },
          { label: "Racing Μπότες", href: "/eksoplismos-anabath/mpotes/racing-mpotes" },
          { label: "Urban Μπότες - Sneakers", href: "/eksoplismos-anabath/mpotes/urban-mpotes-sneakers" },
          { label: "Αξεσουάρ αναβάτη", href: "/eksoplismos-anabath/aksesoyar-anabath" },
        ],
      },
    ],
  },
  {
    key: "bike",
    label: "Εξοπλισμός μοτοσικλέτας",
    href: "/eksoplismos-motosikletas",
    eyebrow: "Bike equipment",
    title: "Βαλίτσες, βάσεις, προστασία και setup μηχανής.",
    image: "/mega-menu/category-bike-equipment.webp",
    quickLinks: [
      { label: "Βαλίτσες", href: "/eksoplismos-motosikletas/balitses", meta: "Top / side" },
      { label: "Soft bags", href: "/eksoplismos-motosikletas/soft-bags", meta: "Tank / tail" },
      { label: "Βάσεις κινητών", href: "/eksoplismos-motosikletas/baseis-kinhton", meta: "Phone cockpit" },
      { label: "Ζελατίνες", href: "/eksoplismos-motosikletas/zelatines", meta: "Wind control" },
    ],
    columns: [
      {
        title: "Βαλίτσες & soft bags",
        links: [
          { label: "Κεντρικές βαλίτσες", href: "/eksoplismos-motosikletas/balitses/kentrikes-balitses" },
          { label: "Πλαϊνές βαλίτσες", href: "/eksoplismos-motosikletas/balitses/plaines-balitses" },
          { label: "Tank bags", href: "/eksoplismos-motosikletas/soft-bags/tank-bags" },
          { label: "Σάκοι ουράς", href: "/eksoplismos-motosikletas/soft-bags/sakoi-oyras" },
          { label: "Συστήματα προσαρμογής", href: "/eksoplismos-motosikletas/systhmata-prosarmoghs" },
        ],
      },
      {
        title: "Αξεσουάρ",
        links: [
          { label: "Βάσεις κινητών", href: "/eksoplismos-motosikletas/baseis-kinhton" },
          { label: "Αντικλεπτικά - Κλειδαριές", href: "/eksoplismos-motosikletas/antikleptika" },
          { label: "Προστατευτικά μοτοσικλέτας", href: "/eksoplismos-motosikletas/prostateytika-motosikletas" },
          { label: "Καλύμματα μοτοσικλέτας", href: "/eksoplismos-motosikletas/kalymmata-motosikletas" },
          { label: "Ζελατίνες", href: "/eksoplismos-motosikletas/zelatines" },
        ],
      },
      {
        title: "Service setup",
        links: [
          { label: "Εξατμίσεις", href: "/eksoplismos-motosikletas/eksatmiseis" },
          { label: "Φίλτρα", href: "/eksoplismos-motosikletas/filtra" },
          { label: "Αναβατόρια - Ορθοστάτες", href: "/eksoplismos-motosikletas/anabatoria-orthostates-motolift" },
          { label: "Καρίνες - Mudguards - χούφτες", href: "/eksoplismos-motosikletas/karines-mudguards-xoyftes" },
          { label: "Πλάτες moto", href: "/eksoplismos-motosikletas/plates-moto" },
        ],
      },
    ],
  },
  {
    key: "offroad",
    label: "Off-Road",
    href: "/off-road",
    eyebrow: "MX-Enduro",
    title: "Off-road αναβάτης και μοτοσικλέτα για χώμα.",
    image: "/mega-menu/category-off-road.webp",
    quickLinks: [
      { label: "MX κράνη", href: "/off-road/off-road-anabaths/kranh-mx-enduro", meta: "Enduro ready" },
      { label: "Μπότες", href: "/off-road/off-road-anabaths/mpotes", meta: "Trail protection" },
      { label: "Προστασίες", href: "/off-road/off-road-anabaths/prostasies-off-road", meta: "Armor / chest" },
      { label: "Πλαστικά", href: "/off-road/off-road-motosikleta/plastika-merh", meta: "Bike parts" },
    ],
    columns: [
      {
        title: "Off-Road αναβάτης",
        links: [
          { label: "Κράνη MX-Enduro", href: "/off-road/off-road-anabaths/kranh-mx-enduro" },
          { label: "Ένδυση MX-Enduro", href: "/off-road/off-road-anabaths/endysh-off-road" },
          { label: "Γάντια MX-Enduro", href: "/off-road/off-road-anabaths/gantia" },
          { label: "Μπότες MX-Enduro", href: "/off-road/off-road-anabaths/mpotes" },
          { label: "Προστασίες", href: "/off-road/off-road-anabaths/prostasies-off-road" },
        ],
      },
      {
        title: "Αξεσουάρ αναβάτη",
        links: [
          { label: "Τσάντες - Σακίδια - Μπανάνες", href: "/off-road/off-road-anabaths/tsantes-sakidia" },
          { label: "Αξεσουάρ - μάσκες", href: "/off-road/off-road-anabaths/aksesoyar-maskes" },
          { label: "Κάλτσες - Υποστήριξη αρθρώσεων", href: "/off-road/off-road-anabaths/kaltses-yposthriksh-arthroseon" },
          { label: "Κολάρα λαιμού", href: "/off-road/off-road-anabaths/kolara-laimoy" },
          { label: "Αδιάβροχα MX-Enduro", href: "/off-road/off-road-anabaths/adiabroxa-mx-enduro" },
        ],
      },
      {
        title: "Off-Road μοτοσικλέτα",
        links: [
          { label: "Πλαστικά μέρη", href: "/off-road/off-road-motosikleta/plastika-merh" },
          { label: "Προστασίες χεριών - Χούφτες", href: "/off-road/off-road-motosikleta/prostasies-xerion-xoyftes" },
          { label: "Εξαρτήματα - Αξεσουάρ", href: "/off-road/off-road-motosikleta/eksarthmata-aksesoyar" },
        ],
      },
    ],
  },
  {
    key: "cycling",
    label: "ΠΟΔΗΛΑΤΙΚΑ/e-Bike",
    href: "/podhlatika",
    eyebrow: "Cycling & e-Bike",
    title: "Ποδηλατικός εξοπλισμός, ένδυση και αξεσουάρ.",
    image: "/mega-menu/category-cycling-ebike.webp",
    quickLinks: [
      { label: "Κράνη", href: "/podhlatika/podhlatika-kranh", meta: "City / MTB" },
      { label: "Παπούτσια", href: "/podhlatika/podhlatika-papoytsia", meta: "Ride fit" },
      { label: "Γάντια", href: "/podhlatika/podhlatikh-endysh/podhlatika-gantia", meta: "Grip control" },
      { label: "Αξεσουάρ", href: "/podhlatika/aksesoyar-podhlatoy", meta: "Bike setup" },
    ],
    columns: [
      {
        title: "Εξοπλισμός ποδηλάτη",
        links: [
          { label: "Ποδηλατικά κράνη", href: "/podhlatika/podhlatika-kranh" },
          { label: "Ποδηλατικά παπούτσια", href: "/podhlatika/podhlatika-papoytsia" },
          { label: "Προστασίες ποδηλάτη", href: "/podhlatika/prostasies-podhlath" },
          { label: "Αξεσουάρ ποδηλάτη", href: "/podhlatika/aksesoyar-podhlath" },
        ],
      },
      {
        title: "Ποδηλατική ένδυση",
        links: [
          { label: "Ποδηλατικές μπλούζες", href: "/podhlatika/podhlatikh-endysh/podhlatikes-mployzes" },
          { label: "Ποδηλατικά παντελόνια", href: "/podhlatika/podhlatikh-endysh/podhlatika-pantelonia" },
          { label: "Ποδηλατικά γάντια", href: "/podhlatika/podhlatikh-endysh/podhlatika-gantia" },
          { label: "Κάλτσες", href: "/podhlatika/podhlatikh-endysh/kaltses" },
        ],
      },
      {
        title: "Αξεσουάρ",
        links: [
          { label: "Σακίδια - Μπανάνες ποδηλάτη", href: "/podhlatika/aksesoyar-podhlath/sakidia-mpananes-podhlath" },
          { label: "Μάσκες - Γυαλιά ποδηλασίας", href: "/podhlatika/aksesoyar-podhlath/maskes-gyalia-podhlasias" },
          { label: "Αξεσουάρ ποδηλάτου", href: "/podhlatika/aksesoyar-podhlatoy" },
          { label: "Αντικλεπτικά ποδηλάτου", href: "/podhlatika/antikleptika-podhlatoy" },
        ],
      },
    ],
  },
  {
    key: "lubricants",
    label: "Λιπαντικά",
    href: "/lipantika",
    eyebrow: "Service essentials",
    title: "Λάδια, chain lubes, fork oils και χημικά.",
    image: "/mega-menu/category-lubricants.webp",
    quickLinks: [
      { label: "Moto 4T", href: "/lipantika/moto-4t", meta: "Engine oil" },
      { label: "Moto 2T", href: "/lipantika/moto-2t", meta: "Two stroke" },
      { label: "Chain lubes", href: "/lipantika/chain-lubes", meta: "Chain care" },
      { label: "Chemicals", href: "/lipantika/chemicals", meta: "Clean / protect" },
    ],
    columns: [
      {
        title: "Λάδια",
        links: [
          { label: "Moto 4T", href: "/lipantika/moto-4t" },
          { label: "Moto 2T", href: "/lipantika/moto-2t" },
          { label: "Scooter", href: "/lipantika/scooter" },
          { label: "Fork oils", href: "/lipantika/fork-oils" },
        ],
      },
      {
        title: "Συντήρηση",
        links: [
          { label: "Chain lubes", href: "/lipantika/chain-lubes" },
          { label: "Chemicals", href: "/lipantika/chemicals" },
        ],
      },
      {
        title: "Γρήγορη επιλογή",
        links: [
          { label: "Όλα τα λιπαντικά", href: "/lipantika" },
          { label: "Service basket", href: "/lipantika" },
          { label: "Bike Finder", href: "#my-bike" },
        ],
      },
    ],
  },
  {
    key: "mybike",
    label: "My Bike",
    href: "/my-bike",
    eyebrow: "Find by motorcycle",
    title: "Βρες εξοπλισμό με βάση τη μάρκα της μηχανής.",
    image: "/mega-menu/category-my-bike.webp",
    quickLinks: [
      { label: "Honda", href: "/my-bike/honda", meta: "Popular fitment" },
      { label: "Yamaha", href: "/my-bike/yamaha", meta: "Popular fitment" },
      { label: "BMW", href: "/my-bike/bmw", meta: "Touring / adventure" },
      { label: "KTM", href: "/my-bike/ktm", meta: "Street / off-road" },
    ],
    columns: [
      {
        title: "Brands A-K",
        links: [
          { label: "Aprilia", href: "/my-bike/aprilia" },
          { label: "Benelli", href: "/my-bike/benelli" },
          { label: "BMW", href: "/my-bike/bmw" },
          { label: "CF Moto", href: "/my-bike/cf-moto" },
          { label: "Ducati", href: "/my-bike/ducati" },
          { label: "Gilera", href: "/my-bike/gilera" },
          { label: "Honda", href: "/my-bike/honda" },
          { label: "Husqvarna", href: "/my-bike/husqvarna" },
        ],
      },
      {
        title: "Brands K-P",
        links: [
          { label: "Kawasaki", href: "/my-bike/kawasaki" },
          { label: "Keeway", href: "/my-bike/keeway" },
          { label: "KTM", href: "/my-bike/ktm" },
          { label: "Kymco", href: "/my-bike/kymco" },
          { label: "MBK", href: "/my-bike/mbk" },
          { label: "Moto Guzzi", href: "/my-bike/moto-guzzi" },
          { label: "Peugeot", href: "/my-bike/peugeot" },
          { label: "Piaggio", href: "/my-bike/piaggio" },
        ],
      },
      {
        title: "Brands Q-Z",
        links: [
          { label: "QJ Motor", href: "/my-bike/qj-motor" },
          { label: "Royal Enfield", href: "/my-bike/royal-enfield" },
          { label: "Suzuki", href: "/my-bike/suzuki" },
          { label: "SYM", href: "/my-bike/sym" },
          { label: "Triumph", href: "/my-bike/triumph" },
          { label: "Yamaha", href: "/my-bike/yamaha" },
          { label: "Voge", href: "/my-bike/voge" },
          { label: "Zontes", href: "/my-bike/zontes" },
        ],
      },
    ],
  },
  {
    key: "offers",
    label: "ΠΡΟΣΦΟΡΕΣ",
    href: "/prosfores",
    eyebrow: "Live deals",
    title: "Προσφορές σε κράνη, ένδυση, μπότες και MX-Enduro.",
    image: "/mega-menu/category-offers.webp",
    accent: true,
    quickLinks: [
      { label: "Κράνη", href: "/prosfores/kranh", meta: "Full face / jet" },
      { label: "Ένδυση", href: "/prosfores/endysh", meta: "Jackets / pants" },
      { label: "Μπότες", href: "/prosfores/mpotes", meta: "Last sizes" },
      { label: "MX-Enduro", href: "/prosfores/mx-enduro", meta: "Off-road deals" },
    ],
    columns: [
      {
        title: "Κράνη",
        links: [
          { label: "Full Face", href: "/prosfores/kranh/full-face" },
          { label: "Flip Up", href: "/prosfores/kranh/flip-up" },
          { label: "Jet", href: "/prosfores/kranh/jet" },
          { label: "Off Road", href: "/prosfores/kranh/off-road" },
        ],
      },
      {
        title: "Ένδυση",
        links: [
          { label: "Μπουφάν", href: "/prosfores/endysh" },
          { label: "Γάντια", href: "/prosfores/endysh" },
          { label: "Παντελόνια", href: "/prosfores/endysh" },
          { label: "Δερμάτινες Φόρμες", href: "/prosfores/endysh" },
          { label: "Μπότες", href: "/prosfores/mpotes" },
        ],
      },
      {
        title: "MX / MTB / Extras",
        links: [
          { label: "MX-Enduro", href: "/prosfores/mx-enduro" },
          { label: "ΜΤΒ", href: "/prosfores/mtb" },
          { label: "Αξεσουάρ Αναβάτη", href: "/prosfores/aksesoyar-anabath" },
          { label: "Αξεσουάρ Μοτοσυκλέτας", href: "/prosfores/aksesoyar-motosykletas" },
        ],
      },
    ],
  },
] satisfies MegaMenuPanel[];
