'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, TrendingUp, Users, Calendar } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TabNavigation from '@/components/TabNavigation';

// Mock data - matches MarketplaceList properties
const ALL_PROPERTIES = [
    {
        id: 1,
        type: "COMMERCIAL",
        title: "Skyline Commercial Tower",
        location: "Buenos Aires, Palermo",
        apy: 12.4,
        price: "50.00",
        funded: 78,
        image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop",
        totalTokens: 10000,
        soldTokens: 7800,
        description: "Premium commercial office space in the heart of Palermo, Buenos Aires. This modern tower offers exceptional rental yields and capital appreciation potential.",
        highlights: [
            "Prime location in business district",
            "100% occupancy rate",
            "Long-term corporate tenants",
            "Modern amenities and infrastructure"
        ],
        financials: {
            propertyValue: 500000,
            tokenPrice: 50,
            totalTokens: 10000,
            minimumInvestment: 50,
            projectedAPY: 12.4,
            rentalYield: 8.5
        }
    },
    {
        id: 2,
        type: "RESIDENTIAL",
        title: "Sunset Boulevard Apt",
        location: "Miami, Brickell",
        apy: 10.2,
        price: "45.00",
        funded: 45,
        image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=800&auto=format&fit=crop",
        totalTokens: 8000,
        soldTokens: 3600,
        description: "Luxury residential apartments in Miami's prestigious Brickell district. Modern living spaces with stunning ocean views and world-class amenities.",
        highlights: [
            "Ocean view apartments",
            "Premium finishes and appliances",
            "Resort-style amenities",
            "Growing neighborhood"
        ],
        financials: {
            propertyValue: 360000,
            tokenPrice: 45,
            totalTokens: 8000,
            minimumInvestment: 45,
            projectedAPY: 10.2,
            rentalYield: 7.8
        }
    },
    {
        id: 3,
        type: "INDUSTRIAL",
        title: "Logistics Hub Alpha",
        location: "Mexico City, Santa Fe",
        apy: 14.1,
        price: "100.00",
        funded: 92,
        image: "https://images.unsplash.com/photo-1553413077-190dd305871c?q=80&w=800&auto=format&fit=crop",
        totalTokens: 15000,
        soldTokens: 13800,
        description: "Strategic logistics facility in Mexico City's Santa Fe district. State-of-the-art warehouse with excellent connectivity to major transportation routes.",
        highlights: [
            "Strategic location near highways",
            "Modern warehouse facilities",
            "High demand logistics area",
            "Long-term lease agreements"
        ],
        financials: {
            propertyValue: 1500000,
            tokenPrice: 100,
            totalTokens: 15000,
            minimumInvestment: 100,
            projectedAPY: 14.1,
            rentalYield: 10.5
        }
    },
    {
        id: 4,
        type: "RESIDENTIAL",
        title: "Luxury Beach Villa",
        location: "Cancun, Mexico",
        apy: 9.5,
        price: "75.00",
        funded: 62,
        image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800&auto=format&fit=crop",
        totalTokens: 12000,
        soldTokens: 7440,
        description: "Stunning beachfront villa in Cancun's exclusive hotel zone. Perfect blend of luxury vacation rental and investment opportunity.",
        highlights: [
            "Direct beach access",
            "High-end vacation rental market",
            "Premium location",
            "Professional property management"
        ],
        financials: {
            propertyValue: 900000,
            tokenPrice: 75,
            totalTokens: 12000,
            minimumInvestment: 75,
            projectedAPY: 9.5,
            rentalYield: 6.8
        }
    },
    {
        id: 5,
        type: "COMMERCIAL",
        title: "Tech Park Office Space",
        location: "Austin, Texas",
        apy: 11.8,
        price: "60.00",
        funded: 85,
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=800&auto=format&fit=crop",
        totalTokens: 11000,
        soldTokens: 9350,
        description: "Modern office space in Austin's thriving tech corridor. Attracts top-tier technology companies and startups.",
        highlights: [
            "Tech hub location",
            "Modern infrastructure",
            "High-quality tenants",
            "Strong market demand"
        ],
        financials: {
            propertyValue: 660000,
            tokenPrice: 60,
            totalTokens: 11000,
            minimumInvestment: 60,
            projectedAPY: 11.8,
            rentalYield: 8.9
        }
    },
    {
        id: 6,
        type: "RESIDENTIAL",
        title: "Mountain View Residence",
        location: "Denver, Colorado",
        apy: 8.9,
        price: "55.00",
        funded: 55,
        image: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=800&auto=format&fit=crop",
        totalTokens: 9000,
        soldTokens: 4950,
        description: "Contemporary mountain residence with breathtaking views. Located in Denver's fastest-growing neighborhood.",
        highlights: [
            "Mountain views",
            "Growing neighborhood",
            "Modern design",
            "Excellent schools nearby"
        ],
        financials: {
            propertyValue: 495000,
            tokenPrice: 55,
            totalTokens: 9000,
            minimumInvestment: 55,
            projectedAPY: 8.9,
            rentalYield: 6.5
        }
    },
    {
        id: 7,
        type: "INDUSTRIAL",
        title: "Distribution Center",
        location: "Singapore",
        apy: 13.2,
        price: "90.00",
        funded: 95,
        image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800&auto=format&fit=crop",
        totalTokens: 18000,
        soldTokens: 17100,
        description: "Premium distribution center in Singapore's industrial zone. Strategic location for Asia-Pacific logistics operations.",
        highlights: [
            "Strategic Asian hub",
            "Modern logistics facilities",
            "Excellent connectivity",
            "Strong tenant demand"
        ],
        financials: {
            propertyValue: 1620000,
            tokenPrice: 90,
            totalTokens: 18000,
            minimumInvestment: 90,
            projectedAPY: 13.2,
            rentalYield: 10.1
        }
    },
    {
        id: 8,
        type: "COMMERCIAL",
        title: "Retail Shopping Plaza",
        location: "Madrid, Spain",
        apy: 10.7,
        price: "65.00",
        funded: 70,
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
        totalTokens: 13000,
        soldTokens: 9100,
        description: "Prime retail plaza in Madrid's shopping district. High foot traffic and premium retail tenants.",
        highlights: [
            "Prime retail location",
            "High foot traffic",
            "Mix of international brands",
            "Stable rental income"
        ],
        financials: {
            propertyValue: 845000,
            tokenPrice: 65,
            totalTokens: 13000,
            minimumInvestment: 65,
            projectedAPY: 10.7,
            rentalYield: 8.2
        }
    },
    {
        id: 9,
        type: "RESIDENTIAL",
        title: "Urban Loft Complex",
        location: "Brooklyn, New York",
        apy: 9.8,
        price: "80.00",
        funded: 88,
        image: "https://images.unsplash.com/photo-1502672260066-6bc35f0cdeae?q=80&w=800&auto=format&fit=crop",
        totalTokens: 14000,
        soldTokens: 12320,
        description: "Converted industrial lofts in Brooklyn's trendy neighborhood. Modern urban living with historic character.",
        highlights: [
            "Trendy neighborhood",
            "Unique loft spaces",
            "Strong rental demand",
            "Historic building with modern amenities"
        ],
        financials: {
            propertyValue: 1120000,
            tokenPrice: 80,
            totalTokens: 14000,
            minimumInvestment: 80,
            projectedAPY: 9.8,
            rentalYield: 7.3
        }
    },
    {
        id: 10,
        type: "INDUSTRIAL",
        title: "Renewable Energy Facility",
        location: "Oslo, Norway",
        apy: 15.3,
        price: "120.00",
        funded: 42,
        image: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800&auto=format&fit=crop",
        totalTokens: 20000,
        soldTokens: 8400,
        description: "Green energy production facility in Norway. Sustainable investment with government incentives and long-term contracts.",
        highlights: [
            "Renewable energy focus",
            "Government incentives",
            "Long-term power contracts",
            "ESG compliant investment"
        ],
        financials: {
            propertyValue: 2400000,
            tokenPrice: 120,
            totalTokens: 20000,
            minimumInvestment: 120,
            projectedAPY: 15.3,
            rentalYield: 11.8
        }
    },
    {
        id: 11,
        type: "COMMERCIAL",
        title: "Downtown Hotel",
        location: "Paris, France",
        apy: 11.2,
        price: "95.00",
        funded: 68,
        image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop",
        totalTokens: 16000,
        soldTokens: 10880,
        description: "Boutique hotel in central Paris. Consistent occupancy rates and premium positioning in the hospitality market.",
        highlights: [
            "Prime Paris location",
            "Boutique hotel experience",
            "Strong tourism market",
            "Professional management"
        ],
        financials: {
            propertyValue: 1520000,
            tokenPrice: 95,
            totalTokens: 16000,
            minimumInvestment: 95,
            projectedAPY: 11.2,
            rentalYield: 8.7
        }
    },
    {
        id: 12,
        type: "RESIDENTIAL",
        title: "Coastal Apartments",
        location: "Barcelona, Spain",
        apy: 10.5,
        price: "70.00",
        funded: 75,
        image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=800&auto=format&fit=crop",
        totalTokens: 10500,
        soldTokens: 7875,
        description: "Modern apartments with Mediterranean Sea views. Perfect for vacation rentals and long-term residents.",
        highlights: [
            "Sea views",
            "Tourism hotspot",
            "Modern amenities",
            "Strong rental market"
        ],
        financials: {
            propertyValue: 735000,
            tokenPrice: 70,
            totalTokens: 10500,
            minimumInvestment: 70,
            projectedAPY: 10.5,
            rentalYield: 7.9
        }
    }
];

