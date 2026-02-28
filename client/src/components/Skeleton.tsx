export function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl bg-dark-800 border border-dark-700/50 [.light_&]:bg-gray-50 [.light_&]:border-gray-200 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-dark-700 [.light_&]:bg-gray-200" />
        <div className="flex-1 min-w-0">
          <div className="h-4 w-3/4 bg-dark-700 [.light_&]:bg-gray-200 rounded mb-2" />
          <div className="h-3 w-1/2 bg-dark-700 [.light_&]:bg-gray-200 rounded" />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="h-2 w-full bg-dark-700 [.light_&]:bg-gray-200 rounded" />
        <div className="h-2 w-5/6 bg-dark-700 [.light_&]:bg-gray-200 rounded" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
