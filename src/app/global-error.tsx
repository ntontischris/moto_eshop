"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/observability/report-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { digest: error.digest, boundary: "global-error" });
  }, [error]);

  return (
    <html lang="el">
      <body>
        <main style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
          <h1>Κάτι πήγε στραβά</h1>
          <p>Παρουσιάστηκε ένα απρόσμενο σφάλμα. Δοκίμασε ξανά.</p>
          <button onClick={() => reset()}>Δοκίμασε ξανά</button>
        </main>
      </body>
    </html>
  );
}
