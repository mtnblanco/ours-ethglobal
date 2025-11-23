'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Mail, Send, HelpCircle, Book, FileText, ChevronDown, ChevronUp, Globe, Shield } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProtectedRoute from '@/components/ProtectedRoute';
import TabNavigation from '@/components/TabNavigation';
import CommunityModal from '@/components/CommunityModal';
import Link from 'next/link';

const faqs = [
  {
    question: 'How do I purchase property tokens?',
    answer: 'To purchase property tokens, navigate to the Marketplace, select a property, choose the number of tokens you want to buy, and complete the transaction using USDC. The tokens will be transferred to your wallet immediately after confirmation.',
  },
  {
    question: 'What is the minimum investment?',
    answer: 'The minimum investment varies by property. Most properties have a minimum of 1 token, with token prices typically ranging from $25 to $200 depending on the property value and tokenization structure.',
  },
  {
    question: 'How are rental yields distributed?',
    answer: 'Rental yields are automatically distributed to token holders monthly via smart contracts. The distribution is proportional to the number of tokens you hold. Yields are sent directly to your wallet in USDC.',
  },
  {
    question: 'Can I sell my tokens?',
    answer: 'Yes, you can sell your tokens on the secondary market once it becomes available. Token liquidity depends on market demand and the specific property. Some properties may have lock-up periods specified in their documentation.',
  },
  {
    question: 'How is my investment secured?',
    answer: 'All investments are secured through blockchain technology and smart contracts. Properties are legally tokenized with proper documentation, and all transactions are transparent and verifiable on-chain. Your World ID verification ensures secure access to your account.',
  },
  {
    question: 'What happens if a property is sold?',
    answer: 'If a property is sold, the proceeds are distributed to token holders proportionally. You\'ll receive your share based on the number of tokens you own, minus any applicable fees. This process is handled automatically through smart contracts.',
  },
];

export default function SupportPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isCommunityModalOpen, setIsCommunityModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí se implementaría la lógica para enviar el mensaje
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setContactForm({ subject: '', message: '' });
    }, 3000);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#FFFBF5] pb-24 md:pb-16 overflow-x-hidden">
        <Navbar />
        <TabNavigation />

        <main className="pt-32 pb-16 px-4 md:px-6">
          <div className="container mx-auto max-w-6xl">

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-[#1E2046] mb-2">Support Center</h1>
              <p className="text-lg text-[#1E2046]/60">We're here to help you with any questions</p>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
            >
              <Link href="/documentation" className="bg-white rounded-2xl border-2 border-black p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-[#B0CBFF]/20 rounded-xl flex items-center justify-center mb-4">
                  <Book className="w-6 h-6 text-[#2D2E63]" />
                </div>
                <h3 className="text-lg font-bold text-[#1E2046] mb-2">Documentation</h3>
                <p className="text-sm text-[#1E2046]/60">Learn how to use the platform</p>
              </Link>

              <Link href="/legal" className="bg-white rounded-2xl border-2 border-black p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                <div className="w-12 h-12 bg-[#B0CBFF]/20 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-[#2D2E63]" />
                </div>
                <h3 className="text-lg font-bold text-[#1E2046] mb-2">Legal Documents</h3>
                <p className="text-sm text-[#1E2046]/60">Terms, privacy, and compliance</p>
              </Link>

              <button
                onClick={() => setIsCommunityModalOpen(true)}
                className="bg-white rounded-2xl border-2 border-black p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer text-left"
              >
                <div className="w-12 h-12 bg-[#B0CBFF]/20 rounded-xl flex items-center justify-center mb-4">
                  <Globe className="w-6 h-6 text-[#2D2E63]" />
                </div>
                <h3 className="text-lg font-bold text-[#1E2046] mb-2">Community</h3>
                <p className="text-sm text-[#1E2046]/60">Join our X and Telegram</p>
              </button>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

              {/* FAQ Section */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <HelpCircle className="w-7 h-7 text-[#2D2E63]" />
                  <h2 className="text-2xl font-bold text-[#1E2046]">Frequently Asked Questions</h2>
                </div>

                <div className="space-y-4">
                  {faqs.map((faq, index) => (
                    <div
                      key={index}
                      className="bg-white rounded-2xl border-2 border-black overflow-hidden shadow-lg"
                    >
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#FFFBF5] transition-colors"
                      >
                        <span className="font-bold text-[#1E2046] pr-4">{faq.question}</span>
                        {expandedFaq === index ? (
                          <ChevronUp className="w-5 h-5 text-[#2D2E63] flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#2D2E63] flex-shrink-0" />
                        )}
                      </button>
                      {expandedFaq === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-6 pb-4 text-[#1E2046]/70"
                        >
                          {faq.answer}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Contact Form */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <MessageCircle className="w-7 h-7 text-[#2D2E63]" />
                  <h2 className="text-2xl font-bold text-[#1E2046]">Contact Support</h2>
                </div>

                <div className="bg-white rounded-2xl border-2 border-black p-6 shadow-lg mb-6">
                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12"
                    >
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Send className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-[#1E2046] mb-2">Message Sent!</h3>
                      <p className="text-[#1E2046]/60">We'll get back to you within 24 hours</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="block text-sm font-bold text-[#1E2046] mb-2">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          placeholder="What can we help you with?"
                          required
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#2D2E63] text-[#1E2046]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-[#1E2046] mb-2">
                          Message
                        </label>
                        <textarea
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="Describe your issue or question in detail..."
                          required
                          rows={6}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#2D2E63] text-[#1E2046] resize-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#2D2E63] text-[#B0CBFF] rounded-lg font-semibold hover:bg-[#1E2046] transition-all duration-300"
                      >
                        <Send className="w-5 h-5" />
                        <span>Send Message</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* Direct Contact */}
                <div className="bg-gradient-to-br from-[#2D2E63] to-[#1E2046] rounded-2xl border-2 border-black p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-white mb-4">Direct Contact</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Mail className="w-5 h-5 text-[#B0CBFF]" />
                      </div>
                      <div>
                        <p className="text-[#B0CBFF]/70 text-sm">Email Support</p>
                        <p className="text-white font-semibold">support@ours.io</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                        <Shield className="w-5 h-5 text-[#B0CBFF]" />
                      </div>
                      <div>
                        <p className="text-[#B0CBFF]/70 text-sm">Response Time</p>
                        <p className="text-white font-semibold">Within 24 hours</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>

          </div>
        </main>

        <Footer />

        {/* Community Modal */}
        <CommunityModal
          isOpen={isCommunityModalOpen}
          onClose={() => setIsCommunityModalOpen(false)}
        />
      </div>
    </ProtectedRoute>
  );
}
