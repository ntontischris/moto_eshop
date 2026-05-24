"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="el">
      <body style={{ fontFamily: "system-ui", padding: "2rem" }}>
        <h1>Κάτι πήγε στραβά</h1>
        <button onClick={() => reset()}>Δοκιμάστε ξανά</button>
      </body>
    </html>
  );
}
