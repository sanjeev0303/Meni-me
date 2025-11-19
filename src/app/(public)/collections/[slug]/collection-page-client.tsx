"use client";

import { FilterChips } from "@/components/collections/filter-chips";
import { FilterPanel } from "@/components/collections/filter-panel";
import { ProductGrid, type CollectionGridProduct } from "@/components/collections/product-grid";
import { ProductGridSkeleton } from "@/components/collections/product-grid-skeleton";
import { SortDropdown } from "@/components/collections/sort-dropdown";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { StorefrontCollection } from "@/lib/storefront/catalog";
import { Settings2, Sliders, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

const FALLBACK_FEATURED_CATEGORIES = ["JEANS", "T-SHIRTS", "JACKETS", "SHIRTS", "SWEATSHIRT"];
// const FALLBACK_ALL_CATEGORIES = [
//   "JEANS",
//   "T-SHIRTS",
//   "JACKETS",
//   "SHIRTS",
//   "SWEATSHIRT",
//   "COATS",
//   "BELTS",
//   "BAGS",
//   "CARGOS",
//   "CHINOS",
// ];

type Filters = {
  category: string[];
  size: string[];
  discount: string[];
  color: string[];
  price: [number, number];
  fit: string[];
  style: string[];
};

type CollectionPageClientProps = {
  collection: StorefrontCollection;
  childrenCollections: StorefrontCollection[];
  products: CollectionGridProduct[];
};

const createDefaultFilters = (): Filters => ({
  category: [],
  size: [],
  discount: [],
  color: [],
  price: [0, 100000] as [number, number],
  fit: [],
  style: [],
});

const formatCategory = (value: string) => value.trim().toUpperCase();

export function CollectionPageClient({ collection, childrenCollections, products }: CollectionPageClientProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [filters, setFilters] = useState<Filters>(createDefaultFilters);
  const [isPending, startTransition] = useTransition();

  const derivedCategories = childrenCollections.length
    ? childrenCollections.map((child) => formatCategory(child.name))
    : FALLBACK_FEATURED_CATEGORIES;

//   const allCategories = Array.from(
//     new Set([
//       ...derivedCategories,
//       ...childrenCollections.map((child) => formatCategory(child.name)),
//       ...FALLBACK_ALL_CATEGORIES,
//     ]),
//   );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (filters.category.length > 0) {
        const productCategory = product.category ? formatCategory(product.category) : null;
        if (!productCategory || !filters.category.includes(productCategory)) {
          return false;
        }
      }

      if (filters.price && (product.salePrice < filters.price[0] || product.salePrice > filters.price[1])) {
        return false;
      }

      return true;
    });
  }, [filters, products]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];

    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.salePrice - b.salePrice);
      case "price-high":
        return sorted.sort((a, b) => b.salePrice - a.salePrice);
      case "a-z":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "z-a":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case "newest":
        return sorted.sort((a, b) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        });
      default:
        return sorted;
    }
  }, [filteredProducts, sortBy]);

