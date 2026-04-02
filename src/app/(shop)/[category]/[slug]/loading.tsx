import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <main className="container mx-auto px-4 py-6">
      <Skeleton className="mb-4 h-4 w-64" />

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-md" />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-48" />
          <div className="flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-12 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    </main>
  );
}
