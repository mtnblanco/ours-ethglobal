'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Shield, Building2, Scale, ChevronDown, ChevronUp, ArrowLeft, Download } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import TabNavigation from '@/components/TabNavigation';
import Link from 'next/link';

interface LegalSection {
  id: string;
  title: string;
  icon: any;
  lastUpdated: string;
  content: string[];
}

const legalSections: LegalSection[] = [
  {
    id: 'spv',
    title: 'Special Purpose Vehicle (SPV) Structure',
    icon: Building2,
    lastUpdated: 'January 2025',
    content: [
      'A Special Purpose Vehicle (SPV) is a legal entity created specifically to hold and manage each tokenized property on the Ours platform. This structure provides critical legal separation and investor protection.',

      '**How SPVs Work:**\n\n' +
      '• Each property is held by its own separate SPV entity\n' +
      '• The SPV owns 100% of the property and all associated rights\n' +
      '• Token holders become indirect beneficial owners through the SPV\n' +
      '• The SPV is legally isolated from the Ours platform and other properties',

      '**Investor Protection Benefits:**\n\n' +
      '• **Asset Isolation:** Each property is legally separated, so issues with one property don\'t affect others\n' +
      '• **Bankruptcy Protection:** If Ours platform faces financial difficulties, property ownership remains with the SPV\n' +
      '• **Clear Ownership:** Token holders have proportional beneficial ownership rights in the SPV\n' +
      '• **Limited Liability:** Token holders\' liability is limited to their investment amount',

      '**SPV Governance:**\n\n' +
      '• Professional property managers handle day-to-day operations\n' +
      '• Major decisions require token holder voting (via governance mechanisms)\n' +
      '• Annual financial statements and audits are provided\n' +
      '• Transparent reporting on rental income, expenses, and distributions',

      '**Legal Jurisdiction:**\n\n' +
      'SPVs are typically incorporated in jurisdictions with favorable real estate tokenization laws, such as:\n' +
      '• Delaware, USA (for US properties)\n' +
      '• Singapore (for Asian properties)\n' +
      '• Switzerland (for European properties)',

      '**Tax Implications:**\n\n' +
      '• SPV structure allows for pass-through taxation in most jurisdictions\n' +
      '• Token holders report their proportional share of rental income\n' +
      '• Capital gains tax applies when selling tokens (varies by jurisdiction)\n' +
      '• Consult with a tax professional regarding your specific situation',
    ],
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    icon: FileText,
    lastUpdated: 'January 2025',
    content: [
      '**1. Acceptance of Terms**\n\n' +
      'By accessing and using the Ours platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.',

      '**2. Eligibility**\n\n' +
      '• You must be at least 18 years old\n' +
      '• You must complete World ID verification\n' +
      '• You must pass KYC (Know Your Customer) requirements\n' +
      '• You must comply with your local laws regarding digital asset investments',

      '**3. Investment Risks**\n\n' +
      'Real estate investments carry inherent risks:\n' +
      '• Property values may decrease\n' +
      '• Rental income is not guaranteed\n' +
      '• Properties may have periods of vacancy\n' +
      '• Market conditions may affect liquidity\n' +
      '• You may lose some or all of your investment',

      '**4. Token Ownership**\n\n' +
      '• Tokens represent beneficial ownership in the property SPV\n' +
      '• Tokens do not represent direct property ownership\n' +
      '• Token transfers may be restricted by regulations\n' +
      '• Voting rights are proportional to tokens held',

      '**5. Platform Fees**\n\n' +
      '• Protocol fee: 0.5% on token purchases\n' +
      '• Gas fees: Variable blockchain transaction costs\n' +
      '• Property management fees: Deducted from rental income (typically 8-12%)\n' +
      '• No account maintenance fees',

      '**6. User Responsibilities**\n\n' +
      '• Maintain security of your wallet and credentials\n' +
      '• Comply with all applicable laws and regulations\n' +
      '• Provide accurate information during KYC\n' +
      '• Report any suspicious activity\n' +
      '• Pay applicable taxes on your investments',
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: Shield,
    lastUpdated: 'January 2025',
    content: [
      '**Data We Collect:**\n\n' +
      '• World ID verification proof (zero-knowledge, privacy-preserving)\n' +
      '• KYC information: Name, email, country of residence\n' +
      '• Wallet addresses and transaction history\n' +
      '• Platform usage analytics',

      '**How We Use Your Data:**\n\n' +
      '• Verify your identity and comply with regulations\n' +
      '• Process transactions and distribute yields\n' +
      '• Send important account notifications\n' +
      '• Improve platform features and user experience\n' +
      '• Prevent fraud and enhance security',

      '**Data Protection:**\n\n' +
      '• All personal data is encrypted at rest and in transit\n' +
      '• We use industry-standard security practices\n' +
      '• Data is stored in secure, compliant facilities\n' +
      '• Access is restricted to authorized personnel only\n' +
      '• Regular security audits are performed',

      '**World ID Privacy:**\n\n' +
      'World ID uses zero-knowledge proofs, meaning:\n' +
      '• We verify you\'re a unique human without knowing your identity\n' +
      '• No biometric data is stored on our servers\n' +
      '• Your personal information remains private\n' +
      '• Verification is cryptographically secure',

      '**Your Rights:**\n\n' +
      '• Access your personal data\n' +
      '• Request data correction or deletion\n' +
      '• Opt-out of marketing communications\n' +
      '• Export your data\n' +
      '• Lodge complaints with data protection authorities',

      '**Data Retention:**\n\n' +
      '• KYC data: Retained for 7 years after account closure (regulatory requirement)\n' +
      '• Transaction data: Retained permanently on blockchain\n' +
      '• Analytics data: Retained for 2 years\n' +
      '• Marketing data: Deleted upon opt-out request',
    ],
  },
  {
    id: 'compliance',
    title: 'Regulatory Compliance',
    icon: Scale,
    lastUpdated: 'January 2025',
    content: [
      '**Securities Regulations:**\n\n' +
      '• Property tokens may be considered securities in certain jurisdictions\n' +
      '• We comply with applicable securities laws and regulations\n' +
      '• Offerings are structured to meet regulatory requirements\n' +
      '• Investors must meet eligibility criteria per local laws',

      '**Anti-Money Laundering (AML):**\n\n' +
      '• Robust KYC procedures for all users\n' +
      '• Transaction monitoring for suspicious activity\n' +
      '• Compliance with FATF (Financial Action Task Force) guidelines\n' +
      '• Regular AML audits and updates to procedures',

      '**Know Your Customer (KYC):**\n\n' +
      'All users must provide:\n' +
      '• Full legal name\n' +
      '• Email address\n' +
      '• Country of residence\n' +
      '• World ID verification\n' +
      '• Additional documentation may be required for large investments',

      '**Tax Compliance:**\n\n' +
      '• We report required information to tax authorities\n' +
      '• Tax forms provided for annual filing\n' +
      '• Users are responsible for their own tax obligations\n' +
      '• We recommend consulting with tax professionals',

      '**Jurisdictional Restrictions:**\n\n' +
      'Our services may not be available in all countries. We comply with:\n' +
      '• US securities laws (SEC regulations)\n' +
      '• EU financial regulations (MiFID II, GDPR)\n' +
      '• Local real estate and securities laws\n' +
      '• International sanctions and restrictions',
    ],
  },
];

export default function LegalPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('spv');

  const formatContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h4 key={idx} className="font-bold text-[#1E2046] mt-4 mb-2">
            {line.replace(/\*\*/g, '')}
          </h4>
        );
      }
      if (line.startsWith('•')) {
        return (
          <li key={idx} className="ml-6 text-[#1E2046]/70 mb-1">
            {line.substring(1).trim()}
          </li>
        );
      }
      if (line.trim() === '') {
        return <br key={idx} />;
      }
      return (
        <p key={idx} className="text-[#1E2046]/70 mb-2">
          {line}
        </p>
      );
    });
  };

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
                  <Scale className="w-8 h-8 text-[#B0CBFF]" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-[#1E2046]">Legal Documents</h1>
                  <p className="text-lg text-[#1E2046]/60">Terms, privacy, and compliance information</p>
                </div>
              </div>
            </motion.div>

            {/* Important Notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#B0CBFF]/20 border-2 border-[#2D2E63]/30 rounded-2xl p-6 mb-8"
            >
              <div className="flex items-start gap-3">
                <Shield className="w-6 h-6 text-[#2D2E63] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-[#1E2046] mb-2">Important Legal Notice</h3>
                  <p className="text-sm text-[#1E2046]/70">
                    These documents contain important legal information about your rights and obligations.
                    Please read them carefully before investing. If you have questions, consult with a legal professional.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Legal Sections */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              {legalSections.map((section) => {
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
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-12 h-12 bg-[#B0CBFF]/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-[#2D2E63]" />
                        </div>
                        <div className="flex-1">
                          <h2 className="font-bold text-xl text-[#1E2046] mb-1">{section.title}</h2>
                          <p className="text-xs text-[#1E2046]/50">Last updated: {section.lastUpdated}</p>
                        </div>
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
                        className="px-6 pb-6 border-t border-black/10"
                      >
                        <div className="pt-6 space-y-4">
                          {section.content.map((paragraph, idx) => (
                            <div key={idx} className="leading-relaxed">
                              {formatContent(paragraph)}
                            </div>
                          ))}
                        </div>

                        {/* Download Option */}
                        <div className="mt-6 pt-6 border-t border-black/10">
                          <button className="flex items-center gap-2 px-4 py-2 bg-[#2D2E63] text-[#B0CBFF] rounded-lg font-semibold hover:bg-[#1E2046] transition-all duration-300">
                            <Download className="w-4 h-4" />
                            <span>Download PDF</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </motion.div>

          </div>
        </main>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
