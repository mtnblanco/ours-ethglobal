'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, TrendingUp, Users, Wallet, CheckCircle, XCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TabNavigation from '@/components/TabNavigation';
import { useAllProperties, usePropertiesWithSales, formatTokenAmount } from '@/hooks/usePropertyRegistry';
import { useUSDCBalance } from '@/hooks/useUserHoldings';
import { useMiniKitAuth } from '@/hooks/useMiniKitAuth';
// Import MiniKit specific types and library
import { MiniKit, tokenToDecimals, Tokens, PayCommandInput, ResponseEvent, MiniAppPaymentPayload } from '@worldcoin/minikit-js';

// Component to display status messages
const StatusMessage = ({ message, type }: { message: string, type: 'error' | 'success' | 'loading' }) => (
    <div className={`p-3 rounded-lg flex items-start gap-3 ${
        type === 'error' ? 'bg-red-50 border border-red-200 text-red-600' : 
        type === 'success' ? 'bg-green-50 border border-green-200 text-green-600' :
        'bg-blue-50 border border-blue-200 text-blue-600'
    }`}>
        {type === 'error' && <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
        {type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
        {type === 'loading' && <div className="w-5 h-5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin flex-shrink-0 mt-0.5" />}
        <p className="text-sm">{message}</p>
    </div>
);

export default function PropertyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const propertyId = params.id as string;

    // Hooks
    const { address: userAddress, isMiniKit, authenticate, isLoadingAuth } = useMiniKitAuth();
    const { propertyAddresses, isLoading: isLoadingAddresses } = useAllProperties();
    const { properties: allProperties, isLoading: isLoadingProperties } = usePropertiesWithSales(propertyAddresses);
    const { formatted: usdcBalance, balance: usdcBalanceRaw, isLoading: isLoadingBalance } = useUSDCBalance(userAddress);

    const propertyWithSale = allProperties?.find((p: any) => p?.property?.token?.toLowerCase() === propertyId?.toLowerCase());

    const [tokenAmount, setTokenAmount] = useState(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success' | 'loading', message: string } | null>(null);

    const isLoading = isLoadingAddresses || isLoadingProperties || isLoadingAuth;

    /**
     * Auto-Authentication Effect
     */
    useEffect(() => {
        if (isMiniKit && !userAddress && !isLoadingAuth) {
            console.log("MiniKit detected. Attempting auto-authentication...");
            authenticate().then(address => {
                if (address) {
                    setStatusMessage(null);
                }
            }).catch(e => {
                console.error("Auto-authentication failed:", e);
                setStatusMessage({ type: 'error', message: 'Failed to auto-connect wallet. Please check your World App.' });
            });
        }
    }, [isMiniKit, userAddress, isLoadingAuth, authenticate]);

    /**
     * Listener for Payment Response (Step 3 & 4 of the Payment Flow)
     */
    useEffect(() => {
        if (!MiniKit.isInstalled()) return;

        MiniKit.subscribe(
            ResponseEvent.MiniAppPayment,
            async (response: MiniAppPaymentPayload) => {
                if (response.status === "success") {
                    setStatusMessage({ type: 'loading', message: 'Payment sent! Verifying transaction...' });
                    
                    try {
                        // Step 4: Verify the payment in the backend
                        const res = await fetch(`/api/confirm-payment`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(response),
                        });
                        const payment = await res.json();
                        
                        if (payment.success) {
                            setStatusMessage({ type: 'success', message: 'Investment successful! Tokens will appear shortly.' });
                            setIsProcessing(false);
                        } else {
                            setStatusMessage({ type: 'error', message: 'Payment verification failed.' });
                            setIsProcessing(false);
                        }
                    } catch (error) {
                        setStatusMessage({ type: 'error', message: 'Server error verifying payment.' });
                        setIsProcessing(false);
                    }
                } else {
                    setStatusMessage({ type: 'error', message: 'Transaction cancelled or failed.' });
                    setIsProcessing(false);
                }
            }
        );

        return () => {
            MiniKit.unsubscribe(ResponseEvent.MiniAppPayment);
        };
    }, []);

    // --- Loading State ---
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

    // --- Not Found State ---
    if (!propertyWithSale) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center overflow-x-hidden">
                <Navbar />
                <div className="text-center pt-32 px-6">
                    <h1 className="text-4xl font-bold text-[#1E2046] mb-4">Property Not Found</h1>
                    <p className="text-gray-600 mb-4">Property ID: {propertyId}</p>
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

    // --- Calculations ---
    const tokenPrice = sale.pricePerToken ? parseFloat(formatTokenAmount(sale.pricePerToken, 6)) : 0;
    const totalCost = tokenAmount * tokenPrice;
    
    // Exact BigInt math for the transaction
    const pricePerTokenBigInt = sale.pricePerToken || BigInt(0);
    const tokenAmountBigInt = BigInt(tokenAmount);
    // USDC has 6 decimals
    const actualTotalCostRaw = (tokenAmountBigInt * pricePerTokenBigInt) / BigInt(10 ** 18); 
    const actualTotalCostFormatted = Number(actualTotalCostRaw) / Math.pow(10, 6);

    // Fees
    const gasFee = 0.00; // World App sponsors gas usually, setting to 0 or low estimate
    const protocolFee = totalCost * 0.005;
    const grandTotal = totalCost + gasFee + protocolFee;
    const userBalanceRawNumber = Number(usdcBalanceRaw) / Math.pow(10, 6);

    const fundedPercentage = property.totalInvestmentTarget && sale.totalRaised ? 
        (Number(formatTokenAmount(sale.totalRaised, 18)) / Number(formatTokenAmount(property.totalInvestmentTarget, 18))) * 100 : 0;

    const displayData = {
        title: property.name || 'Property Investment',
        location: property.location || 'Location TBD',
        type: 'REAL ESTATE',
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop',
        description: 'Real estate investment opportunity on the blockchain.',
        highlights: [
            'Verified blockchain property',
            'Transparent smart contracts',
            'Fractional investment opportunity',
            'Professional property management'
        ]
    };

    /**
     * Handle Buy Tokens (Step 1 & 2 of Payment Flow)
     */
    const handleBuyTokens = async () => {
        setStatusMessage(null);

        // 1. Environment Check
        if (!isMiniKit) {
            setStatusMessage({ type: 'error', message: '🌍 World App Required: You must open this inside World App to invest.' });
            return;
        }
        
        // 2. Auth Check
        if (!userAddress) {
            setStatusMessage({ type: 'loading', message: 'Connecting wallet... Please approve in World App.' });
            try {
                const address = await authenticate();
                if (!address) return; // Error handled in auth hook usually
            } catch (e) {
                setStatusMessage({ type: 'error', message: 'Wallet connection failed.' });
                return;
            }
        }

        // 3. Balance Check
        if (actualTotalCostFormatted > userBalanceRawNumber) {
            setStatusMessage({ type: 'error', message: `Insufficient USDC. You need $${actualTotalCostFormatted.toFixed(2)} but have $${userBalanceRawNumber.toFixed(2)}` });
            return;
        }

        setIsProcessing(true);
        setStatusMessage({ type: 'loading', message: 'Initiating payment...' });

        try {
            // Step 1: Initiate Payment (Get Reference ID)
            const res = await fetch('/api/initiate-payment', { method: 'POST' });
            if (!res.ok) throw new Error("Failed to initiate payment");
            const { id } = await res.json();

            // Step 2: Trigger MiniKit Pay Command
            const payload: PayCommandInput = {
                reference: id,
                to: property.token, // Address receiving the funds (The Property Contract)
                tokens: [
                    {
                        symbol: Tokens.USDC,
                        token_amount: tokenToDecimals(actualTotalCostFormatted, Tokens.USDC).toString(),
                    },
                ],
                description: `Investment in ${displayData.title}`,
            };

            MiniKit.commands.pay(payload);
            // The flow continues in the useEffect listener...

        } catch (err: any) {
            console.error('Error buying tokens:', err);
            setStatusMessage({ type: 'error', message: 'Unexpected error: ' + err.message });
            setIsProcessing(false);
        }
    };

    const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

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
                        {/* LEFT COLUMN: DETAILS */}
                        <div className="lg:col-span-2 space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="relative aspect-[16/10] rounded-2xl overflow-hidden"
                            >
                                <img src={displayData.image} alt={displayData.title} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            </motion.div>

                            {/* Funding Progress */}
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

                            {/* Info */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="bg-white rounded-xl border border-[#E4F0FF] overflow-hidden"
                            >
                                <div className="p-6">
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-bold text-[#1E2046] mb-3">About this Property</h3>
                                            <p className="text-[#1E2046]/70 leading-relaxed">{displayData.description}</p>
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
                                                <p className="text-lg font-bold text-[#1E2046]">${tokenPrice.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* RIGHT COLUMN: INVESTMENT ACTION */}
                        <div className="lg:col-span-1">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white rounded-xl p-6 border border-[#E4F0FF] sticky top-8"
                            >
                                <h2 className="text-xl font-bold text-[#1E2046] mb-4">Invest in this Property</h2>
                                
                                <div className="bg-[#F8FAFC] p-4 rounded-lg mb-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <Wallet className="w-4 h-4 text-[#2D2E63]" />
                                            <span className="font-semibold text-[#1E2046]">Wallet</span>
                                        </div>
                                        {userAddress ? (
                                            <span className="font-mono text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                                {formatAddress(userAddress)}
                                            </span>
                                        ) : (
                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                                Disconnected
                                            </span>
                                        )}
                                    </div>
                                    {!isMiniKit && (
                                        <p className="text-xs text-red-500 mt-2">*Transactions available only in World App.</p>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-[#1E2046] mb-2">Token Quantity</label>
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
                                            <span className="text-sm text-[#1E2046]/70">Protocol Fee (0.5%)</span>
                                            <span className="font-semibold text-[#1E2046]">${protocolFee.toFixed(2)}</span>
                                        </div>
                                        <hr className="border-[#E4F0FF]" />
                                        <div className="flex justify-between">
                                            <span className="font-bold text-[#1E2046]">Total (USDC)</span>
                                            <span className="font-bold text-[#1E2046] text-xl">${grandTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                    {/* Status Messages */}
                                    {statusMessage && (
                                        <StatusMessage 
                                            message={statusMessage.message} 
                                            type={statusMessage.type} 
                                        />
                                    )}

                                    <button
                                        onClick={handleBuyTokens}
                                        disabled={!isMiniKit || !userAddress || actualTotalCostFormatted > userBalanceRawNumber || isProcessing}
                                        className="w-full py-4 rounded-lg font-bold text-lg transition-all bg-[#2D2E63] text-[#B0CBFF] hover:bg-[#1E2046] hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    >
                                        {!isMiniKit ? 'Open in World App to Invest'
                                            : !userAddress ? 'Connect Wallet'
                                            : isProcessing ? 'Processing Payment...'
                                            : actualTotalCostFormatted > userBalanceRawNumber ? 'Insufficient Balance'
                                            : 'Invest Now'}
                                    </button>

                                    <p className="text-xs text-[#1E2046]/50 text-center">
                                        By investing, you agree to our terms and conditions.
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