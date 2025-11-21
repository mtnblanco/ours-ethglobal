'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Download, ExternalLink, Info, Wallet, ChevronRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function PropertyDetailsPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [tokenAmount, setTokenAmount] = useState(10);
  const tokenPrice = 50;

  return (
    <div className="min-h-screen bg-brand-dark text-brand-light">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-brand-dark/80 backdrop-blur-md border-b border-brand-primary/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Ours Logo" className="h-8 w-auto" />
            <img src="/logo tipografico celeste.svg" alt="Ours" className="h-6 w-auto" />
          </Link>
          <Link href="/marketplace" className="text-sm font-medium text-brand-light hover:text-brand-primary transition-colors">
            Back to Marketplace
          </Link>
        </div>
      </nav>

      <div className="pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-brand-light/60 mb-6 uppercase tracking-widest">
            <Link href="/marketplace" className="hover:text-brand-primary transition-colors">Marketplace</Link>
            <ChevronRight className="w-3 h-3" />
            <span>Commercial</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-brand-primary">Skyline Commercial Tower</span>
          </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN - Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Hero Image Placeholder */}
            <div className="w-full h-96 bg-brand-dark/60 rounded-2xl border border-brand-primary/30 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 to-transparent" />
                <div className="absolute bottom-8 left-8">
                    <h1 className="text-3xl font-bold mb-2 text-brand-light">Skyline Commercial Tower</h1>
                    <p className="text-brand-light/80 flex items-center gap-2">
                        <span className="w-2 h-2 bg-brand-primary rounded-full animate-pulse"/>
                        Open for Investment
                    </p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-brand-primary/20">
                {['Overview', 'Financials', 'Documents', 'Location'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === tab.toLowerCase()
                            ? 'border-brand-primary text-brand-light'
                            : 'border-transparent text-brand-light/60 hover:text-brand-light'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            {/* Tab Content Area */}
            <div className="min-h-[300px]">
                {activeTab === 'overview' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-brand-light/70 leading-relaxed">
                        <p>
                            Skyline Commercial Tower is a Class-A office building located in the heart of the Financial District.
                            Recently renovated in 2023, the building boasts 95% occupancy with long-term leases from Fortune 500 companies.
                        </p>
                        <p>
                            Token holders receive quarterly dividend distributions generated from rental income, net of property management fees.
                            This asset represents a stable, yield-generating addition to a diversified Web3 portfolio.
                        </p>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="bg-brand-surface p-4 rounded-lg border border-brand-primary/20">
                                <div className="text-xs text-brand-light/60 uppercase">Asset Value</div>
                                <div className="text-lg font-bold text-brand-light">$125,000,000</div>
                            </div>
                            <div className="bg-brand-surface p-4 rounded-lg border border-brand-primary/20">
                                <div className="text-xs text-brand-light/60 uppercase">Total Tokens</div>
                                <div className="text-lg font-bold text-brand-light">2,500,000 O-SCT</div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'financials' && (
                     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <table className="w-full text-left text-sm text-brand-light/70">
                            <thead className="text-xs uppercase text-brand-light/60 bg-brand-primary/5">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Metric</th>
                                    <th className="px-4 py-3 rounded-r-lg text-right">Value</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-primary/20">
                                <tr><td className="px-4 py-3">Gross Rent</td><td className="px-4 py-3 text-right text-brand-light">$8,500,000</td></tr>
                                <tr><td className="px-4 py-3">Operating Expenses</td><td className="px-4 py-3 text-right text-brand-light">($1,200,000)</td></tr>
                                <tr><td className="px-4 py-3">Net Operating Income (NOI)</td><td className="px-4 py-3 text-right text-brand-primary font-bold">$7,300,000</td></tr>
                                <tr><td className="px-4 py-3">Projected Yield</td><td className="px-4 py-3 text-right text-brand-light">12.4%</td></tr>
                            </tbody>
                        </table>
                     </motion.div>
                )}

                {activeTab === 'documents' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4">
                        {['Prospectus 2024', 'Property Inspection Report', 'SPV Legal Structure', 'Smart Contract Audit'].map((doc) => (
                            <div key={doc} className="flex items-center justify-between p-4 bg-brand-surface border border-brand-primary/20 rounded-lg hover:border-brand-primary/50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-brand-primary/10 text-brand-primary rounded">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <span className="font-medium text-brand-light group-hover:text-brand-primary transition-colors">{doc}</span>
                                </div>
                                <Download className="w-4 h-4 text-brand-light/60 group-hover:text-brand-light" />
                            </div>
                        ))}
                    </motion.div>
                )}
            </div>
          </div>

          {/* RIGHT COLUMN - Buy Widget (Sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-brand-navy/50 backdrop-blur-xl border border-brand-primary/30 rounded-2xl p-6 shadow-2xl shadow-black/50"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-brand-light">Buy Tokens</h3>
                        <span className="flex items-center gap-1 text-xs bg-brand-primary/10 text-brand-primary px-2 py-1 rounded border border-brand-primary/20">
                            <span className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse"></span> Live
                        </span>
                    </div>

                    {/* Pricing Info */}
                    <div className="flex justify-between items-end mb-6 pb-6 border-b border-brand-primary/20">
                        <div>
                            <div className="text-sm text-brand-light/70 mb-1">Current Price</div>
                            <div className="text-3xl font-bold text-brand-light">$50.00 <span className="text-sm font-normal text-brand-light/60">/ token</span></div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm text-brand-light/70 mb-1">Min. Buy</div>
                            <div className="text-brand-light font-medium">1 Token</div>
                        </div>
                    </div>

                    {/* Calculator Inputs */}
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="flex justify-between text-xs uppercase text-brand-light/60 font-bold mb-2">
                                <span>Amount (Tokens)</span>
                                <span>Available: 4,200</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={tokenAmount}
                                    onChange={(e) => setTokenAmount(Number(e.target.value))}
                                    className="w-full bg-brand-dark border border-brand-primary/30 rounded-lg px-4 py-3 text-brand-light font-mono focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-primary">O-SCT</span>
                            </div>
                        </div>

                        <div className="flex justify-center">
                             {/* Arrow Separator */}
                             <div className="bg-brand-surface p-1 rounded-full border border-brand-primary/30">
                                <ArrowUpRight className="w-4 h-4 text-brand-light/60" />
                             </div>
                        </div>

                        <div>
                            <label className="flex justify-between text-xs uppercase text-brand-light/60 font-bold mb-2">
                                <span>Total Cost (USDC)</span>
                                <span>Balance: $2,450.00</span>
                            </label>
                            <div className="w-full bg-brand-surface border border-brand-primary/20 rounded-lg px-4 py-3 text-brand-light font-mono flex justify-between items-center opacity-80">
                                <span>${(tokenAmount * tokenPrice).toLocaleString()}</span>
                                <span className="text-xs text-brand-light/60">USDC</span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Lines */}
                    <div className="space-y-2 text-xs text-brand-light/70 mb-6">
                        <div className="flex justify-between">
                            <span>Gas Fee (Est.)</span>
                            <span>~$4.20</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Protocol Fee (0.5%)</span>
                            <span>${(tokenAmount * tokenPrice * 0.005).toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full bg-brand-primary hover:bg-brand-accent text-brand-dark font-bold py-4 rounded-xl shadow-lg shadow-brand-primary/20 hover:shadow-brand-primary/40 transition-all duration-300 flex justify-center items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        Connect & Purchase
                    </button>

                    <div className="mt-4 text-center">
                        <a href="#" className="text-xs text-brand-light/60 hover:text-brand-light flex justify-center items-center gap-1 transition-colors">
                            View Smart Contract <ExternalLink className="w-3 h-3" />
                        </a>
                    </div>
                </motion.div>

                {/* Security Badge */}
                <div className="mt-6 p-4 border border-brand-primary/20 bg-brand-primary/5 rounded-xl flex gap-3 items-start">
                    <ShieldCheck className="w-5 h-5 text-brand-primary shrink-0" />
                    <p className="text-xs text-brand-light/70 leading-relaxed">
                        This offering is regulated by the SEC. Ownership is recorded on the Ethereum blockchain.
                    </p>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}