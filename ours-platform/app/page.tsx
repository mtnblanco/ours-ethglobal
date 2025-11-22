'use client';

import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Shield, 
  PieChart, 
  Building, 
  Lock, 
  FileText, 
  CheckCircle, 
  RefreshCw, 
  Globe, 
  Server 
} from 'lucide-react';
import Link from 'next/link';

// --- Animation Variants ---
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-brand-dark text-brand-light font-sans selection:bg-brand-primary selection:text-brand-dark overflow-x-hidden">
      
      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-50 bg-brand-dark/90 backdrop-blur-md border-b border-brand-primary/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src="/logo.svg" alt="Ours Logo" className="h-8 w-auto" />
            <span className="font-bold text-xl tracking-tight">ours</span>
          </Link>
          <div className="hidden md:flex gap-8 text-sm font-medium text-brand-light/80">
            <Link href="#functionality" className="hover:text-brand-primary transition-colors">Core</Link>
            <Link href="#standards" className="hover:text-brand-primary transition-colors">Standards</Link>
            <Link href="#legal" className="hover:text-brand-primary transition-colors">Legal</Link>
            <Link href="#lifecycle" className="hover:text-brand-primary transition-colors">Process</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-brand-light hover:text-brand-primary py-2 px-4 transition-colors">Log in</Link>
            <Link href="/register" className="text-sm font-bold bg-brand-primary text-brand-dark py-2 px-5 rounded-full hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section (Unchanged visually, tailored text) --- */}
      <section className="relative min-h-screen flex items-center pt-20 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.08),transparent_70%)]" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-brand-dark to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="inline-block px-3 py-1 rounded-full border border-brand-primary/20 bg-brand-primary/5 text-brand-primary text-xs font-bold tracking-widest uppercase mb-6">
              Regulated RWA Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight mb-6 tracking-tight text-brand-light">
              Real Estate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-light">
                Tokenization Infrastructure
              </span>
            </h1>
            <p className="text-lg text-brand-light/70 mb-8 max-w-lg leading-relaxed">
              ours is a Web3 platform enabling fractional investment in real properties via compliant security tokens. Fully regulated, transparent, and liquid.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register" className="group flex justify-center items-center gap-2 bg-brand-light text-brand-dark px-8 py-4 rounded-lg font-bold hover:bg-brand-primary hover:text-brand-dark transition-colors">
                Start Investing
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="#standards" className="flex justify-center items-center gap-2 px-8 py-4 rounded-lg font-bold text-brand-light border border-brand-primary/30 hover:bg-brand-primary/10 transition-colors">
                Technical Specs
              </Link>
            </div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative h-[500px] w-full flex items-center justify-center"
          >
             <div className="relative w-80 h-[420px] bg-brand-navy border border-brand-primary/30 rounded-2xl overflow-hidden shadow-2xl shadow-brand-primary/10 z-20">
              <div className="h-1/2 bg-brand-dark/60 relative flex items-center justify-center border-b border-brand-primary/10">
                <Building className="w-16 h-16 text-brand-primary/40" />
                <div className="absolute bottom-4 left-6 bg-brand-dark/80 px-3 py-1 rounded text-xs text-brand-primary border border-brand-primary/20">
                  PALERMO-TOWER-01
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="text-xs text-brand-light/50 uppercase">Token Standard</div>
                  <div className="text-brand-light font-mono">ERC-3643 (T-REX)</div>
                </div>
                <div className="flex justify-between">
                   <div>
                      <div className="text-xs text-brand-light/50 uppercase">Supply</div>
                      <div className="text-brand-light font-mono">5,000 PT01</div>
                   </div>
                   <div className="text-right">
                      <div className="text-xs text-brand-light/50 uppercase">Unit Price</div>
                      <div className="text-brand-primary font-bold">20 USDC</div>
                   </div>
                </div>
                <div className="pt-2 border-t border-brand-primary/20 flex items-center gap-2 text-xs text-brand-light/60">
                  <CheckCircle className="w-3 h-3 text-green-500" /> KYC Verified
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Core Functionality --- */}
      <section id="functionality" className="py-20 bg-brand-navy/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
               initial="hidden" 
               whileInView="visible" 
               viewport={{ once: true }} 
               variants={staggerContainer}
            >
              <h2 className="text-3xl font-bold mb-6 text-brand-light">Core Functionality</h2>
              <p className="text-brand-light/70 mb-8 leading-relaxed">
                On <span className="font-bold text-brand-primary">ours</span>, verified real-estate developers can onboard projects, define token supply, and raise capital through regulated standards. 
                For users, ownership is recorded on-chain, ensuring transparency, immutability, and legally enforceable rights.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-brand-primary"><Globe className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-bold text-brand-light">Accessible Marketplace</h3>
                    <p className="text-sm text-brand-light/60 mt-1">Investors complete KYC, connect a wallet, and purchase fractional tokens representing economic rights.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                   <div className="mt-1 w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 text-brand-primary"><RefreshCw className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-bold text-brand-light">Secondary Liquidity</h3>
                    <p className="text-sm text-brand-light/60 mt-1">Controlled secondary market allows exit during the 12–24 month development cycle, strictly between KYC-verified wallets.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-brand-dark p-6 rounded-xl border border-brand-primary/20">
                    <h4 className="text-brand-primary font-bold mb-2">Developer</h4>
                    <ul className="text-xs text-brand-light/60 space-y-2">
                        <li>• Upload Legal Docs</li>
                        <li>• Define Token Supply</li>
                        <li>• Push Oracle Updates</li>
                        <li>• Distribute Yield</li>
                    </ul>
                </div>
                <div className="bg-brand-dark p-6 rounded-xl border border-brand-primary/20 mt-8">
                    <h4 className="text-brand-primary font-bold mb-2">Investor</h4>
                    <ul className="text-xs text-brand-light/60 space-y-2">
                        <li>• Complete KYC/KYB</li>
                        <li>• Buy Fractional Tokens</li>
                        <li>• Track Progress</li>
                        <li>• Receive Dividends</li>
                    </ul>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Regulated Standards (Technical) --- */}
      <section id="standards" className="py-24 bg-brand-dark relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/3 h-full bg-brand-primary/5 blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeIn}
            className="text-center mb-16"
          >
            <div className="text-brand-primary text-sm font-bold uppercase tracking-widest mb-3">Infrastructure</div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-brand-light">Regulated Tokenization Standards</h2>
            <p className="text-brand-light/70 max-w-2xl mx-auto">
              We use institutional-grade frameworks widely adopted by European RWA providers.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* ERC 1400 */}
            <div className="p-8 rounded-2xl border border-brand-light/10 bg-brand-light/5 hover:border-brand-primary/40 transition-colors">
                <div className="flex items-center gap-3 mb-4">
                    <Server className="w-6 h-6 text-brand-primary" />
                    <h3 className="text-xl font-bold text-brand-light">ERC-1400</h3>
                </div>
                <p className="text-sm text-brand-light/60 mb-6 h-10">The institutional standard for regulated RWAs used in real estate, bonds, and equity.</p>
                <ul className="space-y-3">
                    {['Transfer restrictions (KYC/KYB)', 'Partitioned tokens (tranches)', 'Modular compliance framework', 'Permissioned minting/burning'].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-brand-light/80">
                            <CheckCircle className="w-4 h-4 text-brand-primary mt-0.5" /> {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* ERC 3643 */}
            <div className="p-8 rounded-2xl border border-brand-primary/50 bg-brand-navy shadow-lg shadow-brand-primary/10 relative">
                <div className="absolute top-4 right-4 bg-brand-primary text-brand-dark text-[10px] font-bold px-2 py-1 rounded">PRIMARY STANDARD</div>
                <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-brand-primary" />
                    <h3 className="text-xl font-bold text-brand-light">ERC-3643 (T-REX)</h3>
                </div>
                <p className="text-sm text-brand-light/60 mb-6 h-10">The modern evolution offering continuous automated compliance and identity-based control.</p>
                <ul className="space-y-3">
                    {['IdentityRegistry for whitelisted wallets', 'Continuous automated compliance', 'Enterprise-grade permission layers', 'Enforced On-Chain Rules'].map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-brand-light/80">
                            <CheckCircle className="w-4 h-4 text-brand-primary mt-0.5" /> {item}
                        </li>
                    ))}
                </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- Legal & Transparency Grid --- */}
      <section id="legal" className="py-24 bg-brand-navy border-y border-brand-primary/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-4 text-brand-light">Legal Model & Transparency</h2>
            <p className="text-brand-light/70 max-w-3xl">
              Fractional real estate implies an expectation of profit based on third-party efforts. 
              Therefore, our tokens are legally structured as securities to ensure enforceability.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Legal Structure */}
            <div className="col-span-1 md:col-span-2 bg-brand-dark/50 p-8 rounded-2xl border border-brand-primary/20">
                <h3 className="text-xl font-bold text-brand-light mb-6 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-brand-primary" /> Ownership Structures
                </h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div>
                        <h4 className="text-brand-light font-bold mb-2">A. Trust</h4>
                        <p className="text-xs text-brand-light/60">Property title held by a Trust (Fideicomiso). Token holders are beneficiaries.</p>
                    </div>
                    <div>
                        <h4 className="text-brand-light font-bold mb-2">B. SPV</h4>
                        <p className="text-xs text-brand-light/60">A dedicated Special Purpose Vehicle company owns the asset. Tokens represent equity.</p>
                    </div>
                    <div>
                        <h4 className="text-brand-light font-bold mb-2">C. Contractual</h4>
                        <p className="text-xs text-brand-light/60">Tokens represent the right to receive yield returns rather than direct ownership.</p>
                    </div>
                </div>
            </div>

            {/* Valuation */}
            <div className="bg-brand-dark/50 p-8 rounded-2xl border border-brand-primary/20">
                <h3 className="text-xl font-bold text-brand-light mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-brand-primary" /> Fair Value
                </h3>
                <p className="text-sm text-brand-light/60 mb-4">To prevent artificial inflation, listing requires:</p>
                <ul className="space-y-2 text-sm text-brand-light/80">
                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-brand-primary" /> Independent Valuation Committee</li>
                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-brand-primary" /> Licensed Appraisers</li>
                    <li className="flex gap-2"><CheckCircle className="w-4 h-4 text-brand-primary" /> Min. 2 valuations per asset</li>
                </ul>
            </div>

             {/* Transparency */}
             <div className="col-span-1 md:col-span-3 bg-brand-primary/5 p-8 rounded-2xl border border-brand-primary/10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-lg font-bold text-brand-light mb-2">Asset Transparency & Verification</h3>
                    <p className="text-sm text-brand-light/70">
                        Developers must provide verifiable updates via off-chain oracles, real cost documentation, and independent audits.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="px-4 py-2 bg-brand-dark rounded border border-brand-primary/30 text-xs font-mono text-brand-primary">Oracle Feeds</div>
                    <div className="px-4 py-2 bg-brand-dark rounded border border-brand-primary/30 text-xs font-mono text-brand-primary">On-Chain Audit</div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Lifecycle / How it works --- */}
      <section id="lifecycle" className="py-24 bg-brand-dark">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-light">Asset Lifecycle</h2>
            <p className="text-brand-light/60">From onboarding to exit.</p>
          </div>

          <div className="relative border-l border-brand-primary/20 ml-4 md:ml-0 space-y-12">
            {[
              { title: 'Onboarding', desc: 'Developer uploads property and submits legal/financial documentation.' },
              { title: 'Legal Structure', desc: 'ours sets up the Trust or SPV to hold the asset.' },
              { title: 'Token Deployment', desc: 'New ERC-3643 contract deployed (e.g., PT01, Supply: 5,000).' },
              { title: 'Primary Sale', desc: 'Investors complete KYC, whitelist wallet, and buy tokens.' },
              { title: 'Development', desc: 'Developer posts milestones; Oracles push progress data on-chain.' },
              { title: 'Completion & Sale', desc: 'Property is completed and sold on the open market.' },
              { title: 'Distribution', desc: 'Funds are distributed proportionally to token holders via smart contract.' },
            ].map((step, index) => (
              <div key={index} className="relative pl-8 md:pl-12">
                <div className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-brand-primary shadow-[0_0_10px_rgba(14,165,233,0.5)]" />
                <h3 className="text-xl font-bold text-brand-light mb-1">
                  <span className="text-brand-primary mr-2">0{index + 1}.</span>{step.title}
                </h3>
                <p className="text-brand-light/60 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-brand-navy border-t border-brand-primary/20 py-12">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-8">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-4">
              <img src="/logo.svg" alt="Ours Logo" className="h-7 w-auto" />
              <span className="font-bold text-lg text-brand-light">ours</span>
            </Link>
            <p className="text-brand-light/60 text-sm mb-4">
              Bridging real estate and blockchain in a secure, institutional-grade environment.
            </p>
            <div className="text-xs text-brand-light/40">
                Contract: 0x...3643
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-brand-light">Platform</h4>
            <ul className="space-y-2 text-sm text-brand-light/70">
              <li><Link href="#" className="hover:text-brand-primary">Marketplace</Link></li>
              <li><Link href="#standards" className="hover:text-brand-primary">Security Standards</Link></li>
              <li><Link href="#lifecycle" className="hover:text-brand-primary">How it Works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-brand-light">Legal</h4>
            <ul className="space-y-2 text-sm text-brand-light/70">
              <li><Link href="#" className="hover:text-brand-primary">Risk Disclosure</Link></li>
              <li><Link href="#" className="hover:text-brand-primary">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-brand-primary">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4 text-brand-light">Newsletter</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-brand-dark border border-brand-primary/30 rounded px-3 py-2 text-sm w-full focus:outline-none focus:border-brand-primary text-brand-light placeholder:text-brand-light/50" />
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