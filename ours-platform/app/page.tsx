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
import { useRouter } from 'next/navigation';

// --- Variantes de Animación ---
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
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
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  return (
    <main className="min-h-screen bg-[#FDFBF7] font-sans text-[#1E2046] overflow-x-hidden">

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-[150] bg-[#FDFBF7]/95 backdrop-blur-md py-4 md:py-6 border-b border-[#1E2046]/5">
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between">
          {/* Logo - más grande y responsive */}
          <div className="flex items-center flex-shrink-0">
            <div className="w-32 sm:w-40 md:w-48 lg:w-56">
              <Logo />
            </div>
          </div>

          {/* Navigation Links - ocultos en mobile y tablet pequeño */}
          <div className="hidden lg:flex items-center gap-8 xl:gap-12 font-semibold text-sm xl:text-base">
            {['Core', 'Standards', 'Legal', 'Process'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-[#1E2046]/70 hover:text-[#1E2046] transition-colors relative group whitespace-nowrap"
              >
                {item}
                {/* Underline effect on hover */}
                <span className="absolute bottom-[-4px] left-0 w-0 h-0.5 bg-[#B0C9FF] group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </div>

          {/* Mobile Menu Button - visible en mobile y tablet */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden flex flex-col gap-1.5 w-6 h-5 justify-center flex-shrink-0"
            aria-label="Menu"
          >
            <span className={`w-full h-0.5 bg-[#1E2046] rounded-full transition-all ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`w-full h-0.5 bg-[#1E2046] rounded-full transition-all ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`w-full h-0.5 bg-[#1E2046] rounded-full transition-all ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden bg-[#FDFBF7] border-t border-[#1E2046]/5 py-4"
          >
            <div className="container mx-auto px-4 sm:px-6 flex flex-col gap-4">
              {['Core', 'Standards', 'Legal', 'Process'].map((item) => (
                <a
                  key={item}
                  href={`#${item.toLowerCase()}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[#1E2046]/70 hover:text-[#1E2046] transition-colors font-semibold py-2"
                >
                  {item}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <HeroSection />

      <RegulatedSection />

      {/* --- REGULATED STANDARDS SECTION --- */}
      <section className="bg-[#B0C9FF] pt-2 pb-0 relative overflow-hidden">
        <div className="container mx-auto">

          <div className="grid px-6 lg:grid-cols-2 gap-12 mb-20">
            {/* Text Content */}
            <motion.div
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
      <footer className="bg-[#FDFBF7] pt-2 pb-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">

            {/* Left: Brand + Desc */}
            <div className="max-w-sm">
              <div className="mb-6">
                <Logo />
              </div>
              <p className="text-sm font-medium leading-relaxed text-[#1E2046]">
                Bridging real estate and blockchain in a secure, institutional-grade environment.
              </p>
            </div>

            {/* Right: Socials */}
            <div className="flex gap-6">
              {[
                { icon: "/resources/icons/linkedin.svg", label: "ours", alt: "LinkedIn" },
                { icon: "/resources/icons/instagram.svg", label: "ours", alt: "Instagram" },
                { icon: "/resources/icons/x.svg", label: "ours", alt: "X (Twitter)" }
              ].map((social, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="flex items-center gap-2 text-[#1E2046] hover:text-[#4A569D] transition-colors"
                >
                  <div className="bg-[#1E2046] text-white p-1.5 rounded-md flex items-center justify-center w-8 h-8">
                    <img src={social.icon} alt={social.alt} className="w-4 h-4" />
                  </div>
                  <span className="font-semibold text-sm">{social.label}</span>
                </a>
              ))}
            </div>

          </div>

          {/* Copyright / Bottom Line */}
          <div className="mt-12 pt-8 border-t border-[#1E2046]/10 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Ours Tokenization. All rights reserved.
          </div>
        </div>
      </footer>

    </main>
  );
}