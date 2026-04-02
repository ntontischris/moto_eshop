import { Skeleton } from "@/components/ui/skeleton";

export default function CategoryLoading() {
  return (
    <main className="container mx-auto px-4 py-6">
      <Skeleton className="mb-4 h-4 w-48" />
      <Skeleton className="mb-2 h-8 w-64" />
      <Skeleton className="mb-6 h-4 w-96" />

      <div className="mt-6 flex gap-6">
        <div className="hidden w-64 shrink-0 space-y-4 lg:block">
          <Skeleton className="h-6 w-20" />
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>

        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-9 w-44" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
