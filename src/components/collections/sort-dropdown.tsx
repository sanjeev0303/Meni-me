'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

type SortDropdownProps = {
  sortBy: string;
  setSortBy: (value: string) => void;
};

export function SortDropdown({ sortBy, setSortBy }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'best-selling', label: 'Best Selling' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'newest', label: 'Newest' },
    { value: 'a-z', label: 'Alphabetically: A-Z' },
    { value: 'z-a', label: 'Alphabetically: Z-A' },
  ];

  const currentLabel = sortOptions.find(opt => opt.value === sortBy)?.label || 'Featured';

//   const displayLabel = currentLabel.length > 20 ? currentLabel.substring(0, 17) + '...' : currentLabel;

  return (
    <div className="relative">
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="flex items-center gap-1 px-4 py-2 border border-gray-300 rounded-3xl text-sm font-semibold text-gray-900 hover:border-gray-400 transition whitespace-nowrap"
    >
      Sort By:{' '}
      <span className="w-24 truncate text-left" title={currentLabel}>
        {currentLabel}
      </span>
      <ChevronDown
        size={16}
        className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
      />
    </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
          {sortOptions.map(option => (
            <button
              key={option.value}
              onClick={() => {
                setSortBy(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm transition ${
                sortBy === option.value
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
