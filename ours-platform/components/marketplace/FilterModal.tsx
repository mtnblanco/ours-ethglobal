'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterValues) => void;
  currentFilters: FilterValues;
}

export interface FilterValues {
  minPrice?: number;
  maxPrice?: number;
  minAPY?: number;
  maxAPY?: number;
  minFunded?: number;
  maxFunded?: number;
}

export default function FilterModal({ isOpen, onClose, onApplyFilters, currentFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<FilterValues>(currentFilters);

  const handleApply = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters: FilterValues = {};
    setFilters(resetFilters);
    onApplyFilters(resetFilters);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-[200] backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-[20%] left-[7%] z-[201] w-[350px] bg-white rounded-2xl shadow-2xl p-6 max-h-[80vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#2A2F5B]">Advanced Filters</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Filters */}
            <div className="space-y-6">
              {/* Price Range */}
              <div>
                <h3 className="text-sm font-bold text-[#2A2F5B] mb-3 uppercase">Token Price (USDC)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Min Price</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice || ''}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2A2F5B]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Max Price</label>
                    <input
                      type="number"
                      placeholder="200"
                      value={filters.maxPrice || ''}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2A2F5B]"
                    />
                  </div>
                </div>
              </div>

              {/* APY Range */}
              <div>
                <h3 className="text-sm font-bold text-[#2A2F5B] mb-3 uppercase">Expected APY (%)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Min APY</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minAPY || ''}
                      onChange={(e) => setFilters({ ...filters, minAPY: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2A2F5B]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Max APY</label>
                    <input
                      type="number"
                      placeholder="20"
                      value={filters.maxAPY || ''}
                      onChange={(e) => setFilters({ ...filters, maxAPY: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2A2F5B]"
                    />
                  </div>
                </div>
              </div>

              {/* Funding Progress Range */}
              <div>
                <h3 className="text-sm font-bold text-[#2A2F5B] mb-3 uppercase">Funding Progress (%)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Min Funded</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={filters.minFunded || ''}
                      onChange={(e) => setFilters({ ...filters, minFunded: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2A2F5B]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Max Funded</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={filters.maxFunded || ''}
                      onChange={(e) => setFilters({ ...filters, maxFunded: e.target.value ? Number(e.target.value) : undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2A2F5B]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-6 py-3 bg-[#2A2F5B] text-white rounded-lg font-semibold hover:bg-[#1E2046] transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
