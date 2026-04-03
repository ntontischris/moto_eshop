import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-4xl font-bold text-text-primary">404</h2>
      <p className="max-w-md text-sm text-text-secondary">
        Η σελίδα που ψάχνετε δεν βρέθηκε.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-brand-teal px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-hover"
      >
        Πίσω στην Αρχική
      </Link>
    </div>
  );
}
