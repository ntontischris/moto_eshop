import { config } from "dotenv";
config({ path: ".env.local" });

import { initSearchIndex } from "../src/lib/meilisearch/init-index";

initSearchIndex()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
