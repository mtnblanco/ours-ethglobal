'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Book, ChevronDown, ChevronUp, ArrowLeft, Wallet, ShoppingCart, TrendingUp, Shield, FileText, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import TabNavigation from '@/components/TabNavigation';
import Link from 'next/link';

interface DocSection {
  id: string;
  title: string;
  icon: any;
  content: {
    subtitle: string;
    description: string;
    steps?: string[];
  }[];
}

const documentationSections: DocSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Book,
    content: [
      {
        subtitle: 'Welcome to Ours',
        description: 'Ours is a revolutionary platform that enables fractional ownership of real estate through blockchain tokenization. Invest in premium properties with as little as $25.',
      },
      {
        subtitle: 'How it Works',
        description: 'Properties are tokenized into digital shares (tokens) on the blockchain. Each token represents a fractional ownership of the property and entitles you to proportional rental income and appreciation.',
        steps: [
          'Property owners tokenize their real estate assets',
          'Investors purchase tokens using USDC stablecoin',
          'Rental income is automatically distributed monthly',
          'Tokens can be traded on secondary markets',
        ],
      },
    ],
  },
  {
    id: 'account-setup',
    title: 'Account Setup & KYC',
    icon: Users,
    content: [
      {
        subtitle: 'World ID Verification',
        description: 'Ours uses Worldcoin\'s World ID for secure, privacy-preserving authentication. This ensures you\'re a unique human while protecting your personal data.',
        steps: [
          'Click "Login" and verify with World ID',
          'Complete the KYC (Know Your Customer) process',
          'Provide basic information: name, email, country',
          'Your account is ready to invest',
        ],
      },
      {
        subtitle: 'Why KYC?',
        description: 'KYC is required to comply with global financial regulations and prevent fraud. Your information is encrypted and securely stored.',
      },
    ],
  },
  {
    id: 'investing',
    title: 'Making Your First Investment',
    icon: ShoppingCart,
    content: [
      {
        subtitle: 'Browse the Marketplace',
        description: 'Explore available properties in the Marketplace. Each property listing shows key metrics including APY, token price, and funding progress.',
      },
      {
        subtitle: 'Purchase Tokens',
        description: 'Select a property and choose how many tokens you want to buy. Review the transaction details including fees.',
        steps: [
          'Enter the number of tokens to purchase',
          'Review total cost, gas fees, and protocol fees',
          'Confirm you have sufficient USDC balance',
          'Complete the transaction',
          'Tokens are transferred to your wallet instantly',
        ],
      },
      {
        subtitle: 'Minimum Investment',
        description: 'Each property has a minimum investment of 1 token. Token prices vary by property, typically ranging from $25 to $200.',
      },
    ],
  },
  {
    id: 'managing-portfolio',
    title: 'Managing Your Portfolio',
    icon: Wallet,
    content: [
      {
        subtitle: 'Holdings Dashboard',
        description: 'Track all your investments in one place. The Holdings page shows your total portfolio value, profit/loss, and individual property performance.',
      },
      {
        subtitle: 'Understanding Metrics',
        description: 'Key metrics to monitor your investments:',
        steps: [
          'APY (Annual Percentage Yield): Expected yearly return',
          'Monthly Yield: Income distributed each month',
          'Token Price: Current market value of each token',
          'Profit/Loss: Unrealized gains or losses',
        ],
      },
    ],
  },
  {
    id: 'yields-distribution',
    title: 'Rental Yields & Distribution',
    icon: TrendingUp,
    content: [
      {
        subtitle: 'How Yields Work',
        description: 'Properties generate rental income from tenants. This income is collected by the property manager and distributed to token holders.',
      },
      {
        subtitle: 'Automatic Distribution',
        description: 'Yields are distributed automatically via smart contracts on a monthly basis. No action required from your side.',
        steps: [
          'Rent is collected from tenants',
          'Property expenses are deducted',
          'Net income is converted to USDC',
          'Smart contract distributes to all token holders',
          'Receive USDC directly in your wallet',
        ],
      },
      {
        subtitle: 'Yield Calculation',
        description: 'Your monthly yield = (Tokens you own / Total tokens) × Net monthly income',
      },
    ],
  },
  {
    id: 'security',
    title: 'Security & Protection',
    icon: Shield,
    content: [
      {
        subtitle: 'Blockchain Security',
        description: 'All transactions are secured by blockchain technology. Property ownership is verifiable on-chain, and smart contracts ensure transparent, automatic distributions.',
      },
      {
        subtitle: 'Legal Protection',
        description: 'Properties are held in Special Purpose Vehicles (SPVs) that provide legal separation and investor protection. See Legal Documents for details.',
      },
      {
        subtitle: 'Best Practices',
        description: 'Protect your investment:',
        steps: [
          'Never share your World ID credentials',
          'Keep your wallet seed phrase secure',
          'Verify contract addresses before transactions',
          'Diversify across multiple properties',
          'Review property documents before investing',
        ],
      },
    ],
  },
  {
    id: 'fees',
    title: 'Fees & Costs',
    icon: FileText,
    content: [
      {
        subtitle: 'Transaction Fees',
        description: 'When purchasing tokens, you pay:',
        steps: [
          'Token Price: Cost of the tokens',
          'Gas Fee: Blockchain transaction cost (~$0.50)',
          'Protocol Fee: 0.5% of transaction value',
        ],
      },
      {
        subtitle: 'No Hidden Fees',
        description: 'All fees are shown upfront before you confirm any transaction. There are no monthly account fees or yield distribution fees.',
      },
    ],
  },
];

