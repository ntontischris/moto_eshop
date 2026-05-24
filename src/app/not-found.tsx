import Link from "next/link";

export default function NotFound() {
  return (
    <html lang="el">
      <body style={{ fontFamily: "system-ui", padding: "2rem" }}>
        <h1>404</h1>
        <p>Η σελίδα δεν βρέθηκε.</p>
        <Link href="/">Αρχική</Link>
      </body>
    </html>
  );
}