//   const hasActiveFilters = Object.values(filters).some((value) =>
//     Array.isArray(value) ? value.length > 0 : false,
//   );

  const handleClearFilters = () => {
    startTransition(() => {
      setFilters(createDefaultFilters());
    });
  };

  const handleApplyFilters = () => {
    setIsFilterOpen(false);
  };

  const handleSortChange = (newSortBy: string) => {
    startTransition(() => {
      setSortBy(newSortBy);
    });
  };

  const handleCategoryToggle = (category: string) => {
    const normalized = formatCategory(category);
    startTransition(() => {
      setFilters((prev) => ({
        ...prev,
        category: prev.category.includes(normalized)
          ? prev.category.filter((cat) => cat !== normalized)
          : [...prev.category, normalized],
      }));
    });
  };

  const heroTitle = formatCategory(collection.name);

  return (
    <div className="h-auto bg-white">
      <main className="flex-1">
        <div className="hidden lg:block sticky top-[82px] z-30 bg-white/95 backdrop-blur px-4 md:px-6 lg:px-8 py-6 md:py-2 md:mb-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <button
              onClick={() => setIsFilterOpen(true)}
              className="flex items-center gap-2 lg:pr-16 px-4 py-2 border border-gray-300 rounded-3xl text-sm font-semibold text-gray-900 hover:border-gray-400 transition whitespace-nowrap"
            >
              <Sliders size={16} />
              FILTERS
            </button>

            <div className="flex-1 text-center">
              <h1 className="text-base md:text-xl lg:text-2xl font-bold text-gray-900">
            {heroTitle}
              </h1>
            </div>

            <div className="hidden lg:flex items-center gap-4">
              <SortDropdown sortBy={sortBy} setSortBy={handleSortChange} />
            </div>
          </div>
        </div>

        <div className="flex relative max-w-7xl mx-auto">

          <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <SheetContent side="left" className="w-full max-w-sm sm:w-96 p-0 rounded-none">
              <SheetHeader className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <SheetTitle className="text-sm font-bold uppercase tracking-[0.3em] text-gray-900">Filter by</SheetTitle>
                    <SheetDescription className="text-xs text-gray-500 font-semibold mt-2">₹</SheetDescription>
                  </div>
                  <SheetClose className="p-2 hover:bg-gray-100 rounded transition" asChild>
                    <button aria-label="Close filter sheet">
                      <X size={20} className="text-gray-600" />
                    </button>
                  </SheetClose>
                </div>
              </SheetHeader>

              <div className="overflow-y-auto h-[calc(100vh-180px)]">
                <FilterPanel
                  filters={filters}
                  setFilters={setFilters}
                  onClear={handleClearFilters}
                  isMobile
                  onApply={handleApplyFilters}
                  title={collection.name}
                />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex-1">
            <div className="hidden lg:flex items-center justify-between gap-4 px-6 py-4">
              <FilterChips filters={filters} setFilters={setFilters} />
            </div>

            <div className="bg-[#f7f2e5] px-4 md:px-6 lg:px-8 py-4">
              <div className="max-w-full">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gray-900 mb-3">FILTER FOR YOU</h3>
                <div className="flex flex-wrap gap-2">
                  {derivedCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryToggle(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                        filters.category.includes(cat)
                          ? "bg-red-600 text-white"
                          : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 transition"
                  >
                    +More
                  </button>
                </div>
              </div>
            </div>

            <div className="px-4 md:px-6 lg:px-0 py-8">
              {isPending ? (
                <ProductGridSkeleton />
              ) : (
                <ProductGrid
                  products={sortedProducts}
                  collectionName={collection.name}
                />
              )}
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 grid grid-cols-2 gap-0 border-t border-gray-200 bg-white lg:hidden">
          <Sheet>
            <SheetTrigger asChild >
              <button
                type="button"
                className="flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold uppercase tracking-[0.2em] text-gray-900 border-r border-gray-200 hover:bg-gray-50 transition"
              >
                <Settings2 size={18} />
                SORT
              </button>
            </SheetTrigger>

            <SheetContent side="bottom" className="max-h-[70vh] rounded-t-2xl px-6 pb-8 pt-4">
              <SheetHeader className="text-left pb-4">
                <SheetTitle className="text-sm font-bold uppercase tracking-[0.3em] text-gray-900 sr-only">
                  Sort By
                </SheetTitle>
                <SheetDescription className="sr-only">
                  Choose how products are ordered in the list below.
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col divide-y divide-gray-100">
                {[
                  { label: "Featured", value: "featured" },
                  { label: "Price: Low to High", value: "price-low" },
                  { label: "Price: High to Low", value: "price-high" },
                  { label: "Alphabetical A-Z", value: "a-z" },
                  { label: "Alphabetical Z-A", value: "z-a" },
                  { label: "Newest First", value: "newest" },
                ].map((option) => (
                  <SheetClose asChild key={option.value}>
                    <button
                      type="button"
                      onClick={() => handleSortChange(option.value)}
                      className={`flex items-center justify-between py-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
                        sortBy === option.value ? "text-red-600" : "text-gray-900 hover:text-red-600"
                      }`}
                    >
                      {option.label}
                      <span
                        className={`h-2 w-2 rounded-full ${
                          sortBy === option.value ? "bg-red-600" : "border border-gray-300"
                        }`}
                      />
                    </button>
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <button
            onClick={() => setIsFilterOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-4 text-sm font-bold uppercase tracking-[0.2em] text-gray-900 hover:bg-gray-50 transition"
          >
            <Sliders size={18} />
            FILTER
          </button>
        </div>
      </main>
    </div>
  );
}
