import { ProductGridSkeleton } from "@/components/collections/product-grid-skeleton";
import { Settings2, Sliders } from "lucide-react";

export default function CollectionLoading() {
  return (
    <div className="h-auto bg-white">
      <main className="flex-1">
        {/* Header skeleton */}
        <div className="hidden lg:block sticky top-[82px] z-30 bg-white/95 backdrop-blur px-4 md:px-6 lg:px-8 py-6 md:py-2 md:mb-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 lg:pr-16 px-4 py-2 border border-gray-300 rounded-3xl">
              <Sliders size={16} className="text-gray-400" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="flex-1 text-center">
              <div className="h-8 w-48 bg-gray-200 rounded mx-auto animate-pulse" />
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <div className="h-10 w-32 bg-gray-200 rounded-3xl animate-pulse" />
            </div>
          </div>
        </div>

        <div className="flex relative max-w-7xl mx-auto">
          <div className="flex-1">
            {/* Filter chips skeleton */}
            <div className="hidden lg:flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex gap-2">
                <div className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-8 w-32 bg-gray-200 rounded-full animate-pulse" />
              </div>
            </div>

            {/* Category filters skeleton */}
            <div className="bg-[#f7f2e5] px-4 md:px-6 lg:px-8 py-4">
              <div className="max-w-full">
                <div className="h-4 w-32 bg-gray-300 rounded mb-3 animate-pulse" />
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-8 w-20 bg-gray-200 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Product grid skeleton */}
            <div className="px-4 md:px-6 lg:px-0 py-8">
              <ProductGridSkeleton />
            </div>
          </div>
        </div>

        {/* Mobile bottom navigation skeleton */}
        <div className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-2 gap-0 border-t border-gray-200 bg-white lg:hidden">
          <div className="flex items-center justify-center gap-2 px-4 py-4 border-r border-gray-200">
            <Settings2 size={18} className="text-gray-400" />
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center justify-center gap-2 px-4 py-4">
            <Sliders size={18} className="text-gray-400" />
            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </main>
    </div>
  );
}
