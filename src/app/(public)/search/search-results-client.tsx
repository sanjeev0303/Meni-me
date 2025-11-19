"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, PackageX, Loader2 } from "lucide-react";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  stock: number;
  category: string | null;
  categorySlug: string | null;
}

interface SearchResponse {
  query: string;
  count: number;
  results: SearchResult[];
}

export function SearchResultsClient({ query }: { query: string }) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState(query);
  const router = useRouter();

  useEffect(() => {
    if (query && query.length >= 2) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (q: string) => {
    if (!q || q.trim().length < 2) {
      setError("Please enter at least 2 characters");
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/storefront/search?q=${encodeURIComponent(q.trim())}`
      );

      if (!response.ok) {
        throw new Error("Failed to search products");
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
    } catch (err) {
      setError("Failed to search products. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for products..."
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {/* Search Header */}
      {query && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Search Results for &quot;{query}&quot;
          </h1>
          {!isLoading && (
            <p className="text-gray-600 mt-1">
              {results.length} {results.length === 1 ? "product" : "products"}{" "}
              found
            </p>
          )}
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Searching products...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && query && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <PackageX className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            No products found
          </h2>
          <p className="text-gray-600 text-center max-w-md">
            We couldn&apos;t find any products matching &quot;{query}&quot;.
            Try searching with different keywords or check the spelling.
          </p>
          <Link
            href="/"
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      )}

      {/* No Query State */}
      {!query && !isLoading && (
        <div className="flex flex-col items-center justify-center py-20">
          <Search className="h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Start Searching
          </h2>
          <p className="text-gray-600 text-center max-w-md">
            Enter a product name, description, or category to find what
            you&apos;re looking for.
          </p>
        </div>
      )}

      {/* Results Grid */}
      {!isLoading && !error && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Product Image */}
              <div className="relative aspect-square bg-gray-100">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <PackageX className="h-16 w-16 text-gray-300" />
                  </div>
                )}
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <span className="text-white font-semibold px-4 py-2 bg-red-600 rounded">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                {product.category && (
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                    {product.category}
                  </p>
                )}
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    ₹{Number(product.price).toFixed(2)}
                  </span>
                  {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                    <>
                      <span className="text-sm text-gray-500 line-through">
                        ₹{Number(product.compareAtPrice).toFixed(2)}
                      </span>
                      <span className="text-xs text-red-600 font-semibold">
                        {Math.round(
                          ((Number(product.compareAtPrice) - Number(product.price)) /
                            Number(product.compareAtPrice)) *
                            100
                        )}
                        % OFF
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
