import Link from "next/link";
import { PackageX } from "lucide-react";

export default function CollectionNotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
            <PackageX className="w-16 h-16 text-gray-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Collection Not Found
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            We couldn't find the collection you're looking for. It may have been moved or is no longer available.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link
            href="/collections"
            className="px-8 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors duration-200 w-full sm:w-auto"
          >
            Browse All Collections
          </Link>
          <Link
            href="/"
            className="px-8 py-3 border-2 border-gray-300 text-gray-900 text-sm font-semibold rounded-full hover:bg-gray-50 transition-colors duration-200 w-full sm:w-auto"
          >
            Go to Homepage
          </Link>
        </div>

        {/* Popular Collections */}
        <div className="pt-12 border-t border-gray-200">
          <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-gray-500 mb-6">
            Popular Collections
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Men", href: "/collections/men" },
              { name: "Women", href: "/collections/women" },
              { name: "Sale", href: "/collections/sale" },
              { name: "New Arrivals", href: "/collections/new-arrivals" },
            ].map((collection) => (
              <Link
                key={collection.name}
                href={collection.href}
                className="p-4 border border-gray-200 rounded-lg hover:border-gray-400 hover:shadow-md transition-all duration-200 group"
              >
                <div className="h-32 bg-gray-100 rounded-md mb-3 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <span className="text-2xl font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
                    {collection.name[0]}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-900 text-center">
                  {collection.name}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Help text */}
        <div className="pt-8">
          <p className="text-sm text-gray-500">
            Need help?{" "}
            <Link href="/contact" className="text-gray-900 underline hover:text-gray-700">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
