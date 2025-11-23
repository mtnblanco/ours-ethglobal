'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Globe,
  RefreshCcw,
  ShieldCheck,
  CheckCircle2,
  Smartphone
} from 'lucide-react';
import HeroSection from '@/components/HeroSection';
import RegulatedSection from '@/components/RegulatedSection';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useRouter } from 'next/navigation';

// --- Variantes de Animación ---
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

const Logo = ({ dark = false }: { dark?: boolean }) => (
  <div className="flex items-center gap-1">
    <img
      src="/logo con todo.svg"
      alt="Ours Logo"
      className="w-auto h-10"
    />
  </div>
);

export default function LandingPage() {
  
  return (
    <main className="min-h-screen bg-[#FDFBF7] font-sans text-[#1E2046] overflow-x-hidden">

      {/* --- NAVBAR --- */}
      <Navbar />

      {/* --- HERO SECTION --- */}
      <HeroSection />

      <RegulatedSection />

      {/* --- REGULATED STANDARDS SECTION --- */}
      <section id="core" className="bg-[#B0C9FF] pt-2 pb-0 relative overflow-hidden">
        <div className="container mx-auto">

          <div className="grid px-6 lg:grid-cols-2 gap-12 mb-20">
            {/* Text Content */}
            <motion.div
              id="standards"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-bold text-[#1E2046] mb-6 leading-tight">
                Regulated <br />
                Tokenization <br />
                Standards
              </motion.h2>

              <motion.p variants={fadeIn} className="text-[#1E2046]/80 text-lg max-w-md">
                We use institutional-grade frameworks widely adopted by European RWA providers.
              </motion.p>
            </motion.div>

            {/* Empty column for layout balance if needed, or illustration space */}
            <div className="hidden lg:block"></div>
          </div>

          {/* The Large Dark Card Area with SVG Background */}
          <div className="relative w-full">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              className="relative z-100 w-full"
            >
              {/* SVG Background - larger and aligned to left */}
              <img
                style={{ transform: 'scaleY(1.2) scaleX(1.5)' }}
                src="/recurso2.svg"
                alt="Token Standard Background"
                className="w-full h-auto object-contain"
              />

              {/* Content Overlay - positioned 20% from right within the SVG */}
              <div className="absolute inset-0 flex items-center justify-end pr-[20%] px-8">
                <div className="text-white max-w-lg w-full">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="text-[#B0C9FF]" size={32} />
                      <h3 className="text-2xl font-bold">ERC - 3643 (T-REX)</h3>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      The modern evolution offering continuous automated compliance and identify ... control
                    </p>

                    <div className="space-y-3 mt-2">
                      {[
                        'On-chain KYC',
                        'Whitelist management',
                        'Transfer restrictions',
                        'Real-time regulatory reporting'
                      ].map((feature, i) => (
                        <motion.div
                          key={i}
                          initial={{ x: -20, opacity: 0 }}
                          whileInView={{ x: 0, opacity: 1 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-center gap-3"
                        >
                          <div className="text-[#B0C9FF] opacity-80 flex-shrink-0">
                            <CheckCircle2 size={20} />
                          </div>
                          <p className="text-gray-300 text-sm">{feature}</p>
                        </motion.div>
                      ))}
                    </div>

                    {/* Primary Standard Badge */}
                    <div className="flex justify-end">
                      <div className="bg-[#B0C9FF] text-[#1E2046] px-4 py-2 rounded-lg text-sm font-bold mr-[-20%]">
                        Primary Standard
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Background filler to extend the dark color downwards if needed, or just margin */}
            <div className="h-16 w-full"></div>
          </div>

        </div>
      </section>

      {/* --- FOOTER --- */}
      <Footer />

    </main>
  );
}