'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useWeb3, usePropertyMarketplace } from '@/hooks/useContracts';

interface Property {
  id: string;
  name: string;
  description: string;
  location: string;
  propertyType: string;
  totalValue: string;
  tokenPrice: string;
  fundingProgress: number;
  status: string;
  details: {
    bedrooms?: number;
    bathrooms?: number;
    sqft?: number;
    yearBuilt?: number;
    expectedROI?: string;
    managementFee?: string;
    minimumInvestment?: string;
  };
}

export default function PropertyDetailsPage() {
  const params = useParams();
  const tokenAddress = params.id as string;
  const [property, setProperty] = useState<Property | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const { account, isConnected, connectWallet } = useWeb3();
  const { purchaseTokens } = usePropertyMarketplace();

  useEffect(() => {
    // Mock property data for demo - replace with actual contract call
    const mockProperty: Property = {
      id: tokenAddress,
      name: `Premium Property ${tokenAddress.slice(-4)}`,
      description: 'A beautiful modern residential property located in a prime area with excellent growth potential. This property offers steady rental income and long-term appreciation potential.',
      location: 'Downtown Miami, FL',
      propertyType: 'Residential',
      totalValue: '500000',
      tokenPrice: '100',
      fundingProgress: 65,
      status: 'Funding',
      details: {
        bedrooms: 3,
        bathrooms: 2,
        sqft: 1850,
        yearBuilt: 2019,
        expectedROI: '12%',
        managementFee: '2%',
        minimumInvestment: '100'
      }
    };
    
    setProperty(mockProperty);
    setIsLoading(false);
  }, [tokenAddress]);

  const handlePurchase = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }
    
    try {
      await purchaseTokens(tokenAddress, investmentAmount);
      alert(`Successfully purchased ${investmentAmount} tokens for ${property?.name}!`);
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Purchase failed. Please try again.');
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(Number(price));
  };

  const calculateTotalCost = () => {
    if (!property) return '$0';
    return formatPrice((Number(property.tokenPrice) * investmentAmount).toString());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-dark text-brand-light flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p>Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-brand-dark text-brand-light flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Property Not Found</h1>
          <Link href="/marketplace" className="text-brand-primary hover:underline">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

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
            <Link href="/marketplace" className="text-sm font-medium text-brand-light/80 hover:text-brand-primary transition-colors">
              Marketplace
            </Link>
            <span className="text-sm font-medium text-brand-primary">Property Details</span>
            
            {/* Wallet Connection */}
            {isConnected ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 border border-brand-primary/30 rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm font-mono">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </span>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="px-6 py-2 bg-brand-primary hover:bg-brand-primary/80 rounded-lg text-white font-medium transition-colors"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-32 pb-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link href="/marketplace" className="text-brand-primary hover:underline">
              ← Back to Marketplace
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Property Info */}
            <div className="lg:col-span-2">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-4xl font-bold text-brand-light">{property.name}</h1>
                  <span className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    property.status === 'Funding' ? 'text-yellow-400 bg-yellow-400/10' :
                    property.status === 'Active' ? 'text-green-400 bg-green-400/10' :
                    'text-blue-400 bg-blue-400/10'
                  }`}>
                    {property.status}
                  </span>
                </div>
                <p className="text-xl text-brand-light/70 mb-4">{property.location}</p>
                <p className="text-brand-light/80 leading-relaxed">{property.description}</p>
              </div>

              {/* Property Image */}
              <div className="h-96 bg-gradient-to-br from-brand-primary/20 to-brand-primary/5 rounded-xl flex items-center justify-center mb-8">
                <span className="text-9xl">{property.propertyType === 'Residential' ? '🏠' : '🏢'}</span>
              </div>

              {/* Property Details */}
              <div className="bg-brand-surface border border-brand-primary/20 rounded-xl p-8">
                <h2 className="text-2xl font-bold mb-6 text-brand-light">Property Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {property.details.bedrooms && (
                    <div className="flex justify-between">
                      <span className="text-brand-light/70">Bedrooms</span>
                      <span className="text-brand-light font-medium">{property.details.bedrooms}</span>
                    </div>
                  )}
                  {property.details.bathrooms && (
                    <div className="flex justify-between">
                      <span className="text-brand-light/70">Bathrooms</span>
                      <span className="text-brand-light font-medium">{property.details.bathrooms}</span>
                    </div>
                  )}
                  {property.details.sqft && (
                    <div className="flex justify-between">
                      <span className="text-brand-light/70">Square Feet</span>
                      <span className="text-brand-light font-medium">{property.details.sqft.toLocaleString()}</span>
                    </div>
                  )}
                  {property.details.yearBuilt && (
                    <div className="flex justify-between">
                      <span className="text-brand-light/70">Year Built</span>
                      <span className="text-brand-light font-medium">{property.details.yearBuilt}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-brand-light/70">Property Type</span>
                    <span className="text-brand-light font-medium">{property.propertyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-light/70">Total Value</span>
                    <span className="text-brand-light font-medium">{formatPrice(property.totalValue)}</span>
                  </div>
                </div>
              </div>

              {/* Investment Details */}
              <div className="bg-brand-surface border border-brand-primary/20 rounded-xl p-8 mt-8">
                <h2 className="text-2xl font-bold mb-6 text-brand-light">Investment Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex justify-between">
                    <span className="text-brand-light/70">Token Price</span>
                    <span className="text-brand-light font-medium">{formatPrice(property.tokenPrice)} USDC</span>
                  </div>
                  {property.details.expectedROI && (
                    <div className="flex justify-between">
                      <span className="text-brand-light/70">Expected ROI</span>
                      <span className="text-brand-light font-medium">{property.details.expectedROI} annually</span>
                    </div>
                  )}
                  {property.details.managementFee && (
                    <div className="flex justify-between">
                      <span className="text-brand-light/70">Management Fee</span>
                      <span className="text-brand-light font-medium">{property.details.managementFee}</span>
                    </div>
                  )}
                  {property.details.minimumInvestment && (
                    <div className="flex justify-between">
                      <span className="text-brand-light/70">Minimum Investment</span>
                      <span className="text-brand-light font-medium">{formatPrice(property.details.minimumInvestment)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-brand-light/70">Funding Progress</span>
                    <span className="text-brand-light font-medium">{property.fundingProgress}% funded</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-light/70">Remaining</span>
                    <span className="text-brand-light font-medium">
                      {formatPrice(((100 - property.fundingProgress) / 100 * Number(property.totalValue)).toString())}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Investment Panel */}
            <div className="lg:col-span-1">
              <div className="bg-brand-surface border border-brand-primary/20 rounded-xl p-8 sticky top-32">
                <h2 className="text-2xl font-bold mb-6 text-brand-light">Invest Now</h2>
                
                {/* Funding Progress */}
                <div className="mb-8">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-brand-light/70">Funding Progress</span>
                    <span className="text-sm font-medium text-brand-light">{property.fundingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-brand-primary h-3 rounded-full transition-all duration-500"
                      style={{ width: `${property.fundingProgress}%` }}
                    ></div>
                  </div>
                </div>

                {property.status === 'Funding' && (
                  <>
                    {/* Investment Amount */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-brand-light mb-2">
                        Number of Tokens
                      </label>
                      <input
                        type="number"
                        value={investmentAmount}
                        onChange={(e) => setInvestmentAmount(Math.max(1, parseInt(e.target.value) || 1))}
                        min="1"
                        className="w-full px-4 py-3 bg-brand-dark border border-brand-primary/30 rounded-lg text-brand-light placeholder-brand-light/50 focus:outline-none focus:border-brand-primary"
                        placeholder="Enter amount"
                      />
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-brand-dark/50 rounded-lg p-4 mb-6 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-brand-light/70">Token Price</span>
                        <span className="text-brand-light">{formatPrice(property.tokenPrice)} USDC</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-brand-light/70">Quantity</span>
                        <span className="text-brand-light">{investmentAmount} tokens</span>
                      </div>
                      <div className="border-t border-brand-primary/20 pt-2">
                        <div className="flex justify-between font-bold">
                          <span className="text-brand-light">Total Cost</span>
                          <span className="text-brand-primary">{calculateTotalCost()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Purchase Button */}
                    <button
                      onClick={handlePurchase}
                      disabled={!isConnected}
                      className="w-full px-6 py-4 bg-brand-primary hover:bg-brand-primary/80 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold text-lg transition-colors"
                    >
                      {!isConnected ? 'Connect Wallet to Invest' : 'Purchase Tokens'}
                    </button>

                    <p className="text-xs text-brand-light/60 mt-4 text-center">
                      By investing, you agree to our terms and conditions. Investments are subject to risk.
                    </p>
                  </>
                )}

                {property.status === 'Active' && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎉</div>
                    <h3 className="text-xl font-bold text-green-400 mb-2">Fully Funded!</h3>
                    <p className="text-brand-light/70">This property is now generating returns for investors.</p>
                  </div>
                )}

                {property.status === 'Completed' && (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">✅</div>
                    <h3 className="text-xl font-bold text-blue-400 mb-2">Investment Complete</h3>
                    <p className="text-brand-light/70">This investment has been successfully completed.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
