'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Search, Filter, MapPin } from 'lucide-react';

// Mock Data for Real Estate Assets
const properties = [
  {
    id: '1',
    name: 'Skyline Commercial Tower',
    location: 'Financial District, NY',
    type: 'Commercial',
    apy: '12.4%',
    price: '$50.00',
    funded: 78,
    imageColor: 'bg-brand-dark/60', // Placeholder for image
    status: 'Live'
  },
  {
    id: '2',
    name: 'Highland Luxury Apartments',
    location: 'Austin, TX',
    type: 'Residential',
    apy: '9.8%',
    price: '$50.00',
    funded: 45,
    imageColor: 'bg-brand-dark/50',
    status: 'Live'
  },
  {
    id: '3',
    name: 'Logistics Hub Alpha',
    location: 'Rotterdam, Netherlands',
    type: 'Industrial',
    apy: '14.2%',
    price: '$100.00',
    funded: 12,
    imageColor: 'bg-brand-dark/70',
    status: 'New'
  },
  {
    id: '4',
    name: 'Tech Park Phase II',
    location: 'Bangalore, India',
    type: 'Commercial',
    apy: '11.5%',
    price: '$50.00',
    funded: 92,
    imageColor: 'bg-brand-navy',
    status: 'Closing Soon'
  }
];

export default function MarketplacePage() {
  const [filter, setFilter] = useState('All');

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-brand-dark/80 backdrop-blur-md border-b border-brand-primary/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Ours Logo" className="h-8 w-auto" />
            <img src="/logo tipografico celeste.svg" alt="Ours" className="h-6 w-auto" />
          </Link>
          <div className="flex gap-6 text-sm font-medium text-brand-light/80">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <Link href="#" className="text-brand-primary">Marketplace</Link>
          </div>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">

        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-brand-light">Marketplace</h1>
            <p className="text-brand-light/70">Discover and invest in tokenized real-world assets.</p>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-light/50" />
              <input
                type="text"
                placeholder="Search properties..."
                className="w-full bg-brand-surface border border-brand-primary/30 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-brand-primary transition-colors text-brand-light placeholder:text-brand-light/40"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-surface border border-brand-primary/30 rounded-lg text-sm font-medium hover:bg-brand-primary/10 transition-colors text-brand-light">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-6 border-b border-brand-primary/20 mb-8 text-sm text-brand-light/70">
          {['All', 'Commercial', 'Residential', 'Industrial'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`pb-3 border-b-2 transition-colors ${filter === item ? 'text-brand-primary border-brand-primary' : 'border-transparent hover:text-brand-light'}`}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Property Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((prop, i) => (
            <motion.div
              key={prop.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={`/marketplace/${prop.id}`} className="group block bg-brand-surface border border-brand-primary/20 rounded-xl overflow-hidden hover:border-brand-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-brand-primary/10">

                {/* Image Area */}
                <div className={`h-56 ${prop.imageColor} relative`}>
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="bg-brand-dark/90 backdrop-blur px-2 py-1 rounded text-xs font-bold border border-brand-primary/30 uppercase tracking-wider text-brand-light">
                      {prop.type}
                    </span>
                    {prop.status === 'Closing Soon' && (
                      <span className="bg-brand-primary/20 text-brand-primary px-2 py-1 rounded text-xs font-bold border border-brand-primary/30 uppercase tracking-wider">
                        Closing Soon
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 backdrop-blur-[2px]">
                    <span className="bg-brand-light text-brand-dark px-4 py-2 rounded-full font-bold text-sm transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      View Details
                    </span>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-1 group-hover:text-brand-primary transition-colors text-brand-light">{prop.name}</h3>
                  <div className="flex items-center gap-1 text-brand-light/70 text-xs mb-6">
                    <MapPin className="w-3 h-3" /> {prop.location}
                  </div>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6 pt-6 border-t border-brand-primary/20">
                    <div>
                      <div className="text-xs text-brand-light/60 uppercase tracking-wider mb-1">Est. APY</div>
                      <div className="text-xl font-mono text-brand-primary">{prop.apy}</div>
                    </div>
                    <div>
                      <div className="text-xs text-brand-light/60 uppercase tracking-wider mb-1">Token Price</div>
                      <div className="text-xl font-mono text-brand-light">{prop.price}</div>
                    </div>
                  </div>

                  {/* Funding Bar */}
                  <div className="mb-2 flex justify-between text-xs font-medium">
                    <span className="text-brand-light/70">Funded</span>
                    <span className="text-brand-light">{prop.funded}%</span>
                  </div>
                  <div className="w-full bg-brand-dark h-1.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${prop.funded}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="bg-brand-primary h-full rounded-full"
                    />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}