'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wallet, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight, Building2, PieChart, Eye } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import TabNavigation from '@/components/TabNavigation';
import { useRouter } from 'next/navigation';
import { useUserHoldings, useUSDCBalance } from '@/hooks/useUserHoldings';
import { formatTokenAmount } from '@/hooks/usePropertyRegistry';

export default function HoldingsPage() {
  const router = useRouter();
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('30d');

  // Get real blockchain data
  const { holdings, isLoading, userAddress } = useUserHoldings();
  const { formatted: usdcBalance, isLoading: isLoadingUSDC } = useUSDCBalance();

  // Transform blockchain holdings to display format
  const displayHoldings = holdings.map((holding) => {
    const tokens = Number(formatTokenAmount(holding.tokenBalance, 0));
    const tokenPrice = Number(formatTokenAmount(holding.tokenPrice, 6));
    const totalValue = tokens * tokenPrice;

    // Calculate estimated ROI
    const totalInvestmentTarget = Number(formatTokenAmount(holding.totalInvestmentTarget, 6));
    const estimatedSalePrice = Number(formatTokenAmount(holding.estimatedSalePrice, 6));
    const roi = totalInvestmentTarget > 0
      ? ((estimatedSalePrice - totalInvestmentTarget) / totalInvestmentTarget) * 100
      : 0;
    const apy = roi > 0 ? roi / 5 : 0; // Simplified: assume 5 year holding period
    const monthlyYield = (totalValue * (apy / 100)) / 12;

    // For now, assume purchase price = current value (no historical data)
    const purchasePrice = totalValue;
    const profitLoss = 0; // Would need historical purchase data
    const profitLossPercentage = 0;

    return {
      id: holding.propertyAddress.toLowerCase(),
      propertyName: holding.propertyName,
      location: holding.location,
      tokens,
      tokenPrice,
      totalValue,
      purchasePrice,
      profitLoss,
      profitLossPercentage,
      apy,
      monthlyYield,
      image: holding.ipfsHash
        ? `https://ipfs.io/ipfs/${holding.ipfsHash}`
        : 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    };
  });

  const totalPortfolioValue = displayHoldings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalInvested = displayHoldings.reduce((sum, h) => sum + h.purchasePrice, 0);
  const totalProfitLoss = totalPortfolioValue - totalInvested;
  const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
  const totalMonthlyYield = displayHoldings.reduce((sum, h) => sum + h.monthlyYield, 0);
  const totalTokens = displayHoldings.reduce((sum, h) => sum + h.tokens, 0);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFBF5] pb-24 md:pb-16 overflow-x-hidden">
        <Navbar />
        <TabNavigation />

        <main className="pt-32 pb-16 px-4 md:px-6">
          <div className="container mx-auto max-w-7xl">

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-[#1E2046] mb-2">My Holdings</h1>
              <p className="text-lg text-[#1E2046]/60">Track your real estate token portfolio</p>
            </motion.div>

            {/* Portfolio Overview */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-[#2D2E63] to-[#1E2046] rounded-3xl border-2 border-black p-8 mb-8 shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <Wallet className="w-8 h-8 text-[#B0CBFF]" />
                <h2 className="text-2xl font-bold text-white">Total Portfolio Value</h2>
              </div>

              <div className="mb-6">
                <p className="text-5xl md:text-6xl font-bold text-white mb-2">
                  ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="flex items-center gap-2">
                  {totalProfitLoss >= 0 ? (
                    <>
                      <ArrowUpRight className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-semibold">
                        +${totalProfitLoss.toFixed(2)} (+{totalProfitLossPercentage.toFixed(2)}%)
                      </span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-semibold">
                        ${totalProfitLoss.toFixed(2)} ({totalProfitLossPercentage.toFixed(2)}%)
                      </span>
                    </>
                  )}
                  <span className="text-[#B0CBFF]/60 ml-2">Last 30 days</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-[#B0CBFF]/80 text-sm mb-1">Total Invested</p>
                  <p className="text-white text-xl font-bold">${totalInvested.toLocaleString()}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-[#B0CBFF]/80 text-sm mb-1">Monthly Yield</p>
                  <p className="text-white text-xl font-bold">${totalMonthlyYield.toFixed(2)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-[#B0CBFF]/80 text-sm mb-1">Total Tokens</p>
                  <p className="text-white text-xl font-bold">{totalTokens}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                  <p className="text-[#B0CBFF]/80 text-sm mb-1">Properties</p>
                  <p className="text-white text-xl font-bold">{displayHoldings.length}</p>
                </div>
              </div>
            </motion.div>

            {/* Holdings List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-[#1E2046]">Your Properties</h2>
                <div className="flex gap-2">
                  {(['24h', '7d', '30d', 'all'] as const).map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        timeframe === tf
                          ? 'bg-[#2D2E63] text-[#B0CBFF]'
                          : 'bg-white text-[#1E2046]/60 border border-black/10 hover:border-[#2D2E63]'
                      }`}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {isLoading ? (
                <div className="bg-white rounded-3xl border-2 border-black p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D2E63] mx-auto mb-4"></div>
                  <h3 className="text-2xl font-bold text-[#1E2046] mb-2">Loading your holdings...</h3>
                  <p className="text-[#1E2046]/60">Fetching data from blockchain</p>
                </div>
              ) : !userAddress ? (
                <div className="bg-white rounded-3xl border-2 border-black p-12 text-center">
                  <Wallet className="w-16 h-16 text-[#1E2046]/30 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-[#1E2046] mb-2">Connect Your Wallet</h3>
                  <p className="text-[#1E2046]/60 mb-6">Connect your wallet to view your holdings</p>
                </div>
              ) : displayHoldings.length === 0 ? (
                <div className="bg-white rounded-3xl border-2 border-black p-12 text-center">
                  <PieChart className="w-16 h-16 text-[#1E2046]/30 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-[#1E2046] mb-2">No Holdings Yet</h3>
                  <p className="text-[#1E2046]/60 mb-6">Start investing in tokenized real estate</p>
                  <button
                    onClick={() => router.push('/marketplace')}
                    className="px-6 py-3 bg-[#2D2E63] text-[#B0CBFF] rounded-lg font-semibold hover:bg-[#1E2046] transition-all duration-300"
                  >
                    Browse Marketplace
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {displayHoldings.map((holding, index) => (
                    <motion.div
                      key={holding.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="bg-white rounded-2xl border-2 border-black p-6 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Property Image */}
                        <div className="w-full md:w-48 h-48 rounded-xl overflow-hidden flex-shrink-0">
                          <img
                            src={holding.image}
                            alt={holding.propertyName}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Property Info */}
                        <div className="flex-1 space-y-4">
                          <div>
                            <h3 className="text-2xl font-bold text-[#1E2046] mb-1">{holding.propertyName}</h3>
                            <p className="text-[#1E2046]/60 flex items-center gap-1">
                              <Building2 className="w-4 h-4" />
                              {holding.location}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-[#1E2046]/60 mb-1">Tokens Owned</p>
                              <p className="text-lg font-bold text-[#1E2046]">{holding.tokens}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#1E2046]/60 mb-1">Token Price</p>
                              <p className="text-lg font-bold text-[#1E2046]">${holding.tokenPrice}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#1E2046]/60 mb-1">Total Value</p>
                              <p className="text-lg font-bold text-[#1E2046]">${holding.totalValue.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-[#1E2046]/60 mb-1">APY</p>
                              <p className="text-lg font-bold text-green-600">{holding.apy}%</p>
                            </div>
                          </div>

                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-4 border-t border-black/10">
                            <div className="flex items-center gap-6">
                              <div>
                                <p className="text-xs text-[#1E2046]/60 mb-1">Profit/Loss</p>
                                <div className="flex items-center gap-2">
                                  {holding.profitLoss >= 0 ? (
                                    <>
                                      <ArrowUpRight className="w-4 h-4 text-green-600" />
                                      <span className="font-bold text-green-600">
                                        +${holding.profitLoss.toFixed(2)} (+{holding.profitLossPercentage.toFixed(2)}%)
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <ArrowDownRight className="w-4 h-4 text-red-600" />
                                      <span className="font-bold text-red-600">
                                        ${holding.profitLoss.toFixed(2)} ({holding.profitLossPercentage.toFixed(2)}%)
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div>
                                <p className="text-xs text-[#1E2046]/60 mb-1">Monthly Yield</p>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-[#2D2E63]" />
                                  <span className="font-bold text-[#2D2E63]">${holding.monthlyYield.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => router.push(`/marketplace/${holding.id}`)}
                              className="flex items-center gap-2 px-4 py-2 bg-[#2D2E63] text-[#B0CBFF] rounded-lg font-semibold hover:bg-[#1E2046] transition-all duration-300"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View Details</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