export default function PropertyDetailPage() {
    const params = useParams();
    const router = useRouter();
    const propertyId = parseInt(params.id as string);

    const property = ALL_PROPERTIES.find(p => p.id === propertyId);

    const [tokenAmount, setTokenAmount] = useState(1);
    const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'documents' | 'location'>('overview');
    const [userBalance] = useState(1250.50); // Mock user balance

    if (!property) {
        return (
            <div className="min-h-screen bg-[#FFFBF5] flex items-center justify-center overflow-x-hidden">
                <Navbar />
                <div className="text-center pt-32 px-6">
                    <h1 className="text-4xl font-bold text-[#1E2046] mb-4">Property Not Found</h1>
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

    const tokenPrice = parseFloat(property.price);
    const totalCost = tokenAmount * tokenPrice;
    const gasFee = 2.50; // Mock gas fee
    const protocolFee = totalCost * 0.005; // 0.5% protocol fee
    const grandTotal = totalCost + gasFee + protocolFee;

    const tabs = [
        { id: 'overview' as const, label: 'Overview' },
        { id: 'financials' as const, label: 'Financials' },
        { id: 'documents' as const, label: 'Documents' },
        { id: 'location' as const, label: 'Location' }
    ];

    return (
        <div className="min-h-screen bg-[#FFFBF5] pb-24 md:pb-16 overflow-x-hidden">
            <Navbar />
            <TabNavigation />

            <main className="pt-32 pb-16 px-4 md:px-6 overflow-x-hidden">
                <div className="container mx-auto max-w-7xl">

                    {/* Back Button */}
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={() => router.push('/marketplace')}
                        className="flex items-center gap-2 text-[#1E2046]/70 hover:text-[#1E2046] mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-semibold">Back to Marketplace</span>
                    </motion.button>

                    {/* Property Header */}
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
                                {property.type}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#1E2046] mb-3 break-words">
                            {property.title}
                        </h1>
                        <div className="flex items-center gap-2 text-[#1E2046]/60">
                            <MapPin className="w-5 h-5" />
                            <span className="text-lg">{property.location}</span>
                        </div>
                    </motion.div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-full overflow-x-hidden">

                        {/* Left Column - Property Image and Details */}
                        <div className="lg:col-span-2 space-y-8 max-w-full overflow-x-hidden">

                            {/* Property Image */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="relative h-[400px] rounded-3xl overflow-hidden border-2 border-black/10"
                            >
                                <img
                                    src={property.image}
                                    alt={property.title}
                                    className="w-full h-full object-cover"
                                />
                            </motion.div>

                            {/* Tabs */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="flex gap-2 border-b border-black/10 mb-6 overflow-x-auto">
                                    {tabs.map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={`px-4 md:px-6 py-3 font-semibold transition-all whitespace-nowrap ${
                                                activeTab === tab.id
                                                    ? 'text-[#1E2046] border-b-2 border-[#1E2046]'
                                                    : 'text-[#1E2046]/50 hover:text-[#1E2046]/70'
                                            }`}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Tab Content */}
                                <div className="bg-white rounded-2xl border-2 border-black/10 p-6">
                                    {activeTab === 'overview' && (
                                        <div className="space-y-6">
                                            <div>
                                                <h3 className="text-xl font-bold text-[#1E2046] mb-3">About this property</h3>
                                                <p className="text-[#1E2046]/70 leading-relaxed">
                                                    {property.description}
                                                </p>
                                            </div>

                                            <div>
                                                <h3 className="text-xl font-bold text-[#1E2046] mb-3">Key Highlights</h3>
                                                <ul className="space-y-2">
                                                    {property.highlights.map((highlight, idx) => (
                                                        <li key={idx} className="flex items-start gap-2 text-[#1E2046]/70">
                                                            <span className="text-[#B0CBFF] mt-1">•</span>
                                                            <span>{highlight}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 pt-4">
                                                <div className="bg-[#FFFBF5] rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <TrendingUp className="w-5 h-5 text-[#1E2046]/50" />
                                                        <span className="text-xs font-bold text-[#1E2046]/50 uppercase">Est. APY</span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-[#1E2046]">{property.apy}%</p>
                                                </div>
                                                <div className="bg-[#FFFBF5] rounded-xl p-4">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Users className="w-5 h-5 text-[#1E2046]/50" />
                                                        <span className="text-xs font-bold text-[#1E2046]/50 uppercase">Investors</span>
                                                    </div>
                                                    <p className="text-2xl font-bold text-[#1E2046]">{property.soldTokens}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'financials' && (
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-[#1E2046] mb-4">Financial Information</h3>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-[#FFFBF5] rounded-xl p-4">
                                                    <p className="text-xs font-bold text-[#1E2046]/50 uppercase mb-1">Property Value</p>
                                                    <p className="text-xl font-bold text-[#1E2046]">${property.financials.propertyValue.toLocaleString()}</p>
                                                </div>
                                                <div className="bg-[#FFFBF5] rounded-xl p-4">
                                                    <p className="text-xs font-bold text-[#1E2046]/50 uppercase mb-1">Token Price</p>
                                                    <p className="text-xl font-bold text-[#1E2046]">${property.financials.tokenPrice}</p>
                                                </div>
                                                <div className="bg-[#FFFBF5] rounded-xl p-4">
                                                    <p className="text-xs font-bold text-[#1E2046]/50 uppercase mb-1">Total Tokens</p>
                                                    <p className="text-xl font-bold text-[#1E2046]">{property.financials.totalTokens.toLocaleString()}</p>
                                                </div>
                                                <div className="bg-[#FFFBF5] rounded-xl p-4">
                                                    <p className="text-xs font-bold text-[#1E2046]/50 uppercase mb-1">Min. Investment</p>
                                                    <p className="text-xl font-bold text-[#1E2046]">${property.financials.minimumInvestment}</p>
                                                </div>
                                                <div className="bg-[#FFFBF5] rounded-xl p-4">
                                                    <p className="text-xs font-bold text-[#1E2046]/50 uppercase mb-1">Projected APY</p>
                                                    <p className="text-xl font-bold text-[#1E2046]">{property.financials.projectedAPY}%</p>
                                                </div>
                                                <div className="bg-[#FFFBF5] rounded-xl p-4">
                                                    <p className="text-xs font-bold text-[#1E2046]/50 uppercase mb-1">Rental Yield</p>
                                                    <p className="text-xl font-bold text-[#1E2046]">{property.financials.rentalYield}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'documents' && (
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-[#1E2046] mb-4">Legal Documents</h3>
                                            <div className="space-y-3">
                                                {['Property Deed', 'Tokenization Agreement', 'Rental Contract', 'Insurance Policy'].map((doc, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-[#FFFBF5] rounded-xl border border-black/5 hover:border-black/10 transition-colors cursor-pointer">
                                                        <div className="flex items-center gap-3">
                                                            <Calendar className="w-5 h-5 text-[#1E2046]/50" />
                                                            <span className="font-semibold text-[#1E2046]">{doc}</span>
                                                        </div>
                                                        <span className="text-sm text-[#1E2046]/50">PDF</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'location' && (
                                        <div className="space-y-4">
                                            <h3 className="text-xl font-bold text-[#1E2046] mb-4">Location Details</h3>
                                            <div className="bg-[#FFFBF5] rounded-xl p-6">
                                                <div className="flex items-start gap-2 mb-4">
                                                    <MapPin className="w-5 h-5 text-[#1E2046]/50 mt-1" />
                                                    <div>
                                                        <p className="font-semibold text-[#1E2046]">{property.location}</p>
                                                        <p className="text-sm text-[#1E2046]/60 mt-1">Prime location with excellent connectivity</p>
                                                    </div>
                                                </div>
                                                <div className="h-[500px] rounded-xl overflow-hidden border-2 border-black/10">
                                                    <iframe
                                                        width="100%"
                                                        height="100%"
                                                        style={{ border: 0 }}
                                                        loading="lazy"
                                                        allowFullScreen
                                                        referrerPolicy="no-referrer-when-downgrade"
                                                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(property.location)}&zoom=18&maptype=satellite`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </div>

                        {/* Right Column - Purchase Panel */}
                        <div className="lg:col-span-1 max-w-full">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="sticky top-32 bg-white rounded-3xl border-2 border-black p-6 shadow-lg"
                            >
                                {/* Live Indicator */}
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-2xl font-bold text-[#1E2046]">Buy Tokens</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-bold text-green-600">Live</span>
                                    </div>
                                </div>

                                {/* Current Price */}
                                <div className="mb-6 p-4 bg-[#FFFBF5] rounded-xl">
                                    <p className="text-xs font-bold text-[#1E2046]/50 uppercase mb-1">Current Price</p>
                                    <p className="text-3xl font-bold text-[#1E2046]">${tokenPrice.toFixed(2)}</p>
                                    <p className="text-sm text-[#1E2046]/50">per token</p>
                                </div>

                                {/* User Balance */}
                                <div className="mb-6 p-4 bg-[#B0CBFF]/10 rounded-xl border border-[#B0CBFF]/20">
                                    <p className="text-xs font-bold text-[#1E2046]/50 uppercase mb-1">Your Balance</p>
                                    <p className="text-xl font-bold text-[#1E2046]">${userBalance.toFixed(2)} USDC</p>
                                </div>

                                {/* Token Amount Input */}
                                <div className="mb-6">
                                    <label className="block text-sm font-bold text-[#1E2046] mb-2">
                                        Number of Tokens
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={tokenAmount}
                                        onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="w-full px-4 py-3 border-2 border-black/20 rounded-xl focus:outline-none focus:border-[#1E2046] text-lg font-semibold"
                                    />
                                </div>

                                {/* Cost Breakdown */}
                                <div className="mb-6 space-y-3 p-4 bg-[#FFFBF5] rounded-xl">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#1E2046]/60">Tokens ({tokenAmount})</span>
                                        <span className="font-semibold text-[#1E2046]">${totalCost.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#1E2046]/60">Gas Fee</span>
                                        <span className="font-semibold text-[#1E2046]">${gasFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[#1E2046]/60">Protocol Fee (0.5%)</span>
                                        <span className="font-semibold text-[#1E2046]">${protocolFee.toFixed(2)}</span>
                                    </div>
                                    <div className="pt-3 border-t border-black/10 flex justify-between">
                                        <span className="font-bold text-[#1E2046]">Total Cost</span>
                                        <span className="font-bold text-[#1E2046] text-xl">${grandTotal.toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Purchase Button */}
                                <button className="w-full bg-[#2D2E63] text-[#B0CBFF] py-4 rounded-xl font-bold text-lg hover:bg-[#1E2046] transition-colors shadow-lg">
                                    Connect and Purchase
                                </button>

                                {/* Funding Progress */}
                                <div className="mt-6">
                                    <div className="flex justify-between text-sm font-bold mb-2">
                                        <span className="text-[#1E2046]/60">Funding Progress</span>
                                        <span className="text-[#1E2046]">{property.funded}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-black/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#2D2E63] rounded-full transition-all duration-500"
                                            style={{ width: `${property.funded}%` }}
                                        />
                                    </div>
                                    <p className="text-xs text-[#1E2046]/50 mt-2">
                                        {property.soldTokens.toLocaleString()} / {property.totalTokens.toLocaleString()} tokens sold
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
