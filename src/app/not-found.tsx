import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* 404 Number */}
        <div className="space-y-2">
          <h1 className="text-9xl md:text-[12rem] font-bold text-gray-200 leading-none">
            404
          </h1>
          <div className="relative -mt-16 md:-mt-20">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Page Not Found
            </h2>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 pt-8">
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-800 transition-colors duration-200 w-full sm:w-auto"
          >
            <Home size={18} />
            Back to Home
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3 border-2 border-gray-300 text-gray-900 text-sm font-semibold rounded-full hover:bg-gray-50 transition-colors duration-200 w-full sm:w-auto"
          >
            <Search size={18} />
            Browse Products
          </Link>
        </div>

        {/* Quick Links */}
        <div className="pt-12 border-t border-gray-200">
          <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-gray-500 mb-6">
            Quick Links
          </h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/collections/men" className="text-gray-600 hover:text-gray-900 underline">
              Men's Collection
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/collections/women" className="text-gray-600 hover:text-gray-900 underline">
              Women's Collection
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/collections/sale" className="text-gray-600 hover:text-gray-900 underline">
              Sale Items
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/orders" className="text-gray-600 hover:text-gray-900 underline">
              Track Order
            </Link>
          </div>
        </div>

        {/* Help text */}
        <div className="pt-8">
          <p className="text-sm text-gray-500">
            Still can't find what you're looking for?{" "}
            <Link href="/contact" className="text-gray-900 underline hover:text-gray-700">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
