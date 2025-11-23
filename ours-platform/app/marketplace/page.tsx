'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import MarketplaceHero from '@/components/marketplace/MarketplaceHero';
import MarketplaceList from '@/components/marketplace/MarketplaceList';
import Footer from '@/components/Footer';
import FilterModal, { FilterValues } from '@/components/marketplace/FilterModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import TabNavigation from '@/components/TabNavigation';

export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [filters, setFilters] = useState<FilterValues>({});
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory);
  };

  const handleFilterClick = () => {
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFBF5] pb-24 md:pb-16 overflow-x-hidden">
        <Navbar />
        <TabNavigation />
        <MarketplaceHero
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onFilterClick={handleFilterClick}
        />
        <MarketplaceList
          searchQuery={searchQuery}
          category={category}
          filters={filters}
        />
        <Footer />

        <FilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApplyFilters={handleApplyFilters}
          currentFilters={filters}
        />
      </div>
    </ProtectedRoute>
  );
}
