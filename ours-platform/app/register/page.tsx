'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Wallet, Building2, ShieldCheck, CheckCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function RegisterContent() {
  const searchParams = useSearchParams();
  const [isKycInitiated, setIsKycInitiated] = useState(false);

  useEffect(() => {
    // Check if user came from World ID verification flow
    const kycInitiated = searchParams.get('kyc_initiated');
    if (kycInitiated === 'true') {
      setIsKycInitiated(true);
    }
  }, [searchParams]);
  return (
    <div className="min-h-screen bg-brand-dark text-brand-light flex">

      {/* Left Column - Visual & Value Prop */}
      <div className="hidden lg:flex w-1/2 relative bg-brand-navy overflow-hidden flex-col justify-between p-12 border-r border-brand-primary/20">
        {/* Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(175,203,255,0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgba(175,203,255,0.07)_1px,transparent_1px)] bg-[size:24px_24px]" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-8">
            <img src="/logo.svg" alt="Ours Logo" className="h-10 w-auto" />
            <img src="/logo tipografico celeste.svg" alt="Ours" className="h-7 w-auto" />
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-brand-light">
            Tokenize the world's<br /> <span className="text-brand-primary">prime real estate.</span>
          </h1>
          <p className="text-brand-light/70 max-w-md">
            Join the platform that is redefining property ownership through blockchain transparency and fractional liquidity.
          </p>
        </div>

        {/* Abstract Architectural Visual */}
        <div className="relative w-full h-64 mt-8">
           <motion.div
             initial={{ opacity: 0, y: 50 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1 }}
             className="absolute bottom-0 left-10 w-32 h-48 bg-gradient-to-t from-brand-primary/20 to-transparent border border-brand-primary/30 rounded-t-lg backdrop-blur-sm"
           />
           <motion.div
             initial={{ opacity: 0, y: 80 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1, delay: 0.2 }}
             className="absolute bottom-0 left-48 w-40 h-64 bg-gradient-to-t from-brand-primary/10 to-transparent border border-brand-primary/20 rounded-t-lg backdrop-blur-sm"
           />
           <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 1, delay: 0.4 }}
             className="absolute bottom-0 left-96 w-24 h-32 bg-gradient-to-t from-brand-primary/30 to-transparent border border-brand-primary/40 rounded-t-lg backdrop-blur-sm"
           />
        </div>

        <div className="relative z-10 flex gap-4 text-xs font-mono text-brand-primary/70">
          <span>EST. 2025</span>
          <span>BLOCKCHAIN VERIFIED</span>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md">

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl font-bold mb-2 text-brand-light">
              {isKycInitiated ? "Complete your profile" : "Create your account"}
            </h2>
            <p className="text-brand-light/70 text-sm mb-8">
              {isKycInitiated ? "Step 2 of 2: Complete registration with World ID verification" : "Step 1 of 2: Identity & Security"}
            </p>

            {/* World ID Verification Status */}
            {isKycInitiated && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-green-400 font-semibold text-sm">World ID Verified</p>
                  <p className="text-green-400/70 text-xs">Human verification completed successfully</p>
                </div>
              </div>
            )}

            {/* Progress Indicator */}
            <div className="w-full h-1 bg-brand-surface rounded-full mb-8 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: isKycInitiated ? '100%' : '50%' }}
                transition={{ duration: 1, ease: "circOut" }}
                className="h-full bg-brand-primary"
              />
            </div>

            <form className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="block text-xs uppercase tracking-wider text-brand-light/60 mb-1 font-semibold">First Name</label>
                  <input type="text" className="w-full bg-brand-surface border border-brand-primary/20 rounded-lg p-3 text-brand-light focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-wider text-brand-light/60 mb-1 font-semibold">Last Name</label>
                  <input type="text" className="w-full bg-brand-surface border border-brand-primary/20 rounded-lg p-3 text-brand-light focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-brand-light/60 mb-1 font-semibold">Email</label>
                <input type="email" className="w-full bg-brand-surface border border-brand-primary/20 rounded-lg p-3 text-brand-light focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all" />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-brand-light/60 mb-1 font-semibold">Password</label>
                <input type="password" className="w-full bg-brand-surface border border-brand-primary/20 rounded-lg p-3 text-brand-light focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all" />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-brand-light/60 mb-1 font-semibold">Confirm Password</label>
                <input type="password" className="w-full bg-brand-surface border border-brand-primary/20 rounded-lg p-3 text-brand-light focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none transition-all" />
              </div>

              {/* Wallet Connection Option */}
              <div className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-[1px] flex-1 bg-brand-primary/20"></div>
                  <span className="text-xs text-brand-light/60 uppercase">Or connect wallet</span>
                  <div className="h-[1px] flex-1 bg-brand-primary/20"></div>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01, backgroundColor: 'rgba(175, 203, 255, 0.1)' }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full border border-brand-primary/30 text-brand-primary font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Wallet className="w-4 h-4" />
                  Connect MetaMask / WalletConnect
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-brand-primary text-brand-dark font-bold py-3 rounded-lg mt-6 hover:bg-brand-accent transition-colors shadow-lg shadow-brand-primary/20"
              >
                Continue Registration
              </motion.button>
            </form>

            <p className="mt-6 text-center text-sm text-brand-light/60">
              Already have an account? <Link href="/login" className="text-brand-primary hover:underline">Sign in</Link>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}