'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring, 
  useInView, 
  AnimatePresence 
} from 'framer-motion';
import { 
  ArrowRight, Shield, PieChart, Building, 
  Lock, FileText, CheckCircle, RefreshCw, 
  Globe, Server, Activity, Box, Layers 
} from 'lucide-react';
import Link from 'next/link';

// --- Utility Components for Visual Effects ---

// 1. Architectural Background Grid
const ArchitecturalGrid = () => {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {/* Moving Grid Plane */}
      <div className="absolute inset-0 [perspective:1000px]">
        <motion.div
          animate={{ rotateX: [0, 0], translateY: [0, -50] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e910_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e910_1px,transparent_1px)] bg-[size:4rem_4rem] [transform:rotateX(60deg)] origin-top"
        />
      </div>
      {/* Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-primary/20 rounded-full blur-[128px] opacity-40" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[128px] opacity-40" />
    </div>
  );
};

// 2. Glowing "Scanner" Line for the Building Card
const ScannerLine = () => (
  <motion.div 
    animate={{ top: ['0%', '100%', '0%'] }}
    transition={{ duration: 4, ease: "easeInOut", repeat: Infinity }}
    className="absolute left-0 w-full h-[2px] bg-brand-primary shadow-[0_0_20px_2px_rgba(14,165,233,0.8)] z-20"
  />
);

// 3. Floating Particles
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-brand-primary rounded-full"
        initial={{ x: Math.random() * 100 + "%", y: Math.random() * 100 + "%", opacity: 0 }}
        animate={{ 
          y: [null, Math.random() * -100],
          opacity: [0, 0.8, 0] 
        }}
        transition={{ 
          duration: Math.random() * 10 + 10, 
          repeat: Infinity, 
          delay: Math.random() * 5 
        }}
      />
    ))}
  </div>
);

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <main className="min-h-screen bg-[#050b14] text-slate-200 font-sans selection:bg-brand-primary/30 selection:text-white overflow-x-hidden">
      
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary to-purple-500 origin-left z-[100]"
        style={{ scaleX }}
      />

      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-50 bg-[#050b14]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.5 }}
            >
              <img src="/logo.svg" alt="Ours Logo" className="h-8 w-auto" />
            </motion.div>
            <span className="font-bold text-xl tracking-tight text-white group-hover:text-brand-primary transition-colors">ours</span>
          </Link>
          <div className="hidden md:flex gap-8 text-sm font-medium text-slate-400">
            {['Core', 'Standards', 'Legal', 'Process'].map((item) => (
              <Link key={item} href={`#${item.toLowerCase()}`} className="hover:text-brand-primary hover:shadow-[0_1px_0_0_currentColor] transition-all pb-1">
                {item}
              </Link>
            ))}
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-slate-300 hover:text-white py-2 px-4 transition-colors">Log in</Link>
            <Link href="/register" className="relative group overflow-hidden rounded-full p-[1px]">
              <span className="absolute inset-0 bg-gradient-to-r from-brand-primary to-purple-600 rounded-full opacity-70 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-[#050b14] text-white text-sm font-bold py-2 px-6 rounded-full group-hover:bg-opacity-90 transition-all flex items-center gap-2">
                Get Started <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative min-h-screen flex items-center pt-28 pb-20 overflow-hidden">
        <ArchitecturalGrid />
        <FloatingParticles />

        <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-brand-primary/30 bg-brand-primary/10 text-brand-primary text-xs font-bold tracking-widest uppercase mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
              </span>
              Regulated RWA Platform
            </motion.div>
            
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6 tracking-tight text-white">
              Liquidity for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-cyan-400 to-purple-500">
                Tangible Assets
              </span>
            </h1>
            
            <p className="text-lg text-slate-400 mb-8 max-w-lg leading-relaxed border-l-2 border-brand-primary/20 pl-6">
              ours is a Web3 platform enabling fractional investment in real properties via compliant security tokens. Fully regulated, transparent, and liquid.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex justify-center items-center gap-2 bg-brand-primary text-[#050b14] px-8 py-4 rounded-lg font-bold hover:bg-brand-accent hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] transition-all"
              >
                Start Investing
                <ArrowRight className="w-4 h-4" />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02, borderColor: "rgba(255,255,255,0.5)" }}
                whileTap={{ scale: 0.98 }}
                className="flex justify-center items-center gap-2 px-8 py-4 rounded-lg font-bold text-white border border-white/10 hover:bg-white/5 transition-all"
              >
                Technical Specs
              </motion.button>
            </div>
          </motion.div>

          {/* Hero Visual: The Holographic Card */}
          <div className="relative h-[500px] w-full flex items-center justify-center perspective-[1000px]">
            <motion.div 
              initial={{ rotateY: -15, rotateX: 5, opacity: 0 }}
              animate={{ rotateY: -5, rotateX: 2, opacity: 1 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className="relative w-80 h-[450px] bg-[#0a1525]/90 backdrop-blur-md border border-brand-primary/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(14,165,233,0.1)] z-20 group"
            >
              {/* Scanner Effect */}
              <ScannerLine />
              
              {/* Card Content */}
              <div className="h-1/2 relative bg-gradient-to-b from-[#0f233a] to-[#0a1525] flex items-center justify-center border-b border-brand-primary/20 overflow-hidden">
                {/* Grid Overlay inside image */}
                <div className="absolute inset-0 bg-[linear-gradient(transparent_2px,#0a1525_2px),linear-gradient(90deg,transparent_2px,#0a1525_2px)] bg-[size:20px_20px] opacity-20" />
                <Building className="w-20 h-20 text-brand-primary drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                  <div className="bg-[#050b14]/80 backdrop-blur px-3 py-1 rounded border border-brand-primary/20 text-[10px] text-brand-primary font-mono">
                    PALERMO-TOWER-01
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-green-400 font-mono bg-green-900/20 px-2 py-1 rounded border border-green-500/20">
                    <Activity className="w-3 h-3" /> LIVE
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                <div className="space-y-1">
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Standard</div>
                  <div className="flex items-center justify-between">
                    <div className="text-white font-mono text-sm">ERC-3643 (T-REX)</div>
                    <Shield className="w-4 h-4 text-brand-primary" />
                  </div>
                  {/* Progress Bar simulation */}
                  <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 2, delay: 1 }}
                      className="h-full bg-brand-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">Supply</div>
                      <div className="text-white font-mono text-lg">5,000</div>
                   </div>
                   <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider">APY</div>
                      <div className="text-green-400 font-mono text-lg font-bold">12.4%</div>
                   </div>
                </div>
              </div>
            </motion.div>

            {/* Floating Elements Behind */}
            <motion.div 
              animate={{ y: [-10, 10, -10], rotate: [0, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-10 top-20 bg-[#0f233a] p-4 rounded-xl border border-brand-primary/20 shadow-xl z-10"
            >
              <PieChart className="w-8 h-8 text-purple-400" />
            </motion.div>
            <motion.div 
              animate={{ y: [10, -10, 10], rotate: [0, -5, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="absolute -left-10 bottom-32 bg-[#0f233a] p-4 rounded-xl border border-brand-primary/20 shadow-xl z-30"
            >
              <Lock className="w-8 h-8 text-cyan-400" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Core Functionality --- */}
      <section id="core" className="py-24 bg-[#08101c] relative">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">Core Functionality</h2>
              <p className="text-slate-400 mb-8 leading-relaxed text-lg">
                Verified developers onboard projects and define token supplies. Investors gain <span className="text-white font-semibold">fractional economic rights</span> recorded immutably on-chain.
              </p>
              
              <div className="space-y-6">
                {[
                    { icon: <Globe className="w-5 h-5" />, title: "Accessible Marketplace", desc: "Global access via compliant wallet connection." },
                    { icon: <RefreshCw className="w-5 h-5" />, title: "Secondary Liquidity", desc: "Controlled exit mechanisms via KYC-gated pools." }
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        whileHover={{ x: 10 }}
                        className="flex gap-4 group cursor-default"
                    >
                        <div className="mt-1 w-12 h-12 bg-brand-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 text-brand-primary group-hover:bg-brand-primary group-hover:text-[#050b14] transition-colors duration-300">
                            {item.icon}
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">{item.title}</h3>
                            <p className="text-sm text-slate-500 mt-1 group-hover:text-slate-300 transition-colors">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                    { role: "Developer", items: ["Upload Legal Docs", "Define Supply", "Oracle Updates", "Yield Distro"], color: "border-brand-primary/30" },
                    { role: "Investor", items: ["KYC/KYB Check", "Buy Fragments", "Track Progress", "Receive Yield"], color: "border-purple-500/30" }
                ].map((card, idx) => (
                    <motion.div 
                        key={idx}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.2 }}
                        whileHover={{ y: -5 }}
                        className={`bg-[#0b1729] p-8 rounded-2xl border ${card.color} hover:border-opacity-100 hover:bg-[#0f2038] transition-all duration-300 shadow-lg`}
                    >
                        <h4 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                            {idx === 0 ? <Layers className="w-5 h-5 text-brand-primary"/> : <Box className="w-5 h-5 text-purple-500"/>}
                            {card.role}
                        </h4>
                        <ul className="space-y-3">
                            {card.items.map((li, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm text-slate-400">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600" /> {li}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* --- Regulated Standards --- */}
      <section id="standards" className="py-24 bg-[#050b14] relative overflow-hidden">
        {/* Abstract Background Shapes */}
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-b from-brand-primary/5 to-transparent opacity-50" />
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="text-brand-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">Infrastructure</div>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Security Standards</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Leveraging institutional-grade ERC frameworks used by major European banks.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* ERC 1400 Card */}
            <motion.div 
                whileHover={{ scale: 1.01 }}
                className="group relative p-8 rounded-2xl bg-[#08101c] border border-white/5 overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-lg bg-slate-800 text-slate-200"><Server className="w-6 h-6" /></div>
                        <h3 className="text-2xl font-bold text-white">ERC-1400</h3>
                    </div>
                    <ul className="space-y-4">
                        {['Transfer restrictions (KYC/KYB)', 'Partitioned tokens (Tranches)', 'Permissioned minting/burning'].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                                <CheckCircle className="w-5 h-5 text-slate-600 group-hover:text-brand-primary transition-colors" /> 
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </motion.div>

            {/* ERC 3643 Card (Highlighted) */}
            <motion.div 
                whileHover={{ scale: 1.02 }}
                className="group relative p-1 rounded-2xl bg-gradient-to-br from-brand-primary via-purple-500 to-brand-primary bg-[length:200%_200%] animate-gradient-xy"
            >
                <div className="h-full bg-[#0b1729] rounded-xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 px-4 py-1 bg-brand-primary text-[#050b14] text-[10px] font-bold rounded-bl-xl">PREFERRED STANDARD</div>
                    
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-lg bg-brand-primary/20 text-brand-primary"><Shield className="w-6 h-6" /></div>
                        <h3 className="text-2xl font-bold text-white">ERC-3643 (T-REX)</h3>
                    </div>
                    <ul className="space-y-4">
                        {['IdentityRegistry Whitelisting', 'Automated On-Chain Compliance', 'Recovery Mechanisms'].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                <CheckCircle className="w-5 h-5 text-brand-primary" /> 
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Lifecycle Timeline (Animated) --- */}
      <section id="process" className="py-24 bg-[#08101c] relative">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white">Asset Lifecycle</h2>
            <p className="text-slate-500">Regulated journey from onboarding to exit.</p>
          </div>

          {/* Timeline Component */}
          <div className="relative space-y-12">
            {/* The Vertical Line */}
            <div className="absolute left-[19px] top-2 bottom-0 w-[2px] bg-slate-800" />
            <motion.div 
              style={{ scaleY: scrollYProgress }} 
              className="absolute left-[19px] top-2 bottom-0 w-[2px] bg-brand-primary origin-top z-0" 
            />

            {[
              { title: 'Onboarding & Legal', desc: 'Developer uploads property; Trust/SPV structure is established.' },
              { title: 'Token Deployment', desc: 'ERC-3643 contract deployed (IdentityRegistry linked).' },
              { title: 'Primary Sale', desc: 'Investors whitelist via KYC and purchase fractional tokens.' },
              { title: 'Development Phase', desc: 'Oracles push construction milestones on-chain.' },
              { title: 'Exit & Distribution', desc: 'Asset sold; Smart Contract distributes capital + yield.' },
            ].map((step, index) => (
              <TimelineItem key={index} step={step} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-[#050b14] border-t border-white/10 py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <img src="/logo.svg" alt="Ours Logo" className="h-8 w-auto opacity-80" />
              <span className="font-bold text-xl text-white">ours</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              The bridge between tangible real estate and digital liquidity. Institutional grade.
            </p>
          </div>
          
          {[
            { head: "Platform", links: ["Marketplace", "Security", "Technology"] },
            { head: "Legal", links: ["Terms", "Privacy", "Risk Disclosure"] }
          ].map((col, idx) => (
             <div key={idx}>
                <h4 className="font-bold text-white mb-6">{col.head}</h4>
                <ul className="space-y-3 text-sm text-slate-500">
                    {col.links.map(l => <li key={l}><a href="#" className="hover:text-brand-primary transition-colors">{l}</a></li>)}
                </ul>
             </div>
          ))}

          <div>
            <h4 className="font-bold text-white mb-6">Updates</h4>
            <div className="flex gap-2">
              <input type="email" placeholder="Enter email" className="bg-[#0b1729] border border-white/10 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:border-brand-primary text-white placeholder:text-slate-600 transition-colors" />
              <button className="bg-brand-primary text-[#050b14] px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-accent transition-colors">Join</button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Sub-component for Timeline to handle individual animations
function TimelineItem({ step, index }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { margin: "-50px 0px -50px 0px", once: true });

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, x: 20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="relative pl-16"
    >
      {/* The Dot */}
      <motion.div 
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className={`absolute left-0 top-1 w-10 h-10 rounded-full border-4 border-[#08101c] z-10 flex items-center justify-center
          ${isInView ? 'bg-brand-primary shadow-[0_0_15px_rgba(14,165,233,0.5)]' : 'bg-slate-800'}
        `}
      >
        <span className={`text-[10px] font-bold ${isInView ? 'text-[#050b14]' : 'text-slate-500'}`}>
          0{index + 1}
        </span>
      </motion.div>

      <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed max-w-md">{step.desc}</p>
    </motion.div>
  );
}