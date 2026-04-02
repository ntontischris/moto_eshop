import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const bikes = [
  // BMW
  ...["R 1250 GS", "S 1000 RR", "F 900 R", "F 800 GS", "R 1200 GS"].flatMap(
    (model) =>
      [2019, 2020, 2021, 2022, 2023, 2024].map((year) => ({
        make: "BMW",
        model,
        year,
        category: model.includes("GS") ? "adventure" : "sport",
      })),
  ),
  // Yamaha
  ...["MT-07", "MT-09", "Tracer 9", "YZF-R1", "Ténéré 700"].flatMap((model) =>
    [2020, 2021, 2022, 2023, 2024].map((year) => ({
      make: "Yamaha",
      model,
      year,
      category: model.includes("R1") ? "sport" : "naked",
    })),
  ),
  // Honda
  ...["CB500F", "CB650R", "Africa Twin", "CBR1000RR-R", "CB1000R"].flatMap(
    (model) =>
      [2020, 2021, 2022, 2023, 2024].map((year) => ({
        make: "Honda",
        model,
        year,
        category: model.includes("Africa") ? "adventure" : "naked",
      })),
  ),
  // Kawasaki
  ...["Z900", "Ninja 650", "Z650", "ZX-10R", "Versys 650"].flatMap((model) =>
    [2020, 2021, 2022, 2023, 2024].map((year) => ({
      make: "Kawasaki",
      model,
      year,
      category:
        model.includes("Ninja") || model.includes("ZX") ? "sport" : "naked",
    })),
  ),
  // KTM
  ...[
    "390 Duke",
    "790 Duke",
    "890 Duke",
    "1290 Super Duke R",
    "890 Adventure",
  ].flatMap((model) =>
    [2021, 2022, 2023, 2024].map((year) => ({
      make: "KTM",
      model,
      year,
      category: model.includes("Adventure") ? "adventure" : "naked",
    })),
  ),
  // Ducati
  ...["Monster 937", "Panigale V4", "Multistrada V4", "DesertX"].flatMap(
    (model) =>
      [2022, 2023, 2024].map((year) => ({
        make: "Ducati",
        model,
        year,
        category: model.includes("Panigale") ? "sport" : "naked",
      })),
  ),
  // Suzuki
  ...["GSX-S750", "V-Strom 650", "GSX-8S", "Hayabusa"].flatMap((model) =>
    [2022, 2023, 2024].map((year) => ({
      make: "Suzuki",
      model,
      year,
      category: model.includes("Strom") ? "adventure" : "sport",
    })),
  ),
];

async function seedBikes() {
  console.log(`Seeding ${bikes.length} bikes...`);

  // Insert in batches of 50
  for (let i = 0; i < bikes.length; i += 50) {
    const batch = bikes.slice(i, i + 50);
    const { error } = await supabase.from("bikes").upsert(batch, {
      onConflict: "id",
      ignoreDuplicates: true,
    });
    if (error) {
      console.error(`Batch ${i} error:`, error.message);
    }
  }

  const { count } = await supabase
    .from("bikes")
    .select("id", { count: "exact", head: true });
  console.log(`✅ ${count} bikes in database`);
}

seedBikes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
