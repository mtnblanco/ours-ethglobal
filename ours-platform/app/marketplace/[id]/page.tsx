'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, TrendingUp, Users, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TabNavigation from '@/components/TabNavigation';
import { useAllProperties, usePropertiesWithSales, formatTokenAmount, formatBasisPoints } from '@/hooks/usePropertyRegistry';
import { useUSDCBalance } from '@/hooks/useUserHoldings';
import { useBuyTokens } from '@/hooks/useBuyTokens';
import { useAccount } from 'wagmi';
import { Address } from 'viem';

export default function PropertyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const propertyId = params.id as string;

    console.log('🔍 Debug PropertyDetailPage:', {
        params,
        propertyId: propertyId
    });

    const { address: userAddress } = useAccount();
    const { propertyAddresses, isLoading: isLoadingAddresses } = useAllProperties();
    const { properties: allProperties, isLoading: isLoadingProperties } = usePropertiesWithSales(propertyAddresses);
    const { formatted: usdcBalance, balance: usdcBalanceRaw, isLoading: isLoadingBalance } = useUSDCBalance();
    const { buyTokens, isPending, isConfirming, isConfirmed, error: buyError } = useBuyTokens();

    const propertyWithSale = allProperties?.find((p: any) => p?.property?.token?.toLowerCase() === propertyId?.toLowerCase());

    const [tokenAmount, setTokenAmount] = useState(1);
    const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'documents' | 'location'>('overview');
    const [isBuying, setIsBuying] = useState(false);

    const isLoading = isLoadingAddresses || isLoadingProperties;

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center overflow-x-hidden">
                <Navbar />
                <div className="text-center pt-32 px-6">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2D2E63] mx-auto"></div>
                    <h1 className="text-2xl font-bold text-[#1E2046] mt-4">Loading property...</h1>
                </div>
            </div>
        );
    }

    if (!propertyWithSale) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center overflow-x-hidden">
                <Navbar />
                <div className="text-center pt-32 px-6">
                    <h1 className="text-4xl font-bold text-[#1E2046] mb-4">Property Not Found</h1>
                    <p className="text-gray-600 mb-4">
                        Property ID: {propertyId}
                    </p>
                    <p className="text-gray-600 mb-6">
                        Available properties: {allProperties?.length || 0}
                    </p>
                    <button
                        onClick={() => router.push('/marketplace')}
                        className="px-6 py-3 bg-[#2D2E63] text-[#B0CBFF] rounded-lg hover:bg-[#1E2046] transition-colors"
                    >
                        Back to Marketplace
                    </button>
                </div>
            </div>
        );
    }

    const property = propertyWithSale.property;
    const sale = propertyWithSale.sale;

    const tokenPrice = sale.pricePerToken ? parseFloat(formatTokenAmount(sale.pricePerToken, 6)) : 0;
    const totalCost = tokenAmount * tokenPrice;
    const gasFee = 2.50;
    const protocolFee = totalCost * 0.005;
    const grandTotal = totalCost + gasFee + protocolFee;

    const userBalanceNumber = parseFloat(usdcBalance);

    // Handle buy tokens
    const handleBuyTokens = async () => {
        if (!userAddress) {
            alert('Please connect your wallet first');
            return;
        }

        if (grandTotal > userBalanceNumber) {
            alert('Insufficient USDC balance');
            return;
        }

        setIsBuying(true);

        try {
            const result = await buyTokens({
                propertyAddress: property.token as Address,
                tokenAmount: BigInt(tokenAmount),
                pricePerToken: sale.pricePerToken,
            });

            if (result.success) {
                alert('Purchase successful! Transaction ID: ' + result.transactionId);
            } else {
                alert('Purchase failed: ' + result.error);
            }
        } catch (err: any) {
            console.error('Error buying tokens:', err);
            alert('Error: ' + err.message);
        } finally {
            setIsBuying(false);
        }
    };

    const fundedPercentage = property.totalInvestmentTarget && sale.totalRaised ? 
        (Number(formatTokenAmount(sale.totalRaised, 18)) / Number(formatTokenAmount(property.totalInvestmentTarget, 18))) * 100 : 0;

    const displayData = {
        title: property.name || 'Property Investment',
        location: property.location || 'Location TBD',
        type: 'REAL ESTATE',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
        description: 'Real estate investment opportunity on the blockchain.',
        highlights: [
            'Blockchain-verified ownership',
            'Transparent smart contracts',
            'Fractional investment opportunity',
            'Professional property management'
        ]
    };

    return (
        <div className="min-h-screen bg-[#FFFBF5] pb-24 md:pb-16 overflow-x-hidden">
            <Navbar />
            <TabNavigation />

            <main className="pt-32 pb-16 px-4 md:px-6 overflow-x-hidden">
                <div className="container mx-auto max-w-7xl">
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => router.push('/marketplace')}
                        className="flex items-center gap-2 text-[#1E2046]/70 hover:text-[#1E2046] mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-semibold">Back to Marketplace</span>
                    </motion.button>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 max-w-full"
                    >
                        <div className="flex items-center gap-3 mb-4 flex-wrap">
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-bold rounded-lg border border-green-300">
                                Open for Investment
                            </span>
                            <span className="px-3 py-1 bg-black/5 text-black/70 text-xs font-bold rounded-md uppercase tracking-wide">
                                {displayData.type}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E2046] mb-3 break-words">
                            {displayData.title}
                        </h1>
                        <div className="flex items-center gap-2 text-[#1E2046]/60">
                            <MapPin className="w-5 h-5" />
                            <span className="text-lg">{displayData.location}</span>
                        </div>
                    </motion.div>

                    <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="relative aspect-[16/10] rounded-2xl overflow-hidden"
                            >
                                <img
                                    src={displayData.image}
                                    alt={displayData.title}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-xl p-6 border border-[#E4F0FF]"
                            >
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-semibold text-[#1E2046]/70 uppercase tracking-wide">Funding Progress</span>
                                    <span className="text-2xl font-bold text-[#1E2046]">{fundedPercentage.toFixed(1)}%</span>
                                </div>
                                <div className="w-full bg-[#F1F5F9] rounded-full h-3 mb-4">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: fundedPercentage + '%' }}
                                        transition={{ duration: 1.5, delay: 0.5 }}
                                        className="bg-gradient-to-r from-[#4CAF50] to-[#45A049] h-3 rounded-full"
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <p className="text-2xl font-bold text-[#1E2046]">
                                            ${Number(formatTokenAmount(sale.totalRaised || BigInt(0), 18)).toLocaleString()}
                                        </p>
                                        <p className="text-sm text-[#1E2046]/60">Raised</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-[#1E2046]">
                                            ${Number(formatTokenAmount(property.totalInvestmentTarget || BigInt(0), 18)).toLocaleString()}
                                        </p>
                                        <p className="text-sm text-[#1E2046]/60">Target</p>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-[#1E2046]">
                                            {Number(formatTokenAmount(property.totalTokenSupply || BigInt(0), 0)).toLocaleString()}
                                        </p>
                                        <p className="text-sm text-[#1E2046]/60">Total Tokens</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white rounded-xl border border-[#E4F0FF] overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-[#1E2046] mb-3">About This Property</h3>
                                            <p className="text-[#1E2046]/70 leading-relaxed">
                                                {displayData.description}
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="text-md font-bold text-[#1E2046] mb-3">Key Highlights</h4>
                                            <ul className="space-y-2">
                                                {displayData.highlights.map((highlight, idx) => (
                                                    <li key={idx} className="flex items-center gap-2 text-[#1E2046]/70">
                                                        <div className="w-2 h-2 bg-[#4CAF50] rounded-full flex-shrink-0" />
                                                        {highlight}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4">
                                            <div className="bg-[#F8FAFC] p-4 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Users className="w-4 h-4 text-[#2D2E63]" />
                                                    <span className="text-sm font-semibold text-[#1E2046]/70">Token Supply</span>
                                                </div>
                                                <p className="text-lg font-bold text-[#1E2046]">
                                                    {Number(formatTokenAmount(property.totalTokenSupply || BigInt(0), 0)).toLocaleString()}
                                                </p>
                                            </div>
                                            <div className="bg-[#F8FAFC] p-4 rounded-lg">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <TrendingUp className="w-4 h-4 text-[#2D2E63]" />
                                                    <span className="text-sm font-semibold text-[#1E2046]/70">Price per Token</span>
                                                </div>
                                                <p className="text-lg font-bold text-[#1E2046]">
                                                    ${tokenPrice.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white rounded-xl p-6 border border-[#E4F0FF] sticky top-8"
                            >
                                <h2 className="text-xl font-bold text-[#1E2046] mb-4">Invest in This Property</h2>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-[#1E2046] mb-2">
                                            Number of Tokens
                                        </label>
                                        <div className="flex">
                                            <button
                                                onClick={() => setTokenAmount(Math.max(1, tokenAmount - 1))}
                                                className="px-3 py-2 border border-r-0 border-[#E4F0FF] rounded-l-lg hover:bg-gray-50 text-[#1E2046]"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                value={tokenAmount}
                                                onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))}
                                                className="flex-1 px-3 py-2 border-t border-b border-[#E4F0FF] text-center focus:outline-none focus:ring-2 focus:ring-[#2D2E63]/20 text-[#1E2046]"
                                            />
                                            <button
                                                onClick={() => setTokenAmount(tokenAmount + 1)}
                                                className="px-3 py-2 border border-l-0 border-[#E4F0FF] rounded-r-lg hover:bg-gray-50 text-[#1E2046]"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-[#F8FAFC] p-4 rounded-lg space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-sm text-[#1E2046]/70">Token Price</span>
                                            <span className="font-semibold text-[#1E2046]">${tokenPrice.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-[#1E2046]/70">Subtotal</span>
                                            <span className="font-semibold text-[#1E2046]">${totalCost.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-[#1E2046]/70">Gas Fee</span>
                                            <span className="font-semibold text-[#1E2046]">${gasFee.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-[#1E2046]/70">Protocol Fee (0.5%)</span>
                                            <span className="font-semibold text-[#1E2046]">${protocolFee.toFixed(2)}</span>
                                        </div>
                                        <hr className="border-[#E4F0FF]" />
                                        <div className="flex justify-between">
                                            <span className="font-bold text-[#1E2046]">Total</span>
                                            <span className="font-bold text-[#1E2046] text-xl">${grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="bg-[#E8F4FD] p-3 rounded-lg">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[#1E2046]/70">Your USDC Balance</span>
                                            <span className="font-semibold text-[#1E2046]">
                                                {isLoadingBalance ? '...' : `$${usdcBalance}`}
                                            </span>
                                        </div>
                                    </div>

                                    {buyError && (
                                        <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                                            <p className="text-sm text-red-600">{buyError}</p>
                                        </div>
                                    )}

                                    {isConfirmed && (
                                        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                                            <p className="text-sm text-green-600">Purchase successful!</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={handleBuyTokens}
                                        disabled={!userAddress || grandTotal > userBalanceNumber || isBuying || isPending || isConfirming}
                                        className="w-full py-4 rounded-lg font-bold text-lg transition-all bg-[#2D2E63] text-[#B0CBFF] hover:bg-[#1E2046] hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {!userAddress
                                            ? 'Connect Wallet to Invest'
                                            : isBuying || isPending
                                            ? 'Processing...'
                                            : isConfirming
                                            ? 'Confirming...'
                                            : grandTotal > userBalanceNumber
                                            ? 'Insufficient Balance'
                                            : 'Invest Now'}
                                    </button>

                                    <p className="text-xs text-[#1E2046]/50 text-center">
                                        By investing, you agree to our terms and conditions
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
