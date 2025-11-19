export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="animate-pulse">
          {/* Image skeleton */}
          <div className="relative mb-3 bg-gray-200 rounded-lg overflow-hidden aspect-3/4 md:aspect-2/3">
            <div className="absolute top-2 right-2 w-9 h-9 bg-gray-300 rounded-full" />
          </div>

          {/* Title skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />

            {/* Price skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-4 bg-gray-200 rounded w-16" />
              <div className="h-3 bg-gray-200 rounded w-12" />
            </div>

            {/* Color swatches skeleton */}
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <div className="w-3 h-3 rounded-full bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
