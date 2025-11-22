'use client';

import React from 'react';
import Link from 'next/link';
import { useWeb3, usePropertyMarketplace, formatUSDC, calculateFundingPercentage } from '@/hooks/useContracts';

interface DisplayProperty {
  id: string;
  name: string;
  description: string;
  location: string;
  propertyType: string;
  totalValue: string;
  tokenPrice: string;
  fundingProgress: number;
  status: string;
}

export default function MarketplacePage() {
  const { account, isConnected, connectWallet } = useWeb3();
  const { properties, loading, purchaseTokens } = usePropertyMarketplace();

  // Convert PropertyWithSale[] to DisplayProperty[]
  const displayProperties: DisplayProperty[] = properties.map((prop, index) => ({
    id: prop.property.token,
    name: prop.property.name || `Property ${index + 1}`,
    description: prop.property.ipfsHash ? `Property registered on blockchain with hash ${prop.property.ipfsHash.slice(0, 10)}...` : 'Tokenized real estate investment opportunity',
    location: prop.property.location || 'Location TBD',
    propertyType: prop.property.units > BigInt(10) ? 'Commercial' : 'Residential',
    totalValue: (Number(prop.property.totalInvestmentTarget) / 1e6).toString(),
    tokenPrice: (Number(prop.sale.pricePerToken) / 1e6).toString(),
    fundingProgress: calculateFundingPercentage(prop.sale.totalRaised, prop.property.totalInvestmentTarget),
    status: prop.saleIsActive ? 'Funding' : 'Closed'
  }));

  const handlePurchase = async (tokenAddress: string, amount: number) => {
    if (!isConnected) {
      alert('Please verify with World ID first');
      return;
    }
    
    try {
      await purchaseTokens(tokenAddress, amount);
      alert('Purchase successful! Transaction submitted via World ID.');
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Funding': return 'text-yellow-400 bg-yellow-400/10';
      case 'Active': return 'text-green-400 bg-green-400/10';
      case 'Completed': return 'text-blue-400 bg-blue-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(Number(price));
  };

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-brand-dark/80 backdrop-blur-md border-b border-brand-primary/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Ours Logo" className="h-8 w-auto" />
            <span className="font-bold text-xl tracking-tight">ours</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-brand-light/80 hover:text-brand-primary transition-colors">
              Home
            </Link>
            <span className="text-sm font-medium text-brand-primary">Marketplace</span>
            
            {/* World ID Status */}
            <div className="flex items-center gap-4">
              {isConnected ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 border border-brand-primary/30 rounded-lg">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm font-mono">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </span>
                  <span className="text-xs text-brand-primary ml-2">World ID ✓</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-yellow-400">Connecting World ID...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-brand-light">Real Estate Marketplace</h1>
            <p className="text-xl text-brand-light/70 max-w-2xl mx-auto">
              Invest in tokenized real estate properties. Own fractions, earn returns, and trade on the blockchain.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-brand-surface border border-brand-primary/20 rounded-xl p-6 text-center">
              <h3 className="text-3xl font-bold text-brand-primary mb-2">{displayProperties.length}</h3>
              <p className="text-brand-light/70">Properties Available</p>
            </div>
            <div className="bg-brand-surface border border-brand-primary/20 rounded-xl p-6 text-center">
              <h3 className="text-3xl font-bold text-brand-primary mb-2">
                {formatPrice(displayProperties.reduce((sum, p) => sum + Number(p.totalValue), 0).toString())}
              </h3>
              <p className="text-brand-light/70">Total Value Locked</p>
            </div>
            <div className="bg-brand-surface border border-brand-primary/20 rounded-xl p-6 text-center">
              <h3 className="text-3xl font-bold text-brand-primary mb-2">7-15%</h3>
              <p className="text-brand-light/70">Expected Annual Returns</p>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-brand-light/70">Loading properties...</p>
            </div>
          )}

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayProperties.map((property) => (
              <div key={property.id} className="bg-brand-surface border border-brand-primary/20 rounded-xl overflow-hidden hover:border-brand-primary/40 transition-colors">
                {/* Property Image */}
                <div className="h-48 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 flex items-center justify-center">
                  <span className="text-6xl">{property.propertyType === 'Residential' ? '🏠' : '🏢'}</span>
                </div>
                
                {/* Property Details */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-brand-light">{property.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                      {property.status}
                    </span>
                  </div>
                  
                  <p className="text-brand-light/70 mb-4 line-clamp-2">{property.description}</p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-light/70">Location</span>
                      <span className="text-brand-light">{property.location}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-light/70">Total Value</span>
                      <span className="text-brand-light font-bold">{formatPrice(property.totalValue)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-light/70">Token Price</span>
                      <span className="text-brand-light">{formatPrice(property.tokenPrice)} USDC</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-brand-light/70">Funded</span>
                      <span className="text-brand-light">{property.fundingProgress}%</span>
                    </div>
                  </div>

                  {/* Funding Progress Bar */}
                  <div className="mb-6">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-brand-primary h-2 rounded-full transition-all duration-500"
                        style={{ width: `${property.fundingProgress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Purchase Section */}
                  {property.status === 'Funding' && (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Tokens"
                          min="1"
                          className="flex-1 px-3 py-2 bg-brand-dark border border-brand-primary/30 rounded-lg text-brand-light placeholder-brand-light/50 focus:outline-none focus:border-brand-primary"
                          id={`tokens-${property.id}`}
                        />
                        <span className="px-3 py-2 text-brand-light/70 text-sm">
                          × {formatPrice(property.tokenPrice)}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => {
                          const input = document.getElementById(`tokens-${property.id}`) as HTMLInputElement;
                          const amount = parseInt(input?.value || '1');
                          if (amount > 0) {
                            handlePurchase(property.id, amount);
                          }
                        }}
                        disabled={!isConnected}
                        className="w-full px-6 py-3 bg-brand-primary hover:bg-brand-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
                      >
                        {!isConnected ? 'Connecting World ID...' : 'Purchase with World ID'}
                      </button>
                    </div>
                  )}

                  {property.status === 'Active' && (
                    <div className="text-center py-3">
                      <span className="text-green-400 font-medium">🎉 Fully Funded - Generating Returns</span>
                    </div>
                  )}

                  {property.status === 'Completed' && (
                    <div className="text-center py-3">
                      <span className="text-blue-400 font-medium">✅ Investment Complete</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {!loading && displayProperties.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏗️</div>
              <h3 className="text-2xl font-bold text-brand-light mb-4">No Properties Available</h3>
              <p className="text-brand-light/70 max-w-md mx-auto">
                Properties will appear here once contracts are deployed and properties are registered.
              </p>
              <div className="mt-8 space-y-2">
                <p className="text-sm text-brand-light/60">Next steps to see properties:</p>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/30 rounded text-brand-primary text-xs">
                    Deploy contracts
                  </span>
                  <span className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/30 rounded text-brand-primary text-xs">
                    Register properties
                  </span>
                  <span className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/30 rounded text-brand-primary text-xs">
                    Start funding
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
