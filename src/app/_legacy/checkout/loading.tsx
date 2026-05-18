export default function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-bg-elevated" />
        <div className="h-40 animate-pulse rounded-lg bg-bg-elevated" />
        <div className="h-40 animate-pulse rounded-lg bg-bg-elevated" />
        <div className="h-32 animate-pulse rounded-lg bg-bg-elevated" />
        <div className="h-12 animate-pulse rounded-lg bg-bg-elevated" />
      </div>
    </div>
  );
}