export default function DocumentationPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('getting-started');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFBF5] pb-24 md:pb-16 overflow-x-hidden">
        <Navbar />
        <TabNavigation />

        <main className="pt-32 pb-16 px-4 md:px-6">
          <div className="container mx-auto max-w-5xl">

            {/* Back Button */}
            <Link
              href="/support"
              className="inline-flex items-center gap-2 text-[#1E2046]/70 hover:text-[#1E2046] mb-8 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Back to Support</span>
            </Link>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-[#2D2E63] rounded-2xl flex items-center justify-center">
                  <Book className="w-8 h-8 text-[#B0CBFF]" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-[#1E2046]">Documentation</h1>
                  <p className="text-lg text-[#1E2046]/60">Everything you need to know about Ours</p>
                </div>
              </div>
            </motion.div>

            {/* Documentation Sections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4"
            >
              {documentationSections.map((section, index) => {
                const Icon = section.icon;
                const isExpanded = expandedSection === section.id;

                return (
                  <div
                    key={section.id}
                    className="bg-white rounded-2xl border-2 border-black overflow-hidden shadow-lg"
                  >
                    <button
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-[#FFFBF5] transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#B0CBFF]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-[#2D2E63]" />
                        </div>
                        <span className="font-bold text-xl text-[#1E2046]">{section.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-6 h-6 text-[#2D2E63] flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-6 h-6 text-[#2D2E63] flex-shrink-0" />
                      )}
                    </button>

                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-6 pb-6 space-y-6"
                      >
                        {section.content.map((item, idx) => (
                          <div key={idx} className="space-y-3">
                            <h3 className="text-lg font-bold text-[#1E2046]">{item.subtitle}</h3>
                            <p className="text-[#1E2046]/70 leading-relaxed">{item.description}</p>
                            {item.steps && (
                              <ul className="space-y-2 ml-4">
                                {item.steps.map((step, stepIdx) => (
                                  <li key={stepIdx} className="flex items-start gap-3">
                                    <span className="w-6 h-6 bg-[#2D2E63] text-[#B0CBFF] rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                      {stepIdx + 1}
                                    </span>
                                    <span className="text-[#1E2046]/70 flex-1">{step}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {idx < section.content.length - 1 && (
                              <div className="border-t border-black/10 pt-4" />
                            )}
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </motion.div>

            {/* Help Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 bg-gradient-to-br from-[#2D2E63] to-[#1E2046] rounded-2xl border-2 border-black p-8 text-center"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Still Have Questions?</h3>
              <p className="text-[#B0CBFF] mb-6">Our support team is here to help</p>
              <Link
                href="/support"
                className="inline-block px-6 py-3 bg-white text-[#2D2E63] rounded-lg font-semibold hover:bg-[#B0CBFF] transition-all duration-300"
              >
                Contact Support
              </Link>
            </motion.div>

          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
