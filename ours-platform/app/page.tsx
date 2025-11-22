'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Globe, 
  RefreshCcw, 
  ShieldCheck, 
  CheckCircle2, 
  Instagram, 
  Linkedin, 
  Twitter, // Representing X
  Smartphone
} from 'lucide-react';

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

// --- Componentes UI ---

const Button = ({ children, variant = 'primary', className = '' }: { children: React.ReactNode, variant?: 'primary' | 'outline', className?: string }) => {
  const baseStyle = "px-6 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2";
  const styles = {
    primary: "bg-[#B0C9FF] text-[#1E2046] hover:bg-white hover:scale-105",
    outline: "border border-white/30 text-white backdrop-blur-sm hover:bg-white/10"
  };

  return (
    <motion.button 
      whileTap={{ scale: 0.95 }}
      className={`${baseStyle} ${styles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

const Logo = ({ dark = false }: { dark?: boolean }) => (
  <div className="flex items-center gap-1">
    {/* Representación geométrica del logo "L" */}
    <div className={`relative w-8 h-10 ${dark ? 'text-[#1E2046]' : 'text-[#1E2046]'}`}>
      <div className="absolute left-0 top-0 w-4 h-full bg-[#1E2046] rounded-tl-md rounded-bl-md"></div>
      <div className="absolute left-4 top-0 w-6 h-6 bg-[#B0C9FF] rounded-tr-md"></div>
    </div>
    <span className={`text-3xl font-extrabold tracking-tight ${dark ? 'text-[#1E2046]' : 'text-[#1E2046]'}`}>
      ours
    </span>
  </div>
);

const TokenCard = () => (
  <div className="bg-[#1E2046] text-white p-6 rounded-2xl shadow-2xl w-64 mx-auto font-mono text-xs relative border border-white/10">
    <div className="absolute top-4 right-4 opacity-50">
      <Smartphone size={20} />
    </div>
    <div className="mt-8 mb-4 text-gray-400">TOKEN STANDARD</div>
    <div className="text-lg font-bold text-[#B0C9FF] mb-4">ERC-3643 (T-REX)</div>
    
    <div className="flex justify-between mb-2">
      <span className="text-gray-400">SUPPLY</span>
      <span>5,000 PT01</span>
    </div>
    <div className="flex justify-between mb-6">
      <span className="text-gray-400">UNIT PRICE</span>
      <span>20 USDC</span>
    </div>
    
    <div className="flex items-center gap-2 text-green-400">
      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
      KYC Verified
    </div>
  </div>
);

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] font-sans text-[#1E2046] overflow-x-hidden">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 bg-[#FDFBF7]/80 backdrop-blur-md py-4">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Logo />
          
          <div className="hidden md:flex items-center gap-8 font-medium text-sm">
            {['Core', 'Standards', 'Legal', 'Process'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-[#4A569D] transition-colors">
                {item}
              </a>
            ))}
          </div>
          <div className="md:hidden">
            {/* Mobile Menu Placeholder */}
            <div className="w-6 h-6 bg-[#1E2046] rounded-sm"></div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-28 pb-0 md:pt-32 bg-[#1E2046] overflow-hidden">
        <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
          
          {/* Left Content */}
          <motion.div 
            initial="hidden" 
            animate="visible" 
            variants={staggerContainer}
            className="pb-16 md:pb-32 text-white"
          >
            <motion.div variants={fadeIn} className="inline-block mb-6">
              <span className="border border-white/30 px-4 py-1.5 rounded-full text-xs tracking-wider font-semibold uppercase backdrop-blur-sm">
                Regulated RWA Platform
              </span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8">
              Real Estate <br />
              <span className="text-[#B0C9FF]">Tokenization</span> <br />
              Infrastructure
            </motion.h1>

            <motion.div variants={fadeIn}>
              <Button>
                Start Investing <ArrowRight size={18} />
              </Button>
            </motion.div>
          </motion.div>

          {/* Right Visual (Light Blue L-Shape) */}
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="relative h-full min-h-[400px] md:min-h-[500px] flex items-center justify-center"
          >
            {/* The Light Blue Background Shape */}
            <div className="absolute top-0 right-[-50%] md:right-[-20%] w-[140%] h-full bg-[#B0C9FF] rounded-tl-[80px] shadow-[-20px_20px_60px_rgba(0,0,0,0.2)]">
              {/* Note from design: "acá iria esto pero usando todo el azul oscuro" */}
              <div className="absolute inset-0 flex items-center justify-center pr-20 md:pr-40 pt-20">
                <motion.div 
                  whileHover={{ y: -10 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <TokenCard />
                </motion.div>
              </div>
              
              {/* Decorative text mirroring the design */}
              <div className="absolute bottom-10 right-1/2 translate-x-1/2 text-[#1E2046] opacity-20 font-bold text-9xl hidden lg:block pointer-events-none">
                ours
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Core Functionality Strip */}
        <div className="bg-[#242458] py-4 relative z-20">
             <div className="container mx-auto px-6">
                <h3 className="text-[#B0C9FF] text-2xl md:text-3xl font-bold text-right md:text-center lg:text-right">
                    Core Functionality
                </h3>
             </div>
        </div>
      </section>

      {/* --- FEATURES / CORE FUNCTIONALITY --- */}
      <section className="bg-[#FDFBF7] py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-start gap-6 group"
            >
              <div className="p-4 bg-[#1E2046] text-white rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Globe size={32} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2 text-[#1E2046]">Accessible Marketplace</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Global access to fractionalized real estate assets with lowered entry barriers.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex items-start gap-6 group"
            >
               <div className="p-4 bg-[#B0C9FF] text-[#1E2046] rounded-xl shadow-lg group-hover:rotate-180 transition-transform duration-500">
                <RefreshCcw size={32} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="text-xl font-bold mb-2 text-[#1E2046]">Secondary Liquidity</h4>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Trade tokens instantly on our regulated secondary market ecosystem.
                </p>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* --- REGULATED STANDARDS SECTION --- */}
      <section className="bg-[#B0C9FF] pt-20 pb-0 relative">
        <div className="container mx-auto px-6">
            
          <div className="grid lg:grid-cols-2 gap-12 mb-20">
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

          {/* The Large Dark Card Area */}
          <div className="relative w-full max-w-4xl mr-auto lg:ml-0">
             <motion.div 
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="bg-[#1E2046] text-white rounded-tr-[60px] rounded-tl-3xl p-8 md:p-12 relative z-10 shadow-2xl"
                style={{ borderBottomRightRadius: '100px' }} // Unique shape from design
             >
                <div className="flex flex-col md:flex-row gap-10">
                    
                    <div className="flex-1 space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <ShieldCheck className="text-[#B0C9FF]" size={32} />
                            <h3 className="text-2xl font-bold">ERC - 3643 (T-REX)</h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed mb-8">
                            The modern evolution offering continuous automated compliance and identify ... control
                        </p>

                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((_, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ x: -20, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center gap-3"
                                >
                                    <div className="text-[#B0C9FF] opacity-80">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <div className="h-2 w-32 bg-white/10 rounded-full"></div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Primary Standard Badge */}
                    <div className="flex items-end justify-end">
                         <div className="bg-[#B0C9FF] text-[#1E2046] px-4 py-2 rounded-lg text-sm font-bold">
                            Primary Standard
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
      <footer className="bg-[#FDFBF7] pt-20 pb-10">
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
                        { icon: Linkedin, label: "ours" },
                        { icon: Instagram, label: "ours" },
                        { icon: Twitter, label: "ours" }
                    ].map((social, idx) => (
                        <a 
                            key={idx} 
                            href="#" 
                            className="flex items-center gap-2 text-[#1E2046] hover:text-[#4A569D] transition-colors"
                        >
                            <div className="bg-[#1E2046] text-white p-1.5 rounded-md">
                                <social.icon size={16} />
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