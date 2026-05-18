"use client";

export default function AccountError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-bold text-text-primary">Κάτι πήγε στραβά</h2>
      <p className="max-w-md text-sm text-text-secondary">
        Παρουσιάστηκε ένα απρόσμενο σφάλμα. Παρακαλούμε δοκιμάστε ξανά.
      </p>
      <button
        onClick={reset}
        className="rounded-lg bg-brand-teal px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-teal-hover"
      >
        Δοκιμάστε ξανά
      </button>
    </div>
  );
}
