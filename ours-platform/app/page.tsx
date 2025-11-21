'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Shield, PieChart, Building } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Reusable Animation Variants
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-brand-dark text-brand-light font-sans selection:bg-brand-primary selection:text-brand-dark overflow-x-hidden">
      
      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-50 bg-brand-dark/80 backdrop-blur-md border-b border-brand-primary/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Ours Logo" className="h-8 w-auto" />
            <img src="/logo tipografico celeste.svg" alt="Ours" className="h-6 w-auto" />
          </Link>
          <div className="hidden md:flex gap-8 text-sm font-medium text-brand-light/80">
            <Link href="#marketplace" className="hover:text-brand-primary transition-colors">Marketplace</Link>
            <Link href="#how-it-works" className="hover:text-brand-primary transition-colors">How it Works</Link>
            <Link href="#security" className="hover:text-brand-primary transition-colors">Security</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="text-sm font-medium text-brand-light hover:text-brand-primary py-2 px-4 transition-colors">Log in</Link>
            <Link href="/register" className="text-sm font-bold bg-brand-primary text-brand-dark py-2 px-5 rounded-full hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.08),transparent_70%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-brand-dark to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
          >
            <div className="inline-block px-3 py-1 rounded-full border border-brand-primary/20 bg-brand-primary/5 text-brand-primary text-xs font-bold tracking-widest uppercase mb-6">
              Web3 Asset Management
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight text-brand-light">
              Liquidity for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-light">
                Tangible Assets
              </span>
            </h1>
            <p className="text-lg text-brand-light/70 mb-8 max-w-lg leading-relaxed">
              Invest in high-yield real estate fractions. Powered by blockchain for transparency, security, and instant liquidity.
            </p>
            <div className="flex gap-4">
              <Link href="/register" className="group flex items-center gap-2 bg-brand-light text-brand-dark px-8 py-4 rounded-lg font-bold hover:bg-brand-primary hover:text-brand-dark transition-colors">
                Start Investing
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#marketplace" className="flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-brand-light border border-brand-primary/30 hover:bg-brand-primary/10 transition-colors">
                Explore Assets
              </Link>
            </div>
          </motion.div>

          {/* Hero Visual (Tokenization Metaphor) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[500px] w-full flex items-center justify-center"
          >
            {/* Abstract Building Card */}
            <div className="relative w-80 h-[420px] bg-brand-navy border border-brand-primary/30 rounded-2xl overflow-hidden shadow-2xl shadow-brand-primary/10 z-20">
              <div className="h-1/2 bg-brand-dark/60 relative group">
                <div className="absolute inset-0 bg-brand-primary/10 group-hover:bg-brand-primary/20 transition-colors" />
                {/* Placeholder for Building Image */}
                <div className="w-full h-full flex items-center justify-center text-brand-primary/50">
                    <Building className="w-12 h-12 opacity-50" />
                </div>
              </div>
              <div className="p-6">
                <div className="h-2 w-20 bg-brand-primary/50 rounded mb-4" />
                <div className="h-4 w-3/4 bg-brand-primary/20 rounded mb-2" />
                <div className="h-4 w-1/2 bg-brand-primary/20 rounded mb-6" />
                <div className="flex justify-between items-center border-t border-brand-primary/20 pt-4">
                  <span className="text-xs text-brand-light/70">APY</span>
                  <span className="text-brand-primary font-mono font-bold">12.4%</span>
                </div>
              </div>
            </div>
            
            {/* Floating Tokens */}
            <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-10 right-10 bg-brand-surface p-4 rounded-xl border border-brand-primary/30 shadow-xl z-30"
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary font-bold">$</div>
                    <div>
                        <div className="text-xs text-brand-light/70">Dividends Paid</div>
                        <div className="text-sm font-bold text-brand-light">+$1,240.50</div>
                    </div>
                </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- How it Works --- */}
      <section id="how-it-works" className="py-24 bg-brand-navy relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-brand-light">Institutional Grade Tokenization</h2>
            <p className="text-brand-light/70 max-w-2xl mx-auto">Our proprietary legal and technical framework allows you to own premium real estate without the traditional barriers.</p>
          </motion.div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {[
              { title: 'Asset Selection', icon: <Building className="w-6 h-6" />, desc: 'We source high-yield commercial and residential properties, vetting them with strict financial criteria.' },
              { title: 'Legal Wrapper', icon: <Shield className="w-6 h-6" />, desc: 'Properties are placed in an SPV (Special Purpose Vehicle). Tokens represent legal shares of the SPV.' },
              { title: 'Distribution', icon: <PieChart className="w-6 h-6" />, desc: 'Investors purchase tokens and receive rental yields directly to their wallets via smart contracts.' },
            ].map((item, idx) => (
              <motion.div key={idx} variants={fadeIn} className="bg-brand-dark/50 border border-brand-primary/20 p-8 rounded-2xl hover:border-brand-primary/50 transition-colors">
                <div className="w-12 h-12 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary mb-6">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-brand-light">{item.title}</h3>
                <p className="text-brand-light/70 text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-brand-dark border-t border-brand-primary/20 py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img src="/logo.svg" alt="Ours Logo" className="h-7 w-auto" />
              <img src="/logo tipografico celeste.svg" alt="Ours" className="h-5 w-auto" />
            </Link>
            <p className="text-brand-light/60 text-sm">
              The future of real estate investing is here. Secure, transparent, and liquid.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-brand-light">Platform</h4>
            <ul className="space-y-2 text-sm text-brand-light/70">
              <li><Link href="#" className="hover:text-brand-primary">Marketplace</Link></li>
              <li><Link href="#" className="hover:text-brand-primary">Tokenomics</Link></li>
              <li><Link href="#" className="hover:text-brand-primary">Technology</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-brand-light">Legal</h4>
            <ul className="space-y-2 text-sm text-brand-light/70">
              <li><Link href="#" className="hover:text-brand-primary">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-brand-primary">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-brand-primary">Risk Disclosure</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-brand-light">Newsletter</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-brand-surface border border-brand-primary/30 rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-brand-primary text-brand-light placeholder:text-brand-light/50" />
              <button className="bg-brand-primary text-brand-dark px-3 py-2 rounded text-sm font-bold hover:bg-brand-accent">Go</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-brand-primary/20 text-center text-brand-light/50 text-xs">
          © 2025 Ours Real Estate Platform. All rights reserved.
        </div>
      </footer>
    </main>
  );
}