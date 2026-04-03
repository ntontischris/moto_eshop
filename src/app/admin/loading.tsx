export default function AdminLoading() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-bg-elevated" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-32 animate-pulse rounded-lg bg-bg-elevated" />
          <div className="h-32 animate-pulse rounded-lg bg-bg-elevated" />
          <div className="h-32 animate-pulse rounded-lg bg-bg-elevated" />
        </div>
        <div className="h-64 animate-pulse rounded-lg bg-bg-elevated" />
      </div>
    </div>
  );
}
