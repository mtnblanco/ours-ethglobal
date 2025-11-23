'use client';

import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

interface MarketplaceHeroProps {
  onSearchChange?: (query: string) => void;
  onCategoryChange?: (category: string) => void;
  onFilterClick?: () => void;
}

export default function MarketplaceHero({
  onSearchChange,
  onCategoryChange,
  onFilterClick
}: MarketplaceHeroProps) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Commercial', 'Residential', 'Industrial'];

  const handleCategoryClick = (category: string) => {
    setActiveCategory(category);
    onCategoryChange?.(category);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  return (
    <section className="bg-[#2D2E63] pt-32 pb-16 px-6">
      <div className="container mx-auto max-w-5xl">

        {/* Title and Subtitle */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-[#B0CBFF] mb-4">
            Marketplace
          </h1>
          <p className="text-xl md:text-2xl text-[#B0CBFF]/80">
            Discover and invest in tokenized real-world assets
          </p>
        </div>

        {/* Search Bar and Filter Button */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#B0CBFF]/50 w-5 h-5" />
            <input
              type="text"
              placeholder="Search properties..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full bg-[#1E2046] border-2 border-[#B0CBFF]/20 rounded-xl pl-12 pr-4 py-4 text-[#B0CBFF] placeholder-[#B0CBFF]/50 focus:outline-none focus:border-[#B0CBFF]/50 transition-colors"
            />
          </div>

          <button
            onClick={onFilterClick}
            className="bg-[#1E2046] border-2 border-[#B0CBFF]/20 rounded-xl px-6 py-4 text-[#B0CBFF] hover:border-[#B0CBFF]/50 transition-colors flex items-center gap-2"
          >
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden md:inline">Filters</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-3 justify-center">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => handleCategoryClick(category)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeCategory === category
                  ? 'bg-[#B0CBFF] text-[#2D2E63]'
                  : 'bg-[#1E2046] text-[#B0CBFF] border-2 border-[#B0CBFF]/20 hover:border-[#B0CBFF]/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
