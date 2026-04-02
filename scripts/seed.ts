import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function seed() {
  console.log("Seeding categories...");
  const { data: categories } = await supabase
    .from("categories")
    .upsert(
      [
        {
          slug: "kranea",
          name: "Κράνη",
          description: "Κράνη μοτοσυκλέτας από τις κορυφαίες μάρκες",
          seo_intro:
            "Βρείτε το ιδανικό κράνος για κάθε τύπο οδήγησης. Full face, modular, jet και off-road κράνη με πιστοποίηση ECE 22.06.",
          position: 1,
          image_url: null,
        },
        {
          slug: "endymasia",
          name: "Ενδυμασία",
          description: "Μπουφάν, παντελόνια και ολόσωμες φόρμες",
          seo_intro:
            "Προστατευτική ενδυμασία μοτοσυκλέτας με CE πιστοποίηση. Δερμάτινα και υφασμάτινα μπουφάν, παντελόνια και φόρμες.",
          position: 2,
          image_url: null,
        },
        {
          slug: "mpotes-gantia",
          name: "Μπότες & Γάντια",
          description: "Μπότες και γάντια μοτοσυκλέτας",
          seo_intro:
            "Ασφαλείς μπότες και γάντια για κάθε εποχή. Racing, touring και adventure επιλογές.",
          position: 3,
          image_url: null,
        },
        {
          slug: "axesouar",
          name: "Αξεσουάρ",
          description: "Αξεσουάρ αναβάτη και μοτοσυκλέτας",
          seo_intro:
            "Ενδοεπικοινωνίες, βαλίτσες, GPS, κάμερες και αξεσουάρ για κάθε αναβάτη.",
          position: 4,
          image_url: null,
        },
        {
          slug: "antalaktika",
          name: "Ανταλλακτικά",
          description: "Ανταλλακτικά και συντήρηση",
          seo_intro:
            "Λάδια, φίλτρα, λάστιχα, τακάκια, αλυσίδες και ανταλλακτικά για κάθε μοτοσυκλέτα.",
          position: 5,
          image_url: null,
        },
      ],
      { onConflict: "slug" },
    )
    .select("id, slug");

  if (!categories) {
    console.error("Failed to seed categories");
    return;
  }

  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
  console.log(`  ✓ ${categories.length} categories`);

  console.log("Seeding brands...");
  const { data: brands } = await supabase
    .from("brands")
    .upsert(
      [
        {
          slug: "agv",
          name: "AGV",
          description: "Ιταλικά κράνη κορυφαίας ποιότητας",
        },
        { slug: "shoei", name: "Shoei", description: "Ιαπωνικά premium κράνη" },
        {
          slug: "arai",
          name: "Arai",
          description: "Χειροποίητα κράνη από την Ιαπωνία",
        },
        {
          slug: "dainese",
          name: "Dainese",
          description: "Ιταλική προστατευτική ενδυμασία",
        },
        {
          slug: "alpinestars",
          name: "Alpinestars",
          description: "Κορυφαίος εξοπλισμός racing & adventure",
        },
        {
          slug: "revit",
          name: "Rev'It",
          description: "Ολλανδική ενδυμασία υψηλής τεχνολογίας",
        },
        {
          slug: "sena",
          name: "Sena",
          description: "Bluetooth ενδοεπικοινωνίες",
        },
        {
          slug: "michelin",
          name: "Michelin",
          description: "Γαλλικά ελαστικά κορυφαίας ποιότητας",
        },
        {
          slug: "pirelli",
          name: "Pirelli",
          description: "Ιταλικά ελαστικά υψηλών επιδόσεων",
        },
        {
          slug: "forma",
          name: "Forma",
          description: "Ιταλικές μπότες μοτοσυκλέτας",
        },
      ],
      { onConflict: "slug" },
    )
    .select("id, slug");

  if (!brands) {
    console.error("Failed to seed brands");
    return;
  }

  const brandMap = Object.fromEntries(brands.map((b) => [b.slug, b.id]));
  console.log(`  ✓ ${brands.length} brands`);

  console.log("Seeding products...");
  const products = [
    {
      slug: "agv-k6-s-solid-matt-black",
      name: "AGV K6 S Solid Matt Black",
      description:
        "Το AGV K6 S είναι ένα πολυχρηστικό full-face κράνος με εξαιρετικό αερισμό, ελαφρύ carbon-glass shell και 5 αστέρια Sharp rating. Ιδανικό για sport touring και καθημερινή χρήση.",
      brand_id: brandMap["agv"],
      category_id: catMap["kranea"],
      price: 349.99,
      compare_at_price: 399.99,
      cost_price: 220,
      stock: 15,
      sku: "AGV-K6S-MBLK-001",
      certification: "ECE 22.06",
      rider_type: "intermediate" as const,
      status: "active" as const,
      sizes: ["XS", "S", "M", "L", "XL", "XXL"],
      colors: ["Matt Black"],
      images: [
        {
          url: "https://placehold.co/800x800/1a1a1a/ffffff?text=AGV+K6+S+Front",
          alt: "AGV K6 S μπροστά",
          position: 0,
        },
        {
          url: "https://placehold.co/800x800/2a2a2a/ffffff?text=AGV+K6+S+Side",
          alt: "AGV K6 S πλάι",
          position: 1,
        },
        {
          url: "https://placehold.co/800x800/3a3a3a/ffffff?text=AGV+K6+S+Back",
          alt: "AGV K6 S πίσω",
          position: 2,
        },
      ],
      specs: {
        Τύπος: "Full Face",
        Υλικό: "Carbon-Glass",
        Βάρος: "1.255g",
        Κλείσιμο: "Double-D",
        Visor: "Pinlock Ready",
        Αερισμός: "5 εισαγωγές / 2 εξαγωγές",
      },
      average_rating: 4.7,
      review_count: 23,
      view_count: 580,
    },
    {
      slug: "shoei-neotec-3-anthracite",
      name: "Shoei NeoTec 3 Anthracite Metallic",
      description:
        "Premium modular κράνος με ενσωματωμένο sun visor, εξαιρετική ηχομόνωση και κορυφαία ποιότητα κατασκευής. Ιδανικό για touring αναβάτες.",
      brand_id: brandMap["shoei"],
      category_id: catMap["kranea"],
      price: 699.0,
      compare_at_price: null,
      cost_price: 450,
      stock: 8,
      sku: "SHOEI-NT3-ANTH-001",
      certification: "ECE 22.06",
      rider_type: "advanced" as const,
      status: "active" as const,
      sizes: ["S", "M", "L", "XL"],
      colors: ["Anthracite Metallic", "White", "Matt Black"],
      images: [
        {
          url: "https://placehold.co/800x800/3d3d3d/ffffff?text=Shoei+NeoTec+3",
          alt: "Shoei NeoTec 3",
          position: 0,
        },
      ],
      specs: {
        Τύπος: "Modular (Flip-Up)",
        Υλικό: "AIM+",
        Βάρος: "1.550g",
        "Sun Visor": "Ναι",
        Κλείσιμο: "Micro Ratchet",
        Intercom: "Sena SRL3 Ready",
      },
      average_rating: 4.9,
      review_count: 12,
      view_count: 420,
    },
    {
      slug: "dainese-super-speed-4-leather-jacket",
      name: "Dainese Super Speed 4 Leather Jacket",
      description:
        "Δερμάτινο μπουφάν racing με αεροδυναμικές hump, CE Level 2 προστατευτικά ώμων και αγκώνων, και προετοιμασία για back protector.",
      brand_id: brandMap["dainese"],
      category_id: catMap["endymasia"],
      price: 499.99,
      compare_at_price: 599.99,
      cost_price: 310,
      stock: 6,
      sku: "DAI-SS4-BLK-001",
      certification: "CE Level 2",
      rider_type: "advanced" as const,
      status: "active" as const,
      sizes: ["46", "48", "50", "52", "54", "56"],
      colors: ["Black/White", "Black/Red"],
      images: [
        {
          url: "https://placehold.co/800x800/1a1a1a/dc2626?text=Dainese+SS4",
          alt: "Dainese Super Speed 4",
          position: 0,
        },
      ],
      specs: {
        Υλικό: "Tutu Cowhide",
        Προστασία: "CE Level 2 ώμοι & αγκώνες",
        "Back Protector": "Pocket (sold separately)",
        Αερισμός: "2 εισαγωγές στήθος",
        Hump: "Ναι",
      },
      average_rating: 4.8,
      review_count: 8,
      view_count: 310,
    },
    {
      slug: "alpinestars-smx-6-v2-boots",
      name: "Alpinestars SMX-6 V2 Boots",
      description:
        "Sport touring μπότες με CE πιστοποίηση, TPU προστατευτικά, αντιολισθητική σόλα και εξαιρετική εφαρμογή.",
      brand_id: brandMap["alpinestars"],
      category_id: catMap["mpotes-gantia"],
      price: 259.99,
      compare_at_price: 289.99,
      cost_price: 160,
      stock: 12,
      sku: "ALP-SMX6V2-BLK-001",
      certification: "CE Level 2",
      rider_type: "intermediate" as const,
      status: "active" as const,
      sizes: ["39", "40", "41", "42", "43", "44", "45", "46"],
      colors: ["Black", "Black/White"],
      images: [
        {
          url: "https://placehold.co/800x800/111111/ffffff?text=SMX-6+V2",
          alt: "Alpinestars SMX-6 V2",
          position: 0,
        },
      ],
      specs: {
        Υλικό: "Microfiber + TPU",
        Κλείσιμο: "Zip + Velcro",
        Σόλα: "Αντιολισθητική",
        "Ankle Protection": "TPU + D-Axial System",
      },
      average_rating: 4.5,
      review_count: 31,
      view_count: 650,
    },
    {
      slug: "alpinestars-sp-8-v3-gloves",
      name: "Alpinestars SP-8 V3 Gloves",
      description:
        "Δερμάτινα γάντια sport touring με αρθρωτά δάχτυλα, TPU προστατευτικά και touchscreen compatibility.",
      brand_id: brandMap["alpinestars"],
      category_id: catMap["mpotes-gantia"],
      price: 89.99,
      compare_at_price: null,
      cost_price: 52,
      stock: 25,
      sku: "ALP-SP8V3-BLK-001",
      certification: "CE Level 1",
      rider_type: "beginner" as const,
      status: "active" as const,
      sizes: ["S", "M", "L", "XL", "2XL"],
      colors: ["Black", "Black/White/Red"],
      images: [
        {
          url: "https://placehold.co/800x800/222222/ffffff?text=SP-8+V3",
          alt: "Alpinestars SP-8 V3",
          position: 0,
        },
      ],
      specs: {
        Υλικό: "Full Grain Leather",
        Touchscreen: "Ναι",
        Κλείσιμο: "Velcro Wrist",
        Knuckle: "TPU",
      },
      average_rating: 4.3,
      review_count: 45,
      view_count: 820,
    },
    {
      slug: "revit-tornado-3-jacket",
      name: "Rev'It Tornado 3 Jacket",
      description:
        "Αδιάβροχο touring μπουφάν 3 εποχών με αποσπώμενη θερμική επένδυση, CE Level 2 protectors και εξαιρετικό αερισμό.",
      brand_id: brandMap["revit"],
      category_id: catMap["endymasia"],
      price: 379.99,
      compare_at_price: 429.99,
      cost_price: 240,
      stock: 9,
      sku: "REVIT-TOR3-BLK-001",
      certification: "CE Level 2",
      rider_type: "intermediate" as const,
      status: "active" as const,
      sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
      colors: ["Black", "Black/Neon Yellow"],
      images: [
        {
          url: "https://placehold.co/800x800/1f1f1f/22c55e?text=RevIt+Tornado+3",
          alt: "Rev'It Tornado 3",
          position: 0,
        },
      ],
      specs: {
        Υλικό: "Hydratex | G-Liner",
        Αδιάβροχο: "Ναι",
        "Thermal Liner": "Αποσπώμενο",
        Αερισμός: "6 vents",
        Layers: "3 seasons",
      },
      average_rating: 4.6,
      review_count: 19,
      view_count: 440,
    },
    {
      slug: "sena-50s-mesh-intercom",
      name: "Sena 50S Mesh 2.0 Intercom",
      description:
        "Κορυφαία ενδοεπικοινωνία με Mesh 2.0 τεχνολογία, Harman Kardon ηχεία, 14 ώρες αυτονομία και σύνδεση έως 24 αναβάτες.",
      brand_id: brandMap["sena"],
      category_id: catMap["axesouar"],
      price: 329.99,
      compare_at_price: 369.99,
      cost_price: 210,
      stock: 18,
      sku: "SENA-50S-001",
      certification: null,
      rider_type: null,
      status: "active" as const,
      sizes: [],
      colors: [],
      images: [
        {
          url: "https://placehold.co/800x800/0a0a0a/3b82f6?text=Sena+50S",
          alt: "Sena 50S",
          position: 0,
        },
      ],
      specs: {
        Τεχνολογία: "Mesh 2.0 + Bluetooth 5.0",
        Ηχεία: "Harman Kardon",
        Αυτονομία: "14 ώρες",
        Εμβέλεια: "2km (Mesh)",
        Αναβάτες: "Έως 24 (Mesh)",
        WiFi: "Ναι (updates)",
      },
      average_rating: 4.4,
      review_count: 56,
      view_count: 1200,
    },
    {
      slug: "michelin-road-6-120-70-zr17",
      name: "Michelin Road 6 120/70 ZR17 Front",
      description:
        "Touring ελαστικό μπροστά με τεχνολογία MICHELIN 2CT+ για εξαιρετική πρόσφυση σε στεγνό και βρεγμένο.",
      brand_id: brandMap["michelin"],
      category_id: catMap["antalaktika"],
      price: 129.99,
      compare_at_price: null,
      cost_price: 85,
      stock: 30,
      sku: "MICH-RD6-12070-001",
      certification: null,
      rider_type: null,
      status: "active" as const,
      sizes: ["120/70 ZR17"],
      colors: [],
      images: [
        {
          url: "https://placehold.co/800x800/0d0d0d/fbbf24?text=Michelin+Road+6",
          alt: "Michelin Road 6",
          position: 0,
        },
      ],
      specs: {
        Τύπος: "Touring",
        Μέγεθος: "120/70 ZR17",
        Θέση: "Εμπρός",
        Τεχνολογία: "2CT+ / MICHELIN XST+",
        "Speed Index": "W (270 km/h)",
        "Load Index": "58",
      },
      average_rating: 4.8,
      review_count: 67,
      view_count: 950,
    },
    {
      slug: "pirelli-diablo-rosso-iv-180-55-zr17",
      name: "Pirelli Diablo Rosso IV 180/55 ZR17 Rear",
      description:
        "Supersport ελαστικό πίσω με τεχνολογία dual compound για μέγιστο κράτημα στις στροφές.",
      brand_id: brandMap["pirelli"],
      category_id: catMap["antalaktika"],
      price: 159.99,
      compare_at_price: 179.99,
      cost_price: 100,
      stock: 20,
      sku: "PIR-DR4-18055-001",
      certification: null,
      rider_type: null,
      status: "active" as const,
      sizes: ["180/55 ZR17"],
      colors: [],
      images: [
        {
          url: "https://placehold.co/800x800/111111/ef4444?text=Pirelli+Rosso+IV",
          alt: "Pirelli Diablo Rosso IV",
          position: 0,
        },
      ],
      specs: {
        Τύπος: "Supersport",
        Μέγεθος: "180/55 ZR17",
        Θέση: "Πίσω",
        Τεχνολογία: "Dual Compound",
        "Speed Index": "W (270 km/h)",
      },
      average_rating: 4.6,
      review_count: 42,
      view_count: 780,
    },
    {
      slug: "agv-pista-gp-rr-soleluna-2023",
      name: "AGV Pista GP RR Soleluna 2023",
      description:
        "Το κράνος των πρωταθλητών. Full carbon shell, 100% racing DNA, Valentino Rossi Soleluna livery. FIM Approved.",
      brand_id: brandMap["agv"],
      category_id: catMap["kranea"],
      price: 1499.99,
      compare_at_price: null,
      cost_price: 950,
      stock: 3,
      sku: "AGV-PGPRR-SOL23-001",
      certification: "ECE 22.06",
      rider_type: "professional" as const,
      status: "active" as const,
      sizes: ["S", "MS", "M", "ML", "L", "XL"],
      colors: ["Soleluna 2023"],
      images: [
        {
          url: "https://placehold.co/800x800/1a0a2e/fbbf24?text=Pista+GP+RR",
          alt: "AGV Pista GP RR Soleluna",
          position: 0,
        },
        {
          url: "https://placehold.co/800x800/2a1a3e/fbbf24?text=Pista+GP+Side",
          alt: "AGV Pista GP RR πλάι",
          position: 1,
        },
      ],
      specs: {
        Τύπος: "Full Face Racing",
        Υλικό: "100% Carbon Fiber",
        Βάρος: "1.450g",
        Visor: "5mm Optical Class 1",
        "FIM Approved": "Ναι",
        Spoiler: "Integrated",
      },
      average_rating: 5.0,
      review_count: 5,
      view_count: 2100,
    },
    {
      slug: "forma-adventure-low-boots",
      name: "Forma Adventure Low Boots",
      description:
        "Χαμηλές adventure μπότες με αδιάβροχη μεμβράνη Drytex, CE πιστοποίηση και άνεση για όλη μέρα.",
      brand_id: brandMap["forma"],
      category_id: catMap["mpotes-gantia"],
      price: 189.99,
      compare_at_price: 219.99,
      cost_price: 115,
      stock: 14,
      sku: "FORMA-ADVL-BRN-001",
      certification: "CE Level 2",
      rider_type: "beginner" as const,
      status: "active" as const,
      sizes: ["39", "40", "41", "42", "43", "44", "45", "46", "47"],
      colors: ["Brown", "Black"],
      images: [
        {
          url: "https://placehold.co/800x800/2d1a0a/ffffff?text=Forma+Adventure",
          alt: "Forma Adventure Low",
          position: 0,
        },
      ],
      specs: {
        Υλικό: "Full Grain Leather + Cordura",
        Αδιάβροχο: "Drytex Membrane",
        Σόλα: "Rubber dual-density",
        Ankle: "Dual Flex + TPU",
      },
      average_rating: 4.4,
      review_count: 28,
      view_count: 560,
    },
    {
      slug: "dainese-tempest-3-d-dry-pants",
      name: "Dainese Tempest 3 D-Dry Pants",
      description:
        "Αδιάβροχο touring παντελόνι με D-Dry membrane, CE Level 1 protectors γονάτων και ρυθμιζόμενη εφαρμογή.",
      brand_id: brandMap["dainese"],
      category_id: catMap["endymasia"],
      price: 249.99,
      compare_at_price: null,
      cost_price: 155,
      stock: 11,
      sku: "DAI-TMP3-BLK-001",
      certification: "CE Level 1",
      rider_type: "intermediate" as const,
      status: "active" as const,
      sizes: ["44", "46", "48", "50", "52", "54", "56", "58"],
      colors: ["Black", "Black/Ebony"],
      images: [
        {
          url: "https://placehold.co/800x800/1a1a1a/888888?text=Tempest+3+Pants",
          alt: "Dainese Tempest 3 Pants",
          position: 0,
        },
      ],
      specs: {
        Υλικό: "Mugello + D-Dry",
        Αδιάβροχο: "Ναι",
        Γόνατα: "CE Level 1 (removable)",
        Ισχία: "Soft Level 1",
        Θερμική: "Removable liner",
      },
      average_rating: 4.2,
      review_count: 15,
      view_count: 380,
    },
    {
      slug: "arai-rx-7v-evo-matt-black",
      name: "Arai RX-7V Evo Matt Black",
      description:
        "Χειροποίητο racing κράνος με VAS visor system, PB-SNC2 shell και legendary Arai comfort. Κορυφαία ασφάλεια.",
      brand_id: brandMap["arai"],
      category_id: catMap["kranea"],
      price: 849.99,
      compare_at_price: null,
      cost_price: 540,
      stock: 5,
      sku: "ARAI-RX7V-MBLK-001",
      certification: "ECE 22.06",
      rider_type: "advanced" as const,
      status: "active" as const,
      sizes: ["XS", "S", "M", "L", "XL"],
      colors: ["Matt Black", "Diamond White"],
      images: [
        {
          url: "https://placehold.co/800x800/0a0a0a/cccccc?text=Arai+RX-7V+Evo",
          alt: "Arai RX-7V Evo",
          position: 0,
        },
      ],
      specs: {
        Τύπος: "Full Face Racing",
        Υλικό: "PB-SNC2 (Peripherally Belted)",
        Βάρος: "1.590g",
        Visor: "VAS Max Vision",
        Ventilation: "IC Duct 6",
      },
      average_rating: 4.9,
      review_count: 9,
      view_count: 670,
    },
    {
      slug: "revit-sand-4-h2o-gloves",
      name: "Rev'It Sand 4 H2O Gloves",
      description:
        "Adventure γάντια με αδιάβροχη μεμβράνη Hydratex, TPR knuckle protection και touchscreen.",
      brand_id: brandMap["revit"],
      category_id: catMap["mpotes-gantia"],
      price: 109.99,
      compare_at_price: 129.99,
      cost_price: 65,
      stock: 20,
      sku: "REVIT-SND4-BLK-001",
      certification: "CE Level 1",
      rider_type: "beginner" as const,
      status: "active" as const,
      sizes: ["S", "M", "L", "XL", "XXL"],
      colors: ["Black", "Black/Sand"],
      images: [
        {
          url: "https://placehold.co/800x800/1a1a0a/22c55e?text=Sand+4+H2O",
          alt: "Rev'It Sand 4 H2O",
          position: 0,
        },
      ],
      specs: {
        Υλικό: "Goatskin + Polyamide",
        Αδιάβροχο: "Hydratex",
        Touchscreen: "Ναι",
        Knuckle: "TPR",
        Κλείσιμο: "Velcro + Zipper",
      },
      average_rating: 4.3,
      review_count: 22,
      view_count: 390,
    },
    {
      slug: "sena-spider-st1-mesh-intercom",
      name: "Sena Spider ST1 Mesh Intercom",
      description:
        "Νέα γενιά ενδοεπικοινωνίας με Sound by Harman Kardon, 13 ώρες μπαταρία, Mesh 2.0 και app control.",
      brand_id: brandMap["sena"],
      category_id: catMap["axesouar"],
      price: 249.99,
      compare_at_price: null,
      cost_price: 160,
      stock: 22,
      sku: "SENA-SPST1-001",
      certification: null,
      rider_type: null,
      status: "active" as const,
      sizes: [],
      colors: [],
      images: [
        {
          url: "https://placehold.co/800x800/0a0a0a/6366f1?text=Sena+Spider+ST1",
          alt: "Sena Spider ST1",
          position: 0,
        },
      ],
      specs: {
        Τεχνολογία: "Mesh 2.0 + Bluetooth 5.2",
        Ηχεία: "Harman Kardon",
        Αυτονομία: "13 ώρες",
        "Voice Assistant": "Siri / Google",
        App: "Sena Motorcycles",
      },
      average_rating: 4.5,
      review_count: 34,
      view_count: 890,
    },
  ];

  const { data: insertedProducts, error: prodError } = await supabase
    .from("products")
    .upsert(products, { onConflict: "slug" })
    .select("id, slug");

  if (prodError) {
    console.error("Failed to seed products:", prodError.message);
    return;
  }

  console.log(`  ✓ ${insertedProducts?.length ?? 0} products`);

  console.log("\n✅ Seed complete! Try these URLs:");
  console.log("  http://localhost:3000/kranea");
  console.log("  http://localhost:3000/endymasia");
  console.log("  http://localhost:3000/mpotes-gantia");
  console.log("  http://localhost:3000/axesouar");
  console.log("  http://localhost:3000/antalaktika");
  console.log("  http://localhost:3000/kranea/agv-k6-s-solid-matt-black");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
