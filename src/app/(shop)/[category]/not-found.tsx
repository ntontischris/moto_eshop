import Link from "next/link";

export default function CategoryNotFound() {
  return (
    <main className="container mx-auto flex flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        Η κατηγορία δεν βρέθηκε
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Επιστροφή στην αρχική
      </Link>
    </main>
  );
}
