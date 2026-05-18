import Link from "next/link";
import { SearchX } from "lucide-react";

interface EmptySearchStateProps {
  query: string;
}

const POPULAR_SEARCHES = [
  "κράνος",
  "γάντια",
  "μπότες",
  "AGV",
  "Alpinestars",
  "Shoei",
];

export function EmptySearchState({ query }: EmptySearchStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <SearchX className="size-12 text-zinc-300" />
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
        Δεν βρέθηκαν αποτελέσματα
      </h2>
      <p className="max-w-sm text-zinc-500">
        Δεν βρέθηκαν προϊόντα για{" "}
        <span className="font-medium text-zinc-700 dark:text-zinc-300">
          &quot;{query}&quot;
        </span>
        . Δοκιμάστε διαφορετική λέξη ή δείτε τις παρακάτω κατηγορίες.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {POPULAR_SEARCHES.map((s) => (
          <Link
            key={s}
            href={`/search?q=${encodeURIComponent(s)}`}
            className="rounded-full border border-zinc-200 px-4 py-1.5 text-sm text-zinc-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-zinc-700 dark:text-zinc-400"
          >
            {s}
          </Link>
        ))}
      </div>
    </div>
  );
}
