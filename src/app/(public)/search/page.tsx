import { Suspense } from "react";
import { SearchResultsClient } from "./search-results-client";
import { ProductGridSkeleton } from "@/components/collections/product-grid-skeleton";

export const metadata = {
  title: "Search Results - Hub Fashion",
  description: "Search for products",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const query = params.q || "";

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<ProductGridSkeleton />}>
        <SearchResultsClient query={query} />
      </Suspense>
    </div>
  );
}
